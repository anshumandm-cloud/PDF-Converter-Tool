import React, { useState } from 'react';
import { X, Languages, Globe2, ArrowRight, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SOURCE_LANGUAGES } from '../services/languages';

interface TranslateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  isBatch?: boolean;
  batchCount?: number;
  initialTargetLanguage?: string;
  onConfirmTranslate: (targetLanguage: string, sourceLanguage: string) => void;
  isProcessing?: boolean;
}

export const TranslateItemModal: React.FC<TranslateItemModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  isBatch = false,
  batchCount = 1,
  initialTargetLanguage = 'Spanish',
  onConfirmTranslate,
  isProcessing = false,
}) => {
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>(
    initialTargetLanguage !== 'none' && initialTargetLanguage !== 'Original (No Translation)'
      ? initialTargetLanguage
      : 'Spanish'
  );

  if (!isOpen) return null;

  const validTargetLanguages = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmTranslate(targetLang, sourceLang);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Languages className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {isBatch ? `Translate ${batchCount} Document(s)` : 'Translate Document'}
              </h3>
              <p className="text-xs text-indigo-200">
                Invoke AI translation while preserving layout &amp; tables.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {documentTitle && !isBatch && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">Attached File:</span>
              <p className="font-bold text-slate-800 truncate mt-0.5">{documentTitle}</p>
            </div>
          )}

          {/* Source Language */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Source Document Language
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {SOURCE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow divider */}
          <div className="flex items-center justify-center py-1">
            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Target Language */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-indigo-900 flex items-center justify-between">
              <span>Target Output Language</span>
              <span className="text-[10px] text-indigo-600 font-semibold">20 Languages Available</span>
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border-2 border-indigo-500 bg-indigo-50/50 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {validTargetLanguages.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            <strong>Formatting Guarantee:</strong> Heading hierarchies, bullet runs, numerical figures, currencies, table borders, and Excel sheet structures will remain strictly preserved in the translated output.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/20 transition active:scale-98 disabled:opacity-50"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Translating...' : 'Invoke Translation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
