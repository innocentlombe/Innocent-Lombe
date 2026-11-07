import React, { useState } from 'react';
import { Shield, KeyRound, Check, Sparkles, Building2, AlertCircle } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const FirstRunModal: React.FC = () => {
  const { isFirstRun, setupFirstRun, storeProfile } = usePOS();

  const [adminUsername, setAdminUsername] = useState('innocent');
  const [adminName, setAdminName] = useState('Innocent Lombe (Owner)');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPin, setAdminPin] = useState('1234');
  const [employeePin, setEmployeePin] = useState('0000');
  const [error, setError] = useState<string | null>(null);

  if (!isFirstRun) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminUsername.trim()) {
      setError('Please provide an administrator username.');
      return;
    }
    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!/^\d{4,6}$/.test(adminPin.trim())) {
      setError('Owner/Admin PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (!/^\d{4,6}$/.test(employeePin.trim())) {
      setError('Employee PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (adminPin.trim() === employeePin.trim()) {
      setError('Owner PIN and Employee PIN must be different for role separation.');
      return;
    }

    setupFirstRun({
      adminUsername: adminUsername.trim(),
      adminName: adminName.trim(),
      adminPasswordHash: adminPassword,
      adminPin: adminPin.trim(),
      employeePin: employeePin.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        
        {/* Header Badge */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shrink-0">
            IW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Initial Setup & Staff Credentials</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                First Run
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome to ShopScan POS for <strong className="text-slate-200">{storeProfile.businessName}</strong> ({storeProfile.city}, {storeProfile.country}).
            </p>
          </div>
        </div>

        {/* Business Profile Summary */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-3">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-white">Default Business Profile Configured:</p>
            <p className="text-slate-400">
              Address: <span className="text-slate-200">{storeProfile.address}, {storeProfile.city}, {storeProfile.country}</span> · Phone: <span className="text-slate-200">{storeProfile.phone}</span> · Currency: <span className="text-amber-400 font-mono font-semibold">{storeProfile.currencySymbol} (Kwacha)</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Full Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
                placeholder="e.g. Innocent Lombe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
                placeholder="admin username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Password (min. 8 chars)
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Quick PIN Section */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Role Separation Quick PINs (4-6 Digits)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Owner / Admin PIN</span>
                  <span className="text-[10px] text-amber-400 font-mono">Full Access</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-center tracking-widest text-white focus:outline-hidden focus:border-amber-500 transition-colors"
                  placeholder="e.g. 1234"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Controls Products, Cost Prices, Reports, Settings & Backups. Keep private.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Employee PIN</span>
                  <span className="text-[10px] text-blue-400 font-mono">Sales & Orders</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={employeePin}
                  onChange={(e) => setEmployeePin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-center tracking-widest text-white focus:outline-hidden focus:border-amber-500 transition-colors"
                  placeholder="e.g. 0000"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used by day-to-day staff for POS basket checkout and order updates.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-normal">
            <strong>Security Notice:</strong> This PIN gate is a local browser prototype. Choose distinct PINs for the Owner and Employees. You can edit PINs or add more staff accounts anytime in Settings.
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Complete Setup & Launch POS</span>
          </button>
        </form>

      </div>
    </div>
  );
};
