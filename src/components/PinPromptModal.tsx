import React, { useState, useEffect } from 'react';
import { Shield, X, Delete, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { usePOS, ActiveTab } from '../context/POSContext';

interface PinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTab?: ActiveTab;
  reason?: string;
  adminOnly?: boolean;
}

export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  isOpen,
  onClose,
  targetTab,
  reason,
  adminOnly = true,
}) => {
  const { loginWithPin, verifyAdminPin, setActiveTab, activeUser } = usePOS();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleVerify = (overridePin?: string) => {
    const testPin = overridePin || pin;
    if (!testPin) {
      setError('Please enter your PIN.');
      return;
    }

    if (adminOnly) {
      const isValid = verifyAdminPin(testPin);
      if (isValid) {
        // Also ensure user session is switched/set to admin if not already
        const res = loginWithPin(testPin);
        if (targetTab) {
          setActiveTab(targetTab);
        }
        onClose();
      } else {
        setError('Incorrect Administrator PIN. Access restricted to Owner/Admin.');
        setPin('');
      }
    } else {
      // General staff login
      const res = loginWithPin(testPin);
      if (res.success) {
        if (targetTab) {
          setActiveTab(targetTab);
        }
        onClose();
      } else {
        setError(res.error || 'Invalid PIN.');
        setPin('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 animate-scale-up">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {adminOnly ? 'Administrator Authentication' : 'Staff Quick PIN'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {reason || (adminOnly ? 'Enter Owner PIN to unlock Reports & Settings' : 'Enter your 4-6 digit staff PIN')}
              </p>
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

        {/* PIN Dots Display */}
        <div className="my-5 text-center">
          <div className="flex items-center justify-center gap-2.5 h-12">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-amber-400 scale-110 shadow-xs shadow-amber-400/50'
                      : 'border-2 border-slate-700 bg-slate-800/40'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs text-rose-400 mt-2 font-medium px-2">
              {error}
            </p>
          )}
        </div>

        {/* Tactile Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 font-bold text-lg text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-850 active:bg-slate-700 text-xs font-semibold text-slate-400 transition-colors flex items-center justify-center cursor-pointer select-none"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 font-bold text-lg text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-850 active:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center cursor-pointer select-none"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Enter / Submit Button */}
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={pin.length < 4}
          className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Verify & Unlock</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-3 text-center">
          <p className="text-[10px] text-slate-500">
            Default owner PIN: <span className="font-mono text-slate-400">1234</span> · Default employee PIN: <span className="font-mono text-slate-400">0000</span>
          </p>
        </div>

      </div>
    </div>
  );
};
