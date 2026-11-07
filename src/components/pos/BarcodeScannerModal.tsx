import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, AlertCircle, Check, Sparkles } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
}) => {
  const { products } = usePOS();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setManualCode('');
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera could not be started:', err);
      setCameraError('Camera not accessible or permission denied. You can use manual entry or simulated barcode test chips below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onBarcodeDetected(manualCode.trim());
    onClose();
  };

  const handleSimulatedScan = (barcode: string) => {
    onBarcodeDetected(barcode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Barcode & SKU Scanner</h3>
              <p className="text-[11px] text-slate-400">Aim camera at garment tag or select test barcode</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative mt-4 w-full h-52 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            <div className="text-center p-4">
              <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {cameraError || 'Initializing camera stream...'}
              </p>
            </div>
          )}

          {/* Aim Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-28 border-2 border-dashed border-amber-400/80 rounded-xl relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 shadow-sm animate-pulse" />
            </div>
          </div>

          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="text-[10px] bg-slate-950/80 text-amber-400 px-2 py-0.5 rounded-full font-mono border border-slate-800">
              Align barcode within the target box
            </span>
          </div>
        </div>

        {/* Manual Input */}
        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Type barcode or SKU (e.g. INNO-CHIT-001)..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors shrink-0"
          >
            Lookup
          </button>
        </form>

        {/* Quick Simulated Barcode Buttons (Cashier Ergonomics) */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Quick Scan (Garment Catalog Barcodes):</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {products.slice(0, 8).map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleSimulatedScan(prod.barcode)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs group"
              >
                <div className="truncate mr-2">
                  <p className="text-slate-200 font-medium truncate group-hover:text-amber-400 transition-colors">
                    {prod.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {prod.barcode}
                  </p>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold shrink-0">
                  K{prod.sellingPrice}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
