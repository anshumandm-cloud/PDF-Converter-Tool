import React, { useState } from 'react';
import {
  FolderSync,
  Folder,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { BatchItem, ConversionOptions } from '../types/document';

interface CloudSyncSettingsProps {
  user: User | null;
  hasDriveToken: boolean;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
  items: BatchItem[];
}

export const CloudSyncSettings: React.FC<CloudSyncSettingsProps> = ({
  user,
  hasDriveToken,
  onConnectDrive,
  onDisconnectDrive,
  options,
  setOptions,
  items,
}) => {
  const [folderInput, setFolderInput] = useState(options.driveFolderName || 'OmniDoc Conversions');

  const syncedItems = items.filter((i) => i.driveStatus === 'synced');

  const handleFolderSave = () => {
    setOptions((prev) => ({ ...prev, driveFolderName: folderInput.trim() || 'OmniDoc Conversions' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
            <Cloud className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Cloud Storage Synchronisation
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Sync converted Word and Excel files directly to Google Drive with automated folder organization.
            </p>
          </div>
        </div>
      </div>

      {/* Account Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Google Drive Connection
        </h3>

        {hasDriveToken && user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-12 h-12 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {(user.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                  <span>{user.displayName || 'Google User'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                  <span>Drive Scopes Active: drive.file, drive.readonly</span>
                </div>
              </div>
            </div>

            <button
              onClick={onDisconnectDrive}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 transition self-start sm:self-center"
            >
              Disconnect Drive
            </button>
          </div>
        ) : (
          <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200/80">
            <FolderSync className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              Not Connected to Google Drive
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Connect your Google account to automatically export converted Word documents and Excel spreadsheets to your cloud storage.
            </p>
            <button
              onClick={onConnectDrive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
            >
              <span>Connect Google Drive</span>
            </button>
          </div>
        )}
      </div>

      {/* Cloud Sync Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600" />
          Sync Preferences
        </h3>

        {/* Destination Folder */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Google Drive Destination Folder
          </label>
          <p className="text-xs text-slate-500 mb-2">
            The folder in your Google Drive root where all converted Word (.docx) and Excel (.xlsx) files will be stored.
          </p>
          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Folder className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                onBlur={handleFolderSave}
                placeholder="OmniDoc Conversions"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleFolderSave}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Save
            </button>
          </div>
        </div>

        {/* Auto Sync Toggle */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Automatic Cloud Upload
            </h4>
            <p className="text-xs text-slate-500">
              Automatically upload Word and Excel documents to Google Drive immediately upon completion of OCR conversion.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={options.autoSyncToDrive}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, autoSyncToDrive: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Synced Documents History */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Synced Files in Google Drive ({syncedItems.length})
          </h3>
        </div>

        {syncedItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500">
            No documents synced to Google Drive yet in this session. Convert a document and click &quot;Sync to Drive&quot;.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {syncedItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{item.name}</h5>
                    <p className="text-[11px] text-slate-400">
                      Synced to folder: {options.driveFolderName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.driveWordLink && (
                    <a
                      href={item.driveWordLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Word</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  {item.driveExcelLink && (
                    <a
                      href={item.driveExcelLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Excel</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
