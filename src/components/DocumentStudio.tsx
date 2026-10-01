import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  FolderSync,
  X,
  Check,
  Sparkles,
  Columns,
  Table as TableIcon,
  Eye,
  Sliders,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { BatchItem, StructuredDocument } from '../types/document';

interface DocumentStudioProps {
  item: BatchItem | null;
  onClose: () => void;
  onUpdateDocumentData: (id: string, updatedData: StructuredDocument) => void;
  onDownloadDocx: (item: BatchItem) => void;
  onDownloadXlsx: (item: BatchItem) => void;
  onSyncToDrive: (item: BatchItem) => void;
  hasDriveToken: boolean;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  item,
  onClose,
  onUpdateDocumentData,
  onDownloadDocx,
  onDownloadXlsx,
  onSyncToDrive,
  hasDriveToken,
}) => {
  if (!item || !item.structuredData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Document Selected in Studio</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Convert a PDF in the Batch Converter, then click &quot;Inspect &amp; Edit&quot; to review side-by-side OCR formatting.
        </p>
      </div>
    );
  }

  const [activeView, setActiveView] = useState<'word' | 'excel' | 'raw'>('word');
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [docData, setDocData] = useState<StructuredDocument>(item.structuredData);
  const [isSaved, setIsSaved] = useState(true);

  const handleTitleChange = (newTitle: string) => {
    setDocData((prev) => ({ ...prev, documentTitle: newTitle }));
    setIsSaved(false);
  };

  const handleCellChange = (sheetIdx: number, rowIdx: number, colIdx: number, val: string) => {
    setDocData((prev) => {
      const sheets = [...prev.spreadsheets];
      const sheet = { ...sheets[sheetIdx] };
      const rows = [...sheet.rows];
      const row = [...rows[rowIdx]];
      row[colIdx] = val;
      rows[rowIdx] = row;
      sheet.rows = rows;
      sheets[sheetIdx] = sheet;
      return { ...prev, spreadsheets: sheets };
    });
    setIsSaved(false);
  };

  const handleSaveEdits = () => {
    onUpdateDocumentData(item.id, docData);
    setIsSaved(true);
  };

  const sheets = docData.spreadsheets || [];
  const currentSheet = sheets[activeSheetIndex] || sheets[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col min-h-[750px]">
      {/* Studio Top Control Header */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white truncate max-w-md">
                {item.name}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {Math.round((docData.confidenceScore || 0.98) * 100)}% OCR Precision
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side visual layout inspection, cell editing, and Word/Excel preview.
            </p>
          </div>
        </div>

        {/* View Mode Switcher and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveView('word')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'word'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word Layout (.docx)</span>
            </button>

            <button
              onClick={() => setActiveView('excel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'excel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Grid ({sheets.length} Sheets)</span>
            </button>
          </div>

          {!isSaved && (
            <button
              onClick={handleSaveEdits}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white transition shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Edits</span>
            </button>
          )}

          <button
            onClick={() => onDownloadDocx(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>.docx</span>
          </button>

          <button
            onClick={() => onDownloadXlsx(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>.xlsx</span>
          </button>

          <button
            onClick={() => onSyncToDrive(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
            <span>Drive</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Studio Body: Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-slate-100/70">
        {/* Left Pane: Original Document Reference & OCR Layout Structure (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-white flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              OCR Document Analysis
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {docData.pages.length} Pages Analyzed
            </span>
          </div>

          {/* OCR Confidence Summary Card */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 mb-4">
            <div className="flex items-center justify-between font-bold mb-1">
              <span>OCR Layout Model: Gemini Multimodal Vision</span>
              <span className="text-blue-700 font-extrabold">
                {Math.round((docData.confidenceScore || 0.98) * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-blue-800/80 leading-relaxed">
              {docData.ocrSummary || 'Pristine document OCR extraction preserving headings, paragraphs, and multi-column tables.'}
            </p>
          </div>

          {/* Document Title Editor */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Document Title (Word Header)
            </label>
            <input
              type="text"
              value={docData.documentTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Page breakdown view */}
          <div className="space-y-4 flex-1">
            {docData.pages.map((page) => (
              <div
                key={page.pageNumber}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1.5 border-b border-slate-200/70">
                  <span>PAGE {page.pageNumber}</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {page.elements.length} elements detected
                  </span>
                </div>

                <div className="space-y-2">
                  {page.elements.map((elem, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {elem.type}
                        </span>
                        {elem.type === 'heading' && (
                          <span className="text-[10px] text-blue-600 font-medium">
                            H{elem.level}
                          </span>
                        )}
                        {elem.type === 'table' && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {elem.headers.length} cols × {elem.rows.length} rows
                          </span>
                        )}
                      </div>

                      {elem.type === 'heading' && (
                        <p className="font-bold text-slate-800 truncate">{elem.text}</p>
                      )}

                      {elem.type === 'paragraph' && (
                        <p className="text-slate-600 text-[11px] line-clamp-2">
                          {elem.runs.map((r) => r.text).join('')}
                        </p>
                      )}

                      {elem.type === 'key-value' && (
                        <p className="text-[11px] text-slate-700">
                          <strong className="text-slate-900">{elem.label}:</strong> {elem.value}
                        </p>
                      )}

                      {elem.type === 'list' && (
                        <p className="text-[11px] text-slate-600 truncate">
                          • {elem.items[0]} {elem.items.length > 1 && `(+${elem.items.length - 1} more)`}
                        </p>
                      )}

                      {elem.type === 'table' && (
                        <p className="text-[11px] text-slate-500 truncate">
                          Headers: {elem.headers.join(' | ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Reconstructed Word or Excel Preview (7 cols) */}
        <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[800px] flex flex-col">
          {/* View Tab 1: Word Layout Preview */}
          {activeView === 'word' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-8 sm:p-10 max-w-2xl mx-auto w-full font-serif leading-relaxed text-slate-800 space-y-6">
              {/* Word Document Visual Page */}
              <div className="border-b border-slate-200 pb-4 text-center">
                <h1 className="text-2xl font-black text-blue-900 tracking-tight">
                  {docData.documentTitle}
                </h1>
                <p className="text-xs text-slate-400 mt-1 uppercase font-sans">
                  Editable Word (.docx) Preview
                </p>
              </div>

              {docData.pages.map((page) => (
                <div key={page.pageNumber} className="space-y-4">
                  {page.elements.map((elem, idx) => {
                    if (elem.type === 'heading') {
                      return (
                        <h2
                          key={idx}
                          className={`font-bold text-slate-900 tracking-tight ${
                            elem.level === 1
                              ? 'text-xl text-blue-900 mt-6 mb-2'
                              : elem.level === 2
                              ? 'text-lg text-slate-800 mt-4 mb-2'
                              : 'text-base text-slate-700 mt-3 mb-1'
                          }`}
                        >
                          {elem.text}
                        </h2>
                      );
                    }

                    if (elem.type === 'paragraph') {
                      return (
                        <p key={idx} className="text-sm text-slate-700 leading-relaxed font-sans">
                          {elem.runs.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              className={`${r.bold ? 'font-bold' : ''} ${
                                r.italic ? 'italic' : ''
                              } ${r.underline ? 'underline' : ''}`}
                            >
                              {r.text}
                            </span>
                          ))}
                        </p>
                      );
                    }

                    if (elem.type === 'key-value') {
                      return (
                        <div key={idx} className="text-xs font-sans py-1 flex items-baseline gap-2">
                          <span className="font-bold text-slate-900">{elem.label}:</span>
                          <span className="text-slate-700">{elem.value}</span>
                        </div>
                      );
                    }

                    if (elem.type === 'list') {
                      return (
                        <ul key={idx} className="list-disc pl-5 text-xs font-sans space-y-1 text-slate-700">
                          {elem.items.map((it, itIdx) => (
                            <li key={itIdx}>{it}</li>
                          ))}
                        </ul>
                      );
                    }

                    if (elem.type === 'table') {
                      return (
                        <div key={idx} className="my-4 overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-full text-xs font-sans divide-y divide-slate-200">
                            <thead className="bg-blue-900 text-white font-bold">
                              <tr>
                                {elem.headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className={`px-3 py-2.5 text-left font-semibold tracking-wider ${
                                      elem.alignments?.[hIdx] === 'right' ? 'text-right' : 'text-left'
                                    }`}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {elem.rows.map((r, rIdx) => {
                                const isZebra = rIdx % 2 === 1;
                                const isTotal = elem.hasTotalRow && rIdx === elem.rows.length - 1;
                                return (
                                  <tr
                                    key={rIdx}
                                    className={`${
                                      isTotal
                                        ? 'bg-slate-100 font-bold text-slate-900'
                                        : isZebra
                                        ? 'bg-slate-50/70'
                                        : ''
                                    }`}
                                  >
                                    {r.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className={`px-3 py-2 text-slate-700 ${
                                          elem.alignments?.[cIdx] === 'right'
                                            ? 'text-right font-mono'
                                            : 'text-left'
                                        }`}
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              ))}
            </div>
          )}

          {/* View Tab 2: Excel Spreadsheet Interactive Grid */}
          {activeView === 'excel' && (
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Sheet Tabs Header */}
              <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto">
                {sheets.length > 0 ? (
                  sheets.map((sheet, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setActiveSheetIndex(sIdx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                        activeSheetIndex === sIdx
                          ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{sheet.sheetName}</span>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 px-3">No tables found</span>
                )}
              </div>

              {/* Spreadsheet Grid View */}
              {currentSheet ? (
                <div className="flex-1 p-4 overflow-x-auto">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {currentSheet.sheetName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {currentSheet.rows.length} rows • Click cell to edit value
                      </p>
                    </div>
                  </div>

                  <table className="min-w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-200/80 text-slate-700">
                        <th className="border border-slate-300 p-1.5 w-10 text-center font-mono text-[10px] text-slate-500">
                          #
                        </th>
                        {currentSheet.headers.map((h, hIdx) => {
                          const colLetter = String.fromCharCode(65 + (hIdx % 26));
                          return (
                            <th
                              key={hIdx}
                              className="border border-slate-300 p-2 text-left font-bold text-slate-800 bg-slate-100"
                            >
                              <div className="text-[10px] text-slate-400 font-mono mb-0.5">
                                {colLetter}
                              </div>
                              <span>{h}</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSheet.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-blue-50/40">
                          <td className="border border-slate-300 p-1.5 text-center font-mono text-[10px] text-slate-400 bg-slate-50">
                            {rIdx + 1}
                          </td>
                          {(row as (string | number)[]).map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-300 p-1 text-slate-800">
                              <input
                                type="text"
                                value={cell !== undefined ? String(cell) : ''}
                                onChange={(e) =>
                                  handleCellChange(activeSheetIndex, rIdx, cIdx, e.target.value)
                                }
                                className="w-full px-1.5 py-1 text-xs bg-transparent hover:bg-white focus:bg-white rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No spreadsheet tables available for this document.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
