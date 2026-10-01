import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Layers,
  FolderDown,
  Sparkles,
  SlidersHorizontal,
  Check,
  Languages,
  Globe2,
} from 'lucide-react';
import { TargetFormat, ConversionOptions } from '../types/document';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../services/sampleDocuments';
import { SUPPORTED_LANGUAGES, SOURCE_LANGUAGES } from '../services/languages';

interface UploadZoneProps {
  onFilesSelected: (files: File[], format: TargetFormat) => void;
  onSampleSelected: (sample: SampleDoc, format: TargetFormat) => void;
  onOpenDrivePicker: () => void;
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
  hasDriveToken: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onSampleSelected,
  onOpenDrivePicker,
  options,
  setOptions,
  hasDriveToken,
}) => {
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('both');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validPdfs = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (validPdfs.length > 0) {
        onFilesSelected(validPdfs, targetFormat);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray, targetFormat);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
      {/* Format Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Select Output Target Format</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Preserves Exact Formatting
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose whether to generate an editable Word document, an Excel workbook with table sheets, or both.
          </p>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setTargetFormat('word')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              targetFormat === 'word'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={() => setTargetFormat('excel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              targetFormat === 'excel'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setTargetFormat('both')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              targetFormat === 'both'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Both (.docx + .xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            title="Advanced OCR Settings"
            className={`p-1.5 rounded-lg text-xs transition ${
              showSettings ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Language Translation Bar */}
      <div className="mt-4 p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-indigo-950">
                Document Translation Engine
              </span>
              {options.targetLanguage !== 'none' && options.targetLanguage !== 'Original (No Translation)' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-emerald-600" />
                  Translating to {options.targetLanguage}
                </span>
              )}
            </div>
            <p className="text-[11px] text-indigo-800/80 mt-0.5">
              Translate text, headings, and table cells into your chosen language while preserving styles &amp; numbers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium text-[11px]">From:</span>
            <select
              value={options.sourceLanguage}
              onChange={(e) => setOptions((prev) => ({ ...prev, sourceLanguage: e.target.value }))}
              className="px-2.5 py-1 text-xs bg-white border border-indigo-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            >
              {SOURCE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium text-[11px]">To:</span>
            <select
              value={options.targetLanguage}
              onChange={(e) => setOptions((prev) => ({ ...prev, targetLanguage: e.target.value }))}
              className="px-2.5 py-1 text-xs bg-white font-semibold border border-indigo-200 rounded-lg text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code === 'none' ? 'none' : l.name}>
                  {l.name} {l.nativeName && l.code !== 'none' ? `(${l.nativeName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showSettings && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200/90 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.preserveStyles}
              onChange={(e) => setOptions((prev) => ({ ...prev, preserveStyles: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Strict Typography & Header Colors</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.detectTablesStrict}
              onChange={(e) => setOptions((prev) => ({ ...prev, detectTablesStrict: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Deep Financial & Table OCR Scan</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.autoSyncToDrive}
              onChange={(e) => setOptions((prev) => ({ ...prev, autoSyncToDrive: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Auto-Sync to Google Drive on Complete</span>
          </label>
        </div>
      )}

      {/* Dropzone Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-6 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/40 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition">
          <UploadCloud className="w-8 h-8 text-blue-600" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          Drag & Drop PDF documents here, or <span className="text-blue-600 underline underline-offset-2">browse files</span>
        </h3>
        <p className="text-xs text-slate-500 max-w-md">
          Supports multi-file batch uploads. The OCR engine reads scanned documents, complex tables, contracts, invoices, and multi-page reports.
        </p>

        {/* Secondary Import Trigger: Google Drive */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onOpenDrivePicker}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition hover:border-slate-300"
          >
            <FolderDown className="w-4 h-4 text-emerald-600" />
            <span>Import from Google Drive</span>
            {hasDriveToken && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Sample Documents Section */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Try with pre-configured sample PDFs (instant demo):
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSampleSelected(sample, targetFormat)}
              className="text-left p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                    {sample.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {sample.pageCount} {sample.pageCount === 1 ? 'page' : 'pages'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                  {sample.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-600 pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1">
                  <span>Load Sample</span>
                  <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                </span>
                <span className="text-slate-400 font-normal">
                  {sample.tags[0]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
