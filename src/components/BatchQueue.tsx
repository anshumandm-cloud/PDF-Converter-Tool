import React, { useState } from 'react';
import {
  Play,
  Download,
  FolderSync,
  Trash2,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit3,
  Layers,
  Archive,
  RefreshCw,
  Languages,
  Globe2,
  UploadCloud,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { BatchItem } from '../types/document';
import { TranslateItemModal } from './TranslateItemModal';

interface BatchQueueProps {
  items: BatchItem[];
  onStartProcessingAll: () => void;
  onTranslateAll: (targetLanguage: string, sourceLanguage?: string) => void;
  onProcessSingleItem: (id: string) => void;
  onTranslateSingleItem: (id: string, targetLanguage: string, sourceLanguage?: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  onDownloadDocx: (item: BatchItem) => void;
  onDownloadXlsx: (item: BatchItem) => void;
  onDownloadBatchZip: () => void;
  onSyncItemToDrive: (item: BatchItem) => void;
  onSyncAllToDrive: () => void;
  onInspectItem: (item: BatchItem) => void;
  isProcessingAny: boolean;
  hasDriveToken: boolean;
  onOpenFilePicker?: (action: 'convert' | 'translate') => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  onStartProcessingAll,
  onTranslateAll,
  onProcessSingleItem,
  onTranslateSingleItem,
  onRemoveItem,
  onClearCompleted,
  onDownloadDocx,
  onDownloadXlsx,
  onDownloadBatchZip,
  onSyncItemToDrive,
  onSyncAllToDrive,
  onInspectItem,
  isProcessingAny,
  hasDriveToken,
  onOpenFilePicker,
}) => {
  const [itemToTranslate, setItemToTranslate] = useState<BatchItem | null>(null);
  const [isBatchTranslateOpen, setIsBatchTranslateOpen] = useState(false);

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const queuedCount = items.filter((i) => i.status === 'queued').length;
  const totalTablesExtracted = items.reduce((sum, item) => {
    return sum + (item.structuredData?.spreadsheets?.length || 0);
  }, 0);
  const lowConfidenceCount = items.filter(
    (i) =>
      i.status === 'completed' &&
      i.structuredData?.confidenceScore !== undefined &&
      i.structuredData.confidenceScore < 0.75
  ).length;

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Batch Header & Summary Bar */}
      <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">
              Attached Documents Queue ({items.length})
            </h3>
            {completedCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                {completedCount} Completed
              </span>
            )}
            {totalTablesExtracted > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                {totalTablesExtracted} Tables Extracted
              </span>
            )}
            {lowConfidenceCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{lowConfidenceCount} Review Recommended</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Execute separate commands to convert in original language or translate into any chosen target language.
          </p>
        </div>

        {/* Global Batch Actions: Distinct Convert vs Translate Commands */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Command 1: Convert All (Original Language) */}
          <button
            onClick={() => {
              if (queuedCount > 0) {
                onStartProcessingAll();
              } else if (onOpenFilePicker) {
                onOpenFilePicker('convert');
              }
            }}
            disabled={isProcessingAny}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer"
            title="Convert attached documents preserving original language"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Convert All {queuedCount > 0 ? `(${queuedCount})` : ''}</span>
          </button>

          {/* Command 2: Translate All (Chosen Target Language) */}
          <button
            onClick={() => {
              if (queuedCount > 0) {
                setIsBatchTranslateOpen(true);
              } else if (onOpenFilePicker) {
                onOpenFilePicker('translate');
              }
            }}
            disabled={isProcessingAny}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer"
            title="Translate attached documents into a chosen language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translate All {queuedCount > 0 ? `(${queuedCount})` : ''}</span>
          </button>

          {completedCount > 0 && (
            <>
              <button
                onClick={onDownloadBatchZip}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition active:scale-98"
              >
                <Archive className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download All (.zip)</span>
              </button>

              <button
                onClick={onSyncAllToDrive}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition active:scale-98"
              >
                <FolderSync className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sync All to Drive</span>
              </button>

              <button
                onClick={onClearCompleted}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Finished</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* When Empty: Show clear call-to-action */}
      {items.length === 0 ? (
        <div className="p-8 sm:p-10 text-center bg-slate-50/40">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            No Documents in Attached Queue
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Attach a PDF file above or click an action button below to select documents and start processing:
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenFilePicker?.('convert')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Attach &amp; Convert</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenFilePicker?.('translate')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xs transition active:scale-98"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Attach &amp; Translate</span>
            </button>
          </div>
        </div>
      ) : (
        /* Item List */
        <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const isBusy =
            item.status === 'reading_ocr' ||
            item.status === 'reconstructing_layout' ||
            item.status === 'generating_files' ||
            item.status === 'syncing_cloud';

          const isCompleted = item.status === 'completed';
          const confidenceScore = item.structuredData?.confidenceScore;
          const isLowConfidence = isCompleted && confidenceScore !== undefined && confidenceScore < 0.75;
          const isModerateConfidence = isCompleted && confidenceScore !== undefined && confidenceScore >= 0.75 && confidenceScore < 0.90;
          const isHighConfidence = isCompleted && confidenceScore !== undefined && confidenceScore >= 0.90;

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isLowConfidence
                  ? 'bg-amber-50/40 border-l-4 border-l-amber-500 hover:bg-amber-50/60'
                  : 'hover:bg-slate-50/60'
              }`}
            >
              {/* File Info & Status */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isLowConfidence
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isLowConfidence ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {formatBytes(item.size)}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Target: {item.targetFormat.toUpperCase()}
                    </span>
                    {item.targetLanguage && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Globe2 className="w-2.5 h-2.5" />
                        Target: {item.targetLanguage}
                      </span>
                    )}
                  </div>

                  {/* Status & Progress Bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    {item.status === 'uploading' && (
                      <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold">
                        <UploadCloud className="w-3.5 h-3.5 animate-pulse text-blue-600" />
                        <span>
                          Uploading: {formatBytes(item.bytesUploaded || Math.round(((item.uploadProgress || 0) / 100) * item.size))} / {formatBytes(item.size)} ({item.uploadProgress || 0}%)
                        </span>
                        {item.uploadSpeed && (
                          <span className="text-slate-500 font-normal">
                            @ {item.uploadSpeed}
                          </span>
                        )}
                      </div>
                    )}

                    {item.status === 'queued' && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        Ready to process
                      </span>
                    )}

                    {isBusy && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>{item.statusMessage || 'Processing document...'}</span>
                      </div>
                    )}

                    {item.status === 'completed' && (
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Converted Successfully
                        </span>

                        {/* Color-Coded OCR Confidence Indicator */}
                        {confidenceScore !== undefined && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isLowConfidence
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                : isModerateConfidence
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                            title={`OCR recognition confidence: ${Math.round(confidenceScore * 100)}%`}
                          >
                            {isLowConfidence ? (
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            ) : isModerateConfidence ? (
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            )}
                            <span>{Math.round(confidenceScore * 100)}% Confidence</span>
                          </span>
                        )}

                        {item.structuredData?.spreadsheets?.length ? (
                          <span className="text-indigo-600 font-medium">
                            • {item.structuredData.spreadsheets.length} tables found
                          </span>
                        ) : null}
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{item.error || 'Conversion failed.'}</span>
                      </div>
                    )}
                  </div>

                  {/* Visual Warning Banner for Low OCR Confidence */}
                  {isLowConfidence && (
                    <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-200/70 text-amber-900 shrink-0 mt-0.5 sm:mt-0">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <div className="font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                            <span>Low OCR Confidence ({Math.round(confidenceScore * 100)}%)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase tracking-wider">
                              Manual Review Advised
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                            Some faint text, blurred handwriting, or complex tabular borders may contain recognition inaccuracies. Please review and adjust in the Document Studio before final export.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onInspectItem(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition shrink-0 active:scale-98 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Review in Studio</span>
                      </button>
                    </div>
                  )}

                  {/* Progress Line */}
                  {(isBusy || item.status === 'uploading') && (
                    <div className="w-full max-w-md bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          item.status === 'uploading'
                            ? 'bg-blue-600'
                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600'
                        }`}
                        style={{
                          width: `${Math.max(
                            item.status === 'uploading'
                              ? item.uploadProgress || 10
                              : item.progress,
                            10
                          )}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Google Drive Sync status banner */}
                  {item.driveStatus === 'synced' && (
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-emerald-700">
                      <span>Saved in Google Drive</span>
                      {item.driveWordLink && (
                        <a
                          href={item.driveWordLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline flex items-center gap-0.5 text-blue-600 hover:text-blue-800"
                        >
                          Open Word <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {item.driveExcelLink && (
                        <a
                          href={item.driveExcelLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline flex items-center gap-0.5 text-emerald-600 hover:text-emerald-800"
                        >
                          Open Excel <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {item.status === 'uploading' && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <UploadCloud className="w-3.5 h-3.5 animate-pulse text-blue-600" />
                      <span>Uploading {item.uploadProgress || 0}%</span>
                    </span>
                  </div>
                )}

                {item.status === 'queued' && (
                  <div className="flex items-center gap-1.5">
                    {/* Command 1: Convert (Original) */}
                    <button
                      onClick={() => onProcessSingleItem(item.id)}
                      disabled={isProcessingAny}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                      title="Convert attached document preserving original language"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Convert</span>
                    </button>

                    {/* Command 2: Translate */}
                    <button
                      onClick={() => setItemToTranslate(item)}
                      disabled={isProcessingAny}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
                      title="Invoke translation for this attached document"
                    >
                      <Languages className="w-3 h-3 text-indigo-600" />
                      <span>Translate</span>
                    </button>
                  </div>
                )}

                {item.status === 'completed' && (
                  <>
                    <button
                      onClick={() => onInspectItem(item)}
                      title={
                        isLowConfidence
                          ? 'Low OCR confidence - Review in Studio'
                          : 'Inspect & Edit in Studio'
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isLowConfidence
                          ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isLowConfidence ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{isLowConfidence ? 'Review in Studio' : 'Inspect & Edit'}</span>
                    </button>

                    {/* Distinct command to translate already converted document */}
                    <button
                      onClick={() => setItemToTranslate(item)}
                      disabled={isProcessingAny}
                      title="Translate this converted document into another language"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
                    >
                      <Languages className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Translate</span>
                    </button>

                    {(item.targetFormat === 'word' || item.targetFormat === 'both') && (
                      <button
                        onClick={() => onDownloadDocx(item)}
                        title="Download Word Document"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>.docx</span>
                      </button>
                    )}

                    {(item.targetFormat === 'excel' || item.targetFormat === 'both') && (
                      <button
                        onClick={() => onDownloadXlsx(item)}
                        title="Download Excel Workbook"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>.xlsx</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSyncItemToDrive(item)}
                      title="Sync to Google Drive"
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        item.driveStatus === 'synced'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <FolderSync className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.driveStatus === 'synced' ? 'Synced' : 'Drive'}</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => onRemoveItem(item.id)}
                  title="Remove from queue"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal for single item translation command */}
      {itemToTranslate && (
        <TranslateItemModal
          isOpen={!!itemToTranslate}
          onClose={() => setItemToTranslate(null)}
          documentTitle={itemToTranslate.name}
          initialTargetLanguage={itemToTranslate.targetLanguage || 'Spanish'}
          onConfirmTranslate={(targetLanguage, sourceLanguage) => {
            const id = itemToTranslate.id;
            setItemToTranslate(null);
            onTranslateSingleItem(id, targetLanguage, sourceLanguage);
          }}
          isProcessing={isProcessingAny}
        />
      )}

      {/* Modal for batch queue translation command */}
      {isBatchTranslateOpen && (
        <TranslateItemModal
          isOpen={isBatchTranslateOpen}
          onClose={() => setIsBatchTranslateOpen(false)}
          isBatch={true}
          batchCount={queuedCount}
          onConfirmTranslate={(targetLanguage, sourceLanguage) => {
            setIsBatchTranslateOpen(false);
            onTranslateAll(targetLanguage, sourceLanguage);
          }}
          isProcessing={isProcessingAny}
        />
      )}
    </div>
  );
};

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
