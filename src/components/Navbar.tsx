import React from 'react';
import { FileText, FolderSync, Layers, LogOut, CheckCircle2, Cloud, Sparkles, History, Smartphone } from 'lucide-react';
import { User } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'converter' | 'studio' | 'history' | 'drive';
  setActiveTab: (tab: 'converter' | 'studio' | 'history' | 'drive') => void;
  user: User | null;
  hasDriveToken: boolean;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  onOpenStoreModal: () => void;
  batchCount: number;
  historyCount: number;
  studioItemTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  hasDriveToken,
  onConnectDrive,
  onDisconnectDrive,
  onOpenStoreModal,
  batchCount,
  historyCount,
  studioItemTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900">
                  OmniDoc
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  AI OCR
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                PDF to Word & Excel Conversion • Batch & Cloud Sync
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('converter')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'converter'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Batch Converter</span>
              {batchCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-200/80 text-blue-800 font-bold">
                  {batchCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'studio'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Document Studio</span>
              {studioItemTitle && (
                <span className="hidden md:inline-block max-w-[120px] truncate text-xs text-blue-600 font-normal">
                  ({studioItemTitle})
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History Log</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700 font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'drive'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FolderSync className="w-4 h-4" />
              <span>Cloud Sync</span>
              {hasDriveToken && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Actions: Store Hub & Google Drive Auth */}
          <div className="flex items-center gap-2">
            <PWAInstallButton onOpenStoreModal={onOpenStoreModal} />

            {hasDriveToken && user ? (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-lg p-1.5 pr-2.5 shadow-2xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left text-xs">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <span>{user.displayName || user.email?.split('@')[0]}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-slate-500">Drive Connected</span>
                </div>
                <button
                  onClick={onDisconnectDrive}
                  title="Disconnect Google Drive"
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectDrive}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Connect Drive</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
