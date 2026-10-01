import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Download, FolderDown, RefreshCw, AlertCircle } from 'lucide-react';
import { DriveFileItem, TargetFormat } from '../types/document';
import { listDrivePdfFiles, downloadDrivePdf } from '../services/driveService';

interface DriveBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  onImportPdfs: (files: { file: File; base64: string }[], format: TargetFormat) => void;
  onConnectDrive: () => void;
  targetFormat: TargetFormat;
}

export const DriveBrowserModal: React.FC<DriveBrowserModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  onImportPdfs,
  onConnectDrive,
  targetFormat,
}) => {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadDriveFiles();
    }
  }, [isOpen, accessToken]);

  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await listDrivePdfFiles(accessToken);
      setFiles(items);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      setError(err.message || 'Could not fetch files from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleImportSelected = async () => {
    if (!accessToken || selectedFileIds.length === 0) return;
    setIsDownloading(true);
    try {
      const downloaded: { file: File; base64: string }[] = [];
      for (const id of selectedFileIds) {
        const { blob, fileName } = await downloadDrivePdf(accessToken, id);
        const file = new File([blob], fileName, { type: 'application/pdf' });
        const base64 = await blobToBase64(blob);
        downloaded.push({ file, base64 });
      }

      onImportPdfs(downloaded, targetFormat);
      setSelectedFileIds([]);
      onClose();
    } catch (err: any) {
      console.error('Error importing from Drive:', err);
      setError(err.message || 'Failed to download selected file(s) from Drive.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FolderDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Import PDFs from Google Drive
              </h3>
              <p className="text-xs text-slate-500">
                Select one or multiple PDF documents to add to the conversion queue.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!accessToken ? (
          <div className="p-8 text-center my-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <FolderDown className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Google Drive Not Connected
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Sign in with your Google account to browse, import PDFs, and automatically sync your converted Word and Excel files.
            </p>
            <button
              onClick={onConnectDrive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
            >
              <span>Connect Google Drive</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 p-5">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PDF files in your Google Drive..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* File List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 min-h-[260px]">
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Scanning Google Drive for PDF documents...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  {searchQuery
                    ? 'No PDF files matching your search.'
                    : 'No PDF files found in your Google Drive.'}
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={() => handleToggleSelect(file.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(file.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {file.size} • Modified {new Date(file.modifiedTime || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with action */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {selectedFileIds.length} file{selectedFileIds.length === 1 ? '' : 's'} selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleImportSelected}
                  disabled={selectedFileIds.length === 0 || isDownloading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Import Selected</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
