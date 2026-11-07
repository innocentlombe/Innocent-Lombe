import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>App is installed as Standalone PWA</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  if (variant === 'settings') {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            Install Innowear POS on your device
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Install on your Android phone, tablet, or PC for fast 1-tap home-screen launch and reliable offline caching.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shrink-0"
        >
          <Download className="w-4 h-4" />
          Install ShopScan PWA
        </button>

        {showGuide && <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  // Header / top bar variant
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install Progressive Web App for fast cashier access and offline reliability"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors whitespace-nowrap shrink-0 ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {installSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          Innowear POS installed successfully!
        </div>
      )}

      {showGuide && <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />}
    </>
  );
};

interface InstallGuideModalProps {
  isIOS: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isIOS, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">How to Install Innowear POS</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-xs text-slate-300 leading-relaxed">
          {isIOS ? (
            <div className="space-y-2.5">
              <p className="font-medium text-slate-200">On iPhone or iPad (Safari browser):</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>Tap the <strong>Share</strong> button (box with an upward arrow) in the Safari toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="font-medium text-slate-200">On Android (Chrome / Edge):</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>Tap the <strong>three dots menu (⋮)</strong> in the top-right corner of Chrome.</li>
                <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Confirm by clicking <strong>Install</strong>.</li>
              </ol>
              <p className="font-medium text-slate-200 pt-2 border-t border-slate-800">On Windows / Mac / Chromebook (Chrome / Edge):</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                <li>Click the install icon in the right side of the URL address bar.</li>
                <li>Click <strong>Install</strong> to run Innowear POS in a clean standalone window.</li>
              </ol>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400">
            <strong>Offline App Shell:</strong> Once loaded, Innowear POS caches its application code so cashiers can operate even during intermittent internet downtime in Kasama.
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
