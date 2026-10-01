import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import JSZip from 'jszip';
import {
  BatchItem,
  TargetFormat,
  ConversionOptions,
  StructuredDocument,
  HistoryRecord,
} from './types/document';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import { uploadFileToDrive } from './services/driveService';
import { generateWordDocument } from './services/docxGenerator';
import { generateExcelWorkbook } from './services/excelGenerator';
import { SampleDoc } from './services/sampleDocuments';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { BatchQueue } from './components/BatchQueue';
import { LiveUploadMonitor } from './components/LiveUploadMonitor';
import { DocumentStudio } from './components/DocumentStudio';
import { DriveBrowserModal } from './components/DriveBrowserModal';
import { CloudSyncSettings } from './components/CloudSyncSettings';
import { ConversionHistory } from './components/ConversionHistory';
import { DocumentChatbot } from './components/DocumentChatbot';
import { AppStoreExportModal } from './components/AppStoreExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'converter' | 'studio' | 'history' | 'drive'>('converter');
  const [user, setUser] = useState<User | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState<boolean>(false);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);

  // Batch items state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [activeStudioItem, setActiveStudioItem] = useState<BatchItem | null>(null);
  const [isProcessingAny, setIsProcessingAny] = useState<boolean>(false);

  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const pendingQueueActionRef = useRef<'convert' | 'translate'>('convert');

  const handleOpenFilePicker = (action: 'convert' | 'translate') => {
    pendingQueueActionRef.current = action;
    hiddenFileInputRef.current?.click();
  };

  // Conversion History records (persisted in localStorage)
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('omnidoc_history_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load history from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('omnidoc_history_v1', JSON.stringify(historyRecords));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [historyRecords]);

  // Conversion settings
  const [options, setOptions] = useState<ConversionOptions>({
    preserveStyles: true,
    detectTablesStrict: true,
    autoSyncToDrive: false,
    headerShadingColor: '#1E3A8A',
    driveFolderName: 'OmniDoc Conversions',
    targetLanguage: 'none',
    sourceLanguage: 'auto',
  });

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setHasDriveToken(!!token);
        setDriveToken(token);
      },
      () => {
        setUser(null);
        setHasDriveToken(false);
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleConnectDrive = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setHasDriveToken(true);
        setDriveToken(res.accessToken);
      }
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      await logout();
      setUser(null);
      setHasDriveToken(false);
      setDriveToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Read File to Base64 with live byte-level progress reporting
  const readFileWithLiveProgress = (file: File, itemId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const startTime = Date.now();

      reader.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const percent = Math.min(95, Math.round((e.loaded / e.total) * 100));
          const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
          const bytesSec = e.loaded / elapsedSec;
          const speedStr = `${(bytesSec / (1024 * 1024)).toFixed(1)} MB/s`;

          setBatchItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    uploadProgress: percent,
                    bytesUploaded: e.loaded,
                    uploadSpeed: speedStr,
                    statusMessage: `Uploading: ${percent}% • ${speedStr}`,
                  }
                : i
            )
          );
        }
      };

      reader.onload = () => {
        const result = reader.result as string;
        setBatchItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  uploadProgress: 100,
                  bytesUploaded: file.size,
                  uploadCompletedAt: Date.now(),
                  base64Data: result,
                  status: 'queued',
                  statusMessage: 'Upload verified • Ready to process',
                }
              : i
          )
        );
        resolve(result);
      };

      reader.onerror = (err) => {
        setBatchItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: 'error',
                  error: 'Failed to read file',
                  statusMessage: 'Upload failed',
                }
              : i
          )
        );
        reject(err);
      };

      reader.readAsDataURL(file);
    });
  };

  // Add uploaded local files to queue with live upload status
  const handleFilesSelected = async (
    files: File[],
    format: TargetFormat,
    autoAction?: 'convert' | 'translate'
  ) => {
    // 1. Instantly register items in the live upload monitor
    const initialItems: BatchItem[] = files.map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      name: file.name,
      size: file.size,
      file,
      targetFormat: format,
      status: 'uploading',
      progress: 0,
      uploadProgress: 8,
      bytesUploaded: Math.round(file.size * 0.08),
      uploadStartTime: Date.now(),
      statusMessage: 'Uploading & verifying document structure...',
      driveStatus: 'unsynced',
    }));

    setBatchItems((prev) => [...prev, ...initialItems]);

    // 2. Read each file with live progress events
    const readyItems: BatchItem[] = [];
    for (const item of initialItems) {
      if (!item.file) continue;
      try {
        const base64 = await readFileWithLiveProgress(item.file, item.id);
        readyItems.push({
          ...item,
          base64Data: base64,
          status: 'queued',
          uploadProgress: 100,
          bytesUploaded: item.size,
          uploadCompletedAt: Date.now(),
          statusMessage: 'Ready to process',
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    // 3. If autoAction was triggered by clicking Convert or Translate before selecting files:
    if (autoAction === 'convert') {
      setTimeout(() => {
        for (const item of readyItems) {
          processItem(item.id);
        }
      }, 100);
    } else if (autoAction === 'translate') {
      setTimeout(() => {
        const lang = options.targetLanguage !== 'none' ? options.targetLanguage : 'Spanish';
        for (const item of readyItems) {
          processItem(item.id, { targetLanguage: lang, sourceLanguage: options.sourceLanguage });
        }
      }, 100);
    }
  };

  // Add sample document to queue
  const handleSampleSelected = (sample: SampleDoc, format: TargetFormat) => {
    const newItem: BatchItem = {
      id: `sample-${Date.now()}-${sample.id}`,
      name: sample.name,
      size: sample.size,
      targetFormat: format,
      status: 'queued',
      progress: 0,
      structuredData: sample.mockData,
      driveStatus: 'unsynced',
    };

    setBatchItems((prev) => [...prev, newItem]);
  };

  // Add files imported from Google Drive
  const handleImportDriveFiles = (
    imported: { file: File; base64: string }[],
    format: TargetFormat
  ) => {
    const newItems: BatchItem[] = imported.map((item) => ({
      id: `drive-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: item.file.name,
      size: item.file.size,
      file: item.file,
      base64Data: item.base64,
      targetFormat: format,
      status: 'queued',
      progress: 0,
      driveStatus: 'unsynced',
    }));

    setBatchItems((prev) => [...prev, ...newItems]);
  };

  // Core conversion processor for single item
  const processItem = useCallback(
    async (
      itemId: string,
      translateConfig?: { targetLanguage: string; sourceLanguage?: string }
    ) => {
      const item = batchItems.find((i) => i.id === itemId);
      if (!item) return;

      const startTime = Date.now();

      const updateItem = (updates: Partial<BatchItem>) => {
        setBatchItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
        );
      };

      try {
        const isTranslating = Boolean(
          translateConfig?.targetLanguage &&
            translateConfig.targetLanguage !== 'none' &&
            translateConfig.targetLanguage !== 'Original (No Translation)'
        );

        const targetLang = isTranslating ? translateConfig!.targetLanguage : undefined;
        const sourceLang = isTranslating ? translateConfig?.sourceLanguage : undefined;

        let structuredData = item.structuredData;

        // Stage progress simulation while network call is active
        let progressTimer: NodeJS.Timeout | null = null;
        if (!structuredData) {
          progressTimer = setInterval(() => {
            setBatchItems((prev) =>
              prev.map((i) => {
                if (i.id !== itemId || i.status === 'completed' || i.status === 'error') return i;
                if (i.progress < 75) {
                  const nextProg = i.progress + 6;
                  let stepMsg = i.statusMessage;
                  if (nextProg >= 35 && nextProg < 50) {
                    stepMsg = isTranslating
                      ? `Translating text blocks into ${targetLang}...`
                      : 'Gemini Vision: Extracting fonts & typography...';
                  } else if (nextProg >= 50 && nextProg < 65) {
                    stepMsg = 'Scanning table borders, numerical cells & formulas...';
                  } else if (nextProg >= 65) {
                    stepMsg = 'Constructing document layout models...';
                  }
                  return { ...i, progress: nextProg, statusMessage: stepMsg };
                }
                return i;
              })
            );
          }, 700);
        }

        try {
          // If the document is already converted and the user clicked "Translate", translate directly
          if (structuredData && isTranslating) {
            updateItem({
              status: 'translating',
              progress: 35,
              statusMessage: `Translating document into ${targetLang}...`,
              targetLanguage: targetLang,
            });

            const transRes = await fetch('/api/document/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                document: structuredData,
                targetLanguage: targetLang,
                sourceLanguage: sourceLang !== 'auto' ? sourceLang : undefined,
              }),
            });

            if (!transRes.ok) {
              const errData = await transRes.json().catch(() => ({}));
              throw new Error(errData.error || `Translation Error (${transRes.status})`);
            }

            const transData = await transRes.json();
            if (transData.document) {
              structuredData = transData.document;
            }
          } else if (!structuredData && item.base64Data) {
            updateItem({
              status: isTranslating ? 'translating' : 'reading_ocr',
              progress: 25,
              statusMessage: isTranslating
                ? `Scanning and translating into ${targetLang}...`
                : 'Scanning text & typography with Gemini Vision OCR...',
              targetLanguage: targetLang,
            });

            const res = await fetch('/api/ocr/convert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileBase64: item.base64Data,
                fileName: item.name,
                targetFormat: item.targetFormat,
                targetLanguage: targetLang,
                sourceLanguage: sourceLang !== 'auto' ? sourceLang : undefined,
              }),
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || `Server OCR Error (${res.status})`);
            }

            const data = await res.json();
            structuredData = data.document;
          }
        } finally {
          if (progressTimer) clearInterval(progressTimer);
        }

        if (!structuredData) {
          throw new Error('Unable to extract structured document.');
        }

        updateItem({
          status: 'reconstructing_layout',
          progress: 80,
          statusMessage: isTranslating
            ? `Reconstructing layout with ${targetLang} translations...`
            : 'Reconstructing headings, tables, and styles...',
          structuredData,
          targetLanguage: targetLang,
        });

        updateItem({
          status: 'generating_files',
          progress: 90,
          statusMessage: 'Compiling editable Word and Excel documents...',
        });

        // Generate Word docx
        let docxBlob: Blob | undefined;
        if (item.targetFormat === 'word' || item.targetFormat === 'both') {
          docxBlob = await generateWordDocument(structuredData, {
            primaryColor: options.headerShadingColor,
          });
        }

        // Generate Excel xlsx
        let xlsxBlob: Blob | undefined;
        if (item.targetFormat === 'excel' || item.targetFormat === 'both') {
          xlsxBlob = await generateExcelWorkbook(structuredData);
        }

        // Auto-sync to Google Drive if configured
        let driveStatus: BatchItem['driveStatus'] = 'unsynced';
        let driveWordLink: string | undefined;
        let driveExcelLink: string | undefined;

        const token = await getAccessToken();
        if (options.autoSyncToDrive && token) {
          updateItem({
            status: 'syncing_cloud',
            progress: 90,
            statusMessage: 'Synchronizing with Google Drive...',
          });

          try {
            const baseFileName = item.name.replace(/\.[^/.]+$/, '');

            if (docxBlob) {
              const docxRes = await uploadFileToDrive(
                token,
                `${baseFileName}_Editable.docx`,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                docxBlob,
                options.driveFolderName
              );
              driveWordLink = docxRes.webViewLink;
            }

            if (xlsxBlob) {
              const xlsxRes = await uploadFileToDrive(
                token,
                `${baseFileName}_Data.xlsx`,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                xlsxBlob,
                options.driveFolderName
              );
              driveExcelLink = xlsxRes.webViewLink;
            }

            driveStatus = 'synced';
          } catch (driveErr) {
            console.warn('Auto-sync to Google Drive failed:', driveErr);
            driveStatus = 'failed';
          }
        }

        updateItem({
          status: 'completed',
          progress: 100,
          statusMessage: isTranslating ? `Translated to ${targetLang}` : 'Converted successfully',
          docxBlob,
          xlsxBlob,
          driveStatus,
          driveWordLink,
          driveExcelLink,
          targetLanguage: targetLang,
        });

        // Record in history log
        const historyRecord: HistoryRecord = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: new Date().toISOString(),
          fileName: item.name,
          fileSize: item.size,
          targetFormat: item.targetFormat,
          sourceLanguage: sourceLang !== 'auto' ? sourceLang : undefined,
          targetLanguage: targetLang,
          status: 'completed',
          confidenceScore: structuredData.confidenceScore || 0.98,
          durationMs: Date.now() - startTime,
          tableCount: structuredData.spreadsheets?.length || 0,
          pageCount: structuredData.pages?.length || 1,
          ocrSummary:
            structuredData.ocrSummary ||
            (isTranslating ? `Translated to ${targetLang}` : 'Successfully converted document'),
          driveSynced: driveStatus === 'synced',
          driveWordLink,
          driveExcelLink,
          structuredData,
        };

        setHistoryRecords((prev) => [historyRecord, ...prev]);
      } catch (err: any) {
        console.error('Process item error:', err);
        updateItem({
          status: 'error',
          error: err.message || 'Operation failed',
          statusMessage: 'Operation failed',
        });

        const failedRecord: HistoryRecord = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: new Date().toISOString(),
          fileName: item.name,
          fileSize: item.size,
          targetFormat: item.targetFormat,
          status: 'failed',
          tableCount: 0,
          pageCount: 1,
          error: err.message || 'Operation failed',
          driveSynced: false,
        };
        setHistoryRecords((prev) => [failedRecord, ...prev]);
      }
    },
    [batchItems, options]
  );

  // Pure Convert handler for single item (preserves original language)
  const handleProcessSingleItem = async (id: string) => {
    setIsProcessingAny(true);
    await processItem(id);
    setIsProcessingAny(false);
  };

  // Pure Translate handler for single item (invokes translation)
  const handleTranslateSingleItem = async (
    id: string,
    targetLanguage: string,
    sourceLanguage?: string
  ) => {
    setIsProcessingAny(true);
    await processItem(id, { targetLanguage, sourceLanguage });
    setIsProcessingAny(false);
  };

  // Pure Convert All handler (preserves original language)
  const handleStartProcessingAll = async () => {
    setIsProcessingAny(true);
    const queued = batchItems.filter((i) => i.status === 'queued');

    for (const item of queued) {
      await processItem(item.id);
    }
    setIsProcessingAny(false);
  };

  // Pure Translate All handler (invokes translation)
  const handleTranslateAll = async (
    targetLanguage: string,
    sourceLanguage?: string
  ) => {
    setIsProcessingAny(true);
    const queued = batchItems.filter((i) => i.status === 'queued');

    for (const item of queued) {
      await processItem(item.id, { targetLanguage, sourceLanguage });
    }
    setIsProcessingAny(false);
  };

  const handleRemoveItem = (id: string) => {
    setBatchItems((prev) => prev.filter((i) => i.id !== id));
    if (activeStudioItem?.id === id) {
      setActiveStudioItem(null);
    }
  };

  const handleClearCompleted = () => {
    setBatchItems((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  // Download helpers
  const handleDownloadDocx = (item: BatchItem) => {
    if (!item.docxBlob) return;
    const url = URL.createObjectURL(item.docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.replace(/\.[^/.]+$/, '')}_Editable.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadXlsx = (item: BatchItem) => {
    if (!item.xlsxBlob) return;
    const url = URL.createObjectURL(item.xlsxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name.replace(/\.[^/.]+$/, '')}_Spreadsheet.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Word from History Record
  const handleDownloadHistoryWord = async (record: HistoryRecord) => {
    if (!record.structuredData) return;
    const blob = await generateWordDocument(record.structuredData, {
      primaryColor: options.headerShadingColor,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.fileName.replace(/\.[^/.]+$/, '')}_Editable.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Excel from History Record
  const handleDownloadHistoryExcel = async (record: HistoryRecord) => {
    if (!record.structuredData) return;
    const blob = await generateExcelWorkbook(record.structuredData);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.fileName.replace(/\.[^/.]+$/, '')}_Spreadsheet.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Inspect History Record in Studio
  const handleInspectHistoryRecord = (record: HistoryRecord) => {
    if (!record.structuredData) return;
    const tempItem: BatchItem = {
      id: record.id,
      name: record.fileName,
      size: record.fileSize,
      targetFormat: record.targetFormat,
      status: 'completed',
      progress: 100,
      structuredData: record.structuredData,
      driveStatus: record.driveSynced ? 'synced' : 'unsynced',
      driveWordLink: record.driveWordLink,
      driveExcelLink: record.driveExcelLink,
    };
    setActiveStudioItem(tempItem);
    setActiveTab('studio');
  };

  // Delete History Record
  const handleDeleteHistoryRecord = (id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearHistory = () => {
    setHistoryRecords([]);
  };

  // Batch ZIP Download
  const handleDownloadBatchZip = async () => {
    const completedItems = batchItems.filter((i) => i.status === 'completed');
    if (completedItems.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder('OmniDoc_Converted_Batch');

    for (const item of completedItems) {
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      if (item.docxBlob) {
        folder?.file(`${baseName}.docx`, item.docxBlob);
      }
      if (item.xlsxBlob) {
        folder?.file(`${baseName}.xlsx`, item.xlsxBlob);
      }
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipContent);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniDoc_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Manual Sync Single Item to Google Drive
  const handleSyncItemToDrive = async (item: BatchItem) => {
    const token = await getAccessToken();
    if (!token) {
      await handleConnectDrive();
      return;
    }

    setBatchItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, driveStatus: 'syncing' } : i
      )
    );

    try {
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      let wordLink = item.driveWordLink;
      let excelLink = item.driveExcelLink;

      if (item.docxBlob && !wordLink) {
        const res = await uploadFileToDrive(
          token,
          `${baseName}_Editable.docx`,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          item.docxBlob,
          options.driveFolderName
        );
        wordLink = res.webViewLink;
      }

      if (item.xlsxBlob && !excelLink) {
        const res = await uploadFileToDrive(
          token,
          `${baseName}_Spreadsheet.xlsx`,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          item.xlsxBlob,
          options.driveFolderName
        );
        excelLink = res.webViewLink;
      }

      setBatchItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                driveStatus: 'synced',
                driveWordLink: wordLink,
                driveExcelLink: excelLink,
              }
            : i
        )
      );

      // Update history record if present
      setHistoryRecords((prev) =>
        prev.map((r) =>
          r.fileName === item.name
            ? { ...r, driveSynced: true, driveWordLink: wordLink, driveExcelLink: excelLink }
            : r
        )
      );
    } catch (err: any) {
      console.error('Failed to sync to Drive:', err);
      setBatchItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, driveStatus: 'failed' } : i))
      );
    }
  };

  // Sync All Completed to Google Drive
  const handleSyncAllToDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      await handleConnectDrive();
      return;
    }

    const completed = batchItems.filter(
      (i) => i.status === 'completed' && i.driveStatus !== 'synced'
    );
    for (const item of completed) {
      await handleSyncItemToDrive(item);
    }
  };

  // Inspect in Studio
  const handleInspectItem = (item: BatchItem) => {
    setActiveStudioItem(item);
    setActiveTab('studio');
  };

  // Update document data edited in Studio
  const handleUpdateDocumentData = async (
    id: string,
    updatedData: StructuredDocument
  ) => {
    const docxBlob = await generateWordDocument(updatedData, {
      primaryColor: options.headerShadingColor,
    });
    const xlsxBlob = await generateExcelWorkbook(updatedData);

    setBatchItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              structuredData: updatedData,
              docxBlob,
              xlsxBlob,
            }
          : i
      )
    );

    if (activeStudioItem?.id === id) {
      setActiveStudioItem((prev) =>
        prev
          ? {
              ...prev,
              structuredData: updatedData,
              docxBlob,
              xlsxBlob,
            }
          : null
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        hasDriveToken={hasDriveToken}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
        batchCount={batchItems.length}
        historyCount={historyRecords.length}
        studioItemTitle={activeStudioItem?.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'converter' && (
          <div className="space-y-6">
            {/* Live Upload & Processing Status Monitor */}
            <LiveUploadMonitor
              items={batchItems}
              onCancelItem={handleRemoveItem}
            />

            <UploadZone
              onFilesSelected={handleFilesSelected}
              onSampleSelected={handleSampleSelected}
              onOpenDrivePicker={() => setIsDriveModalOpen(true)}
              options={options}
              setOptions={setOptions}
              hasDriveToken={hasDriveToken}
              onInvokeConvert={handleStartProcessingAll}
              onInvokeTranslate={handleTranslateAll}
              attachedCount={batchItems.length}
              isProcessing={isProcessingAny}
            />

            <input
              ref={hiddenFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const files = Array.from(e.target.files);
                  handleFilesSelected(files, 'both', pendingQueueActionRef.current);
                  e.target.value = '';
                }
              }}
            />

            <BatchQueue
              items={batchItems}
              onStartProcessingAll={handleStartProcessingAll}
              onTranslateAll={handleTranslateAll}
              onProcessSingleItem={handleProcessSingleItem}
              onTranslateSingleItem={handleTranslateSingleItem}
              onRemoveItem={handleRemoveItem}
              onClearCompleted={handleClearCompleted}
              onDownloadDocx={handleDownloadDocx}
              onDownloadXlsx={handleDownloadXlsx}
              onDownloadBatchZip={handleDownloadBatchZip}
              onSyncItemToDrive={handleSyncItemToDrive}
              onSyncAllToDrive={handleSyncAllToDrive}
              onInspectItem={handleInspectItem}
              isProcessingAny={isProcessingAny}
              hasDriveToken={hasDriveToken}
              onOpenFilePicker={handleOpenFilePicker}
            />
          </div>
        )}

        {activeTab === 'studio' && (
          <DocumentStudio
            item={activeStudioItem || batchItems.find((i) => i.status === 'completed') || null}
            onClose={() => setActiveTab('converter')}
            onUpdateDocumentData={handleUpdateDocumentData}
            onDownloadDocx={handleDownloadDocx}
            onDownloadXlsx={handleDownloadXlsx}
            onSyncToDrive={handleSyncItemToDrive}
            hasDriveToken={hasDriveToken}
          />
        )}

        {activeTab === 'history' && (
          <ConversionHistory
            records={historyRecords}
            onInspectRecord={handleInspectHistoryRecord}
            onDownloadRecordWord={handleDownloadHistoryWord}
            onDownloadRecordExcel={handleDownloadHistoryExcel}
            onDeleteRecord={handleDeleteHistoryRecord}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'drive' && (
          <CloudSyncSettings
            user={user}
            hasDriveToken={hasDriveToken}
            onConnectDrive={handleConnectDrive}
            onDisconnectDrive={handleDisconnectDrive}
            options={options}
            setOptions={setOptions}
            items={batchItems}
          />
        )}
      </main>

      {/* Floating AI Document Intelligence Chatbot */}
      <DocumentChatbot
        currentDocument={activeStudioItem?.structuredData}
        currentDocumentTitle={activeStudioItem?.name}
        batchItems={batchItems}
      />

      {/* Google Drive PDF Browser Modal */}
      <DriveBrowserModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        accessToken={driveToken}
        onImportPdfs={handleImportDriveFiles}
        onConnectDrive={handleConnectDrive}
        targetFormat="both"
      />

      {/* Mobile Play Store & App Store Packaging Hub */}
      <AppStoreExportModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />
    </div>
  );
}
