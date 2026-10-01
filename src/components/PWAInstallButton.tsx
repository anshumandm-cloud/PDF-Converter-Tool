import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../services/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenStoreModal: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenStoreModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <button
      onClick={() => {
        if (isInstallable) {
          install();
        } else {
          onOpenStoreModal();
        }
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold shadow-2xs transition"
      title="Install PWA or Package for Play Store / App Store"
    >
      <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
      <span className="hidden sm:inline">Play Store / App Store</span>
      <span className="sm:hidden">App Stores</span>
    </button>
  );
};
