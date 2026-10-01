import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderSync,
  Clock,
  Sparkles,
  ArrowUpDown,
  FileJson,
  Globe2,
} from 'lucide-react';
import { HistoryRecord } from '../types/document';

interface ConversionHistoryProps {
  records: HistoryRecord[];
  onInspectRecord: (record: HistoryRecord) => void;
  onDownloadRecordWord: (record: HistoryRecord) => void;
  onDownloadRecordExcel: (record: HistoryRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
}

export const ConversionHistory: React.FC<ConversionHistoryProps> = ({
  records,
  onInspectRecord,
  onDownloadRecordWord,
  onDownloadRecordExcel,
  onDeleteRecord,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'synced'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'word' | 'excel' | 'both'>('all');

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.ocrSummary && rec.ocrSummary.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'completed'
        ? rec.status === 'completed'
        : statusFilter === 'failed'
        ? rec.status === 'failed'
        : rec.driveSynced;

    const matchesFormat =
      formatFilter === 'all' ? true : rec.targetFormat === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  const totalCompleted = records.filter((r) => r.status === 'completed').length;
  const totalTables = records.reduce((sum, r) => sum + (r.tableCount || 0), 0);
  const totalSynced = records.filter((r) => r.driveSynced).length;
  const avgConfidence = records.length
    ? Math.round(
        (records.reduce((acc, r) => acc + (r.confidenceScore || 0.98), 0) / records.length) * 100
      )
    : 100;

  const exportHistoryAsJson = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniDoc_History_Log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Operations
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{records.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalCompleted} successful conversions
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Extracted Tables
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalTables}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Spreadsheet sheets reconstructed
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg OCR Accuracy
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{avgConfidence}%</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Multimodal OCR fidelity
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Drive Synced
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderSync className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSynced}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Uploaded to Google Drive
          </p>
        </div>
      </div>

      {/* Main History Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Conversion History Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive audit trail of all previous OCR conversions, timestamps, and output documents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {records.length > 0 && (
              <>
                <button
                  onClick={exportHistoryAsJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  <FileJson className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={onClearHistory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file name or contents..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="synced">Google Drive Synced</option>
              <option value="failed">Failed Only</option>
            </select>

            {/* Format Filter */}
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Formats</option>
              <option value="word">Word (.docx)</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="both">Both (.docx + .xlsx)</option>
            </select>
          </div>
        </div>

        {/* Log Table */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            {records.length === 0
              ? 'No conversion history yet. Process files in the Batch Converter to view detailed audit logs.'
              : 'No records matching the selected search criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">File Name &amp; Size</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">OCR Confidence &amp; Time</th>
                  <th className="px-4 py-3">Extracted Structure</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    {/* Timestamp */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rec.timestamp).toLocaleDateString()}
                      </span>
                    </td>

                    {/* File Name & Size */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate" title={rec.fileName}>
                            {rec.fileName}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <span className="text-[11px] text-slate-400">
                              {formatBytes(rec.fileSize)}
                            </span>
                            {rec.targetLanguage && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                <Globe2 className="w-2.5 h-2.5 text-indigo-600" />
                                <span>{rec.targetLanguage}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Target Format */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {rec.targetFormat}
                      </span>
                    </td>

                    {/* OCR Confidence & Duration */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rec.status === 'completed' ? (
                        <div>
                          <span className="font-semibold text-emerald-700">
                            {Math.round((rec.confidenceScore || 0.98) * 100)}% Confidence
                          </span>
                          {rec.durationMs && (
                            <p className="text-[10px] text-slate-400">
                              {(rec.durationMs / 1000).toFixed(1)}s elapsed
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    {/* Extracted Structure */}
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      {rec.status === 'completed' ? (
                        <div className="text-[11px] space-y-0.5">
                          <p className="font-medium text-slate-800">
                            {rec.pageCount} {rec.pageCount === 1 ? 'Page' : 'Pages'} • {rec.tableCount} {rec.tableCount === 1 ? 'Table' : 'Tables'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate" title={rec.ocrSummary}>
                            {rec.ocrSummary || 'Structured layout generated'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-rose-600 text-[11px]">{rec.error || 'Failed'}</span>
                      )}
                    </td>

                    {/* Status & Cloud Sync */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {rec.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Converted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Error</span>
                          </span>
                        )}

                        {rec.driveSynced && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                            <FolderSync className="w-3 h-3 text-blue-600" />
                            <span>Google Drive</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.structuredData && (
                          <button
                            onClick={() => onInspectRecord(rec)}
                            title="Inspect in Document Studio"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {rec.status === 'completed' && (
                          <>
                            <button
                              onClick={() => onDownloadRecordWord(rec)}
                              title="Download Word Document"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Download className="w-4 h-4 text-blue-600" />
                            </button>

                            <button
                              onClick={() => onDownloadRecordExcel(rec)}
                              title="Download Excel Workbook"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            </button>
                          </>
                        )}

                        {rec.driveWordLink && (
                          <a
                            href={rec.driveWordLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Word document in Google Drive"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          title="Delete history log record"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
