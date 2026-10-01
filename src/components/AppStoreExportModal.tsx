import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Apple,
  Play,
  Layers,
  ShieldCheck,
  Terminal,
  FileCode,
  QrCode,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { usePWAInstall } from '../services/usePWAInstall';

interface AppStoreExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppStoreExportModal: React.FC<AppStoreExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeStoreTab, setActiveStoreTab] = useState<'play' | 'apple' | 'install'>('play');
  const [isPackaging, setIsPackaging] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;

  const handleDownloadAppStoreKit = async () => {
    setIsPackaging(true);
    try {
      const zip = new JSZip();

      // 1. Android Play Store TWA (Bubblewrap) Config
      const twaManifest = {
        packageId: 'com.omnidoc.ocr',
        host: window.location.host,
        name: 'OmniDoc OCR & Converter',
        launcherName: 'OmniDoc',
        themeColor: '#1E3A8A',
        navigationColor: '#1E3A8A',
        backgroundColor: '#F8FAFC',
        startUrl: '/',
        iconUrl: `${currentAppUrl}/icon.svg`,
        maskableIconUrl: `${currentAppUrl}/pwa-maskable-512x512.png`,
        appVersionName: '1.0.0',
        appVersionCode: 1,
        shortcuts: [],
        generatorApp: 'bubblewrap-cli',
        webManifestUrl: `${currentAppUrl}/manifest.json`,
        fallbackType: 'customtabs',
        features: {
          locationDelegation: { enabled: false },
          playBilling: { enabled: false },
        },
        alphaDependencies: { enabled: false },
      };
      zip.file('playstore-android/twa-manifest.json', JSON.stringify(twaManifest, null, 2));

      // 2. assetlinks.json
      const assetlinks = [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'com.omnidoc.ocr',
            sha256_cert_fingerprints: [
              '14:6D:E9:7D:0F:52:AB:F5:4B:32:B1:A7:D5:4B:92:DF:D3:52:1D:64:1B:60:DF:99:6D:4E:99:48:8D:12:12:12',
            ],
          },
        },
      ];
      zip.file('playstore-android/.well-known/assetlinks.json', JSON.stringify(assetlinks, null, 2));

      // 3. iOS Capacitor Config
      const capacitorConfig = {
        appId: 'com.omnidoc.ocr',
        appName: 'OmniDoc OCR',
        webDir: 'dist',
        bundledWebRuntime: false,
        server: {
          url: currentAppUrl,
          cleartext: false,
        },
        ios: {
          contentInset: 'always',
        },
      };
      zip.file('appstore-ios/capacitor.config.json', JSON.stringify(capacitorConfig, null, 2));

      // 4. Comprehensive Play Store and App Store Publishing Guide
      const guideMd = `# OmniDoc OCR - Play Store & App Store Publishing Guide

This bundle contains all artifacts and configurations required to publish **OmniDoc** to both the **Google Play Store** (Android) and the **Apple App Store** (iOS).

---

## 1. Publishing to Google Play Store (Android)

Google officially supports Progressive Web Apps on the Play Store using **Trusted Web Activities (TWA)**.

### Option A: 1-Click via PWABuilder (Fastest, No Android Studio needed)
1. Go to https://www.pwabuilder.com
2. Enter your deployed URL: \`${currentAppUrl}\`
3. Click **Package for Stores** -> **Google Play**.
4. Set Package ID: \`com.omnidoc.ocr\`
5. Download your signed \`.aab\` (Android App Bundle).
6. Upload the \`.aab\` to your Google Play Console (https://play.google.com/console).

### Option B: Using Google Bubblewrap CLI
\`\`\`bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=${currentAppUrl}/manifest.json
bubblewrap build
\`\`\`
This produces \`app-release-bundle.aab\` ready for upload.

---

## 2. Publishing to Apple App Store (iOS)

Apple accepts web apps wrapped using **Capacitor** or PWABuilder.

### Option A: Using PWABuilder
1. Go to https://www.pwabuilder.com
2. Enter: \`${currentAppUrl}\`
3. Click **Package for Stores** -> **iOS**.
4. Download the generated Xcode project.
5. Open in Xcode on macOS, select your Apple Developer Team, and click **Product > Archive**.
6. Submit to App Store Connect.

### Option B: Using Capacitor
\`\`\`bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "OmniDoc OCR" "com.omnidoc.ocr"
npx cap add ios
npx cap open ios
\`\`\`
`;
      zip.file('PLAY_STORE_AND_APP_STORE_GUIDE.md', guideMd);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OmniDoc_PlayStore_AppStore_Package_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Packaging error:', err);
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  Mobile App Store &amp; Play Store Packaging
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Ready to Publish
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Package and transfer OmniDoc to Google Play Store and Apple App Store.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-2 bg-slate-100 border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveStoreTab('play')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeStoreTab === 'play'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="w-4 h-4 text-emerald-600 font-black flex items-center justify-center">
              ▲
            </div>
            <span>Google Play Store (Android)</span>
          </button>

          <button
            onClick={() => setActiveStoreTab('apple')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeStoreTab === 'apple'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-900" />
            <span>Apple App Store (iOS)</span>
          </button>

          <button
            onClick={() => setActiveStoreTab('install')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeStoreTab === 'install'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Direct Mobile Install</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Google Play Store Tab */}
          {activeStoreTab === 'play' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Google Play Store Ready via Trusted Web Activities (TWA)</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  OmniDoc includes full PWA compliance, Web App Manifest, Service Worker, and Digital Asset Links (`/.well-known/assetlinks.json`) required for Google Play Console submission.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>Quick Submission Steps for Google Play Console:</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-slate-700 text-xs">
                  <li>
                    <strong>Download Store Kit:</strong> Click the button below to download your pre-configured <code className="bg-slate-200 px-1 py-0.5 rounded">twa-manifest.json</code> and <code className="bg-slate-200 px-1 py-0.5 rounded">assetlinks.json</code>.
                  </li>
                  <li>
                    <strong>Generate Android App Bundle (.aab):</strong> Open{' '}
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold"
                    >
                      PWABuilder.com
                    </a>{' '}
                    or run <code className="bg-slate-200 px-1 py-0.5 rounded">bubblewrap build</code> to generate the signed <code className="bg-slate-200 px-1 py-0.5 rounded">.aab</code> package.
                  </li>
                  <li>
                    <strong>Upload to Google Play Console:</strong> Log in to{' '}
                    <a
                      href="https://play.google.com/console"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold"
                    >
                      Google Play Console
                    </a>
                    , create your application, upload the <code className="bg-slate-200 px-1 py-0.5 rounded">.aab</code> bundle, set store description &amp; screenshots, and submit for review!
                  </li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-slate-400"># Command-line generation with Google Bubblewrap:</div>
                <div className="text-emerald-400">npx @bubblewrap/cli init --manifest={currentAppUrl}/manifest.json</div>
                <div className="text-emerald-400">npx @bubblewrap/cli build</div>
              </div>
            </div>
          )}

          {/* Apple App Store Tab */}
          {activeStoreTab === 'apple' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Apple className="w-4 h-4 text-slate-900 shrink-0" />
                  <span>Apple App Store Distribution (iOS / iPadOS)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Package OmniDoc into a native iOS Xcode application using **Capacitor** or **PWABuilder iOS**, allowing full distribution on iPhones and iPads through the Apple App Store.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">
                  Apple App Store Submission Steps:
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-slate-700 text-xs">
                  <li>
                    <strong>Download iOS Configuration:</strong> Get the included <code className="bg-slate-200 px-1 py-0.5 rounded">capacitor.config.json</code> with App ID <code className="bg-slate-200 px-1 py-0.5 rounded">com.omnidoc.ocr</code>.
                  </li>
                  <li>
                    <strong>Open Xcode Project:</strong> Generate your native iOS project via{' '}
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold"
                    >
                      PWABuilder iOS
                    </a>{' '}
                    or run <code className="bg-slate-200 px-1 py-0.5 rounded">npx cap add ios</code>.
                  </li>
                  <li>
                    <strong>Sign &amp; Archive in Xcode:</strong> Open in Xcode on macOS, select your Apple Developer Account, build an Archive, and upload to{' '}
                    <a
                      href="https://appstoreconnect.apple.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold"
                    >
                      App Store Connect
                    </a>
                    .
                  </li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-slate-400"># Native iOS wrapper generation with Capacitor:</div>
                <div className="text-emerald-400">npm i @capacitor/core @capacitor/cli @capacitor/ios</div>
                <div className="text-emerald-400">npx cap add ios &amp;&amp; npx cap open ios</div>
              </div>
            </div>
          )}

          {/* Direct Mobile Install Tab */}
          {activeStoreTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Direct Mobile Installation (No Store Account Required)</span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Users can install OmniDoc directly from their mobile browser onto their Android or iPhone home screen with standalone native window display, offline caching, and high-res app icon.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Install on this Device
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isInstalled
                      ? 'OmniDoc is currently running in standalone installed app mode.'
                      : 'Add OmniDoc to your home screen or desktop application launcher.'}
                  </p>
                </div>

                {!isInstalled && (
                  <button
                    onClick={install}
                    disabled={!isInstallable && !isIOS}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install App Now</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h5 className="font-bold text-slate-800 text-xs">
                  Instructions for Mobile Devices:
                </h5>
                <p className="text-[11px] text-slate-600">
                  • <strong>Android (Chrome/Edge):</strong> Tap the three-dot menu in the upper right and choose <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                </p>
                <p className="text-[11px] text-slate-600">
                  • <strong>iOS (Safari):</strong> Tap the <strong>Share</strong> button (box with upward arrow) at the bottom toolbar, scroll down, and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Store Kit Download */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Package contains: <code className="text-slate-700 font-semibold">manifest.json</code>, <code className="text-slate-700 font-semibold">assetlinks.json</code>, <code className="text-slate-700 font-semibold">capacitor.config.json</code>, &amp; Guide.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Close
            </button>

            <button
              onClick={handleDownloadAppStoreKit}
              disabled={isPackaging}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isPackaging ? 'Packaging...' : 'Download Store Publishing Kit (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
