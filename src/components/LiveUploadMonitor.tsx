import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Globe2,
  FileSpreadsheet,
  Cloud,
} from 'lucide-react';
import { BatchItem } from '../types/document';

interface LiveUploadMonitorProps {
  items: BatchItem[];
  onCancelItem?: (id: string) => void;
  onClearCompleted?: () => void;
}

export const LiveUploadMonitor: React.FC<LiveUploadMonitorProps> = ({
  items,
  onCancelItem,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active items: currently uploading or processing
  const activeItems = items.filter(
    (i) =>
      i.status === 'uploading' ||
      i.status === 'reading_ocr' ||
      i.status === 'translating' ||
      i.status === 'reconstructing_layout' ||
      i.status === 'generating_files' ||
      i.status === 'syncing_cloud'
  );

  const uploadingItems = items.filter((i) => i.status === 'uploading');
  const isAnyActive = activeItems.length > 0;

  // Track live elapsed time counter while active
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAnyActive) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAnyActive]);

  if (!isAnyActive) {
    return null;
  }

  // Calculate aggregate upload statistics
  const totalBytes = activeItems.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const uploadedBytes = activeItems.reduce((acc, curr) => {
    if (curr.status === 'uploading') {
      return acc + (curr.bytesUploaded || Math.round(((curr.uploadProgress || 0) / 100) * curr.size));
    }
    return acc + curr.size;
  }, 0);

  const aggregatePercent = totalBytes > 0 ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)) : 0;

  return (
    <div className="mb-6 bg-white rounded-2xl border-2 border-blue-500/40 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              {uploadingItems.length > 0 ? (
                <UploadCloud className="w-5 h-5 animate-pulse text-blue-400" />
              ) : (
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              )}
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                {uploadingItems.length > 0
                  ? `Live Uploading ${uploadingItems.length} Document${uploadingItems.length > 1 ? 's' : ''}...`
                  : `Processing ${activeItems.length} Document${activeItems.length > 1 ? 's' : ''}...`}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)} ({aggregatePercent}%)
              </span>
              <span>•</span>
              <span>Elapsed: {elapsedSeconds}s</span>
              {activeItems[0]?.uploadSpeed && (
                <>
                  <span>•</span>
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {activeItems[0].uploadSpeed}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Toggle Minimize/Expand */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1"
            title={isExpanded ? 'Collapse monitor' : 'Expand monitor'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Hide Details</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Show Details</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Aggregate Animated Progress Bar */}
      <div className="w-full bg-slate-100 h-2 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-300 relative"
          style={{ width: `${Math.max(aggregatePercent, 8)}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>
      </div>

      {/* Expanded List of Live Files */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-slate-50/50 space-y-3 max-h-80 overflow-y-auto">
          {activeItems.map((item) => {
            const isUploading = item.status === 'uploading';
            const progressVal = isUploading ? item.uploadProgress || 0 : item.progress || 0;
            const currentBytes = item.bytesUploaded || Math.round((progressVal / 100) * item.size);

            return (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatBytes(item.size)}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1 mt-0.5">
                        {isUploading ? (
                          <>
                            <UploadCloud className="w-3 h-3 text-blue-600 animate-pulse" />
                            <span>
                              Uploading: {formatBytes(currentBytes)} / {formatBytes(item.size)} ({progressVal}%)
                            </span>
                            {item.uploadSpeed && (
                              <span className="text-slate-500 font-normal ml-1">
                                @ {item.uploadSpeed}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                            <span>{item.statusMessage || 'Processing document...'}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Stage Badge & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStageBadgeColor(
                        item.status
                      )}`}
                    >
                      {getStageLabel(item)}
                    </span>

                    {onCancelItem && (
                      <button
                        type="button"
                        onClick={() => onCancelItem(item.id)}
                        title="Cancel upload"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar per file */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      isUploading
                        ? 'bg-blue-600'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600'
                    }`}
                    style={{ width: `${Math.max(progressVal, 6)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function getStageBadgeColor(status: string): string {
  switch (status) {
    case 'uploading':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'reading_ocr':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'translating':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'reconstructing_layout':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'generating_files':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'syncing_cloud':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function getStageLabel(item: BatchItem): string {
  switch (item.status) {
    case 'uploading':
      return `Uploading ${item.uploadProgress || 0}%`;
    case 'reading_ocr':
      return 'OCR Vision Scan';
    case 'translating':
      return `Translating to ${item.targetLanguage || 'Target'}`;
    case 'reconstructing_layout':
      return 'Layout Reconstruction';
    case 'generating_files':
      return 'Building .docx & .xlsx';
    case 'syncing_cloud':
      return 'Google Drive Sync';
    case 'completed':
      return 'Completed';
    default:
      return 'Processing';
  }
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
