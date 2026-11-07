import React, { useState } from 'react';
import { UserCheck, Shield, X, KeyRound, Check } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { StaffUser } from '../types/pos';

interface StaffSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffSwitcherModal: React.FC<StaffSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { staffUsers, activeUser, loginWithPin } = usePOS();
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectUser = (user: StaffUser) => {
    setSelectedUser(user);
    setPin('');
    setError(null);
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin.trim() !== selectedUser.pin) {
      setError(`Incorrect PIN for ${selectedUser.name}.`);
      return;
    }

    loginWithPin(pin.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Switch Active Staff</h3>
              <p className="text-[11px] text-slate-400">Select cashier account to log sale credits & access</p>
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

        {/* Staff accounts list */}
        <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
          {staffUsers.filter((u) => u.active).map((user) => {
            const isCurrent = activeUser?.id === user.id;
            const isSelected = selectedUser?.id === user.id;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : isCurrent
                    ? 'border-slate-700 bg-slate-800/60'
                    : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    user.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                  }`}>
                    {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {user.role} {user.username ? `· @${user.username}` : ''}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Enter PIN for selected staff */}
        {selectedUser && (
          <form onSubmit={handleConfirmLogin} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter PIN for <strong className="text-amber-400">{selectedUser.name}</strong>
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                autoFocus
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center text-base font-mono tracking-widest text-white focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Sign In as {selectedUser.name.split(' ')[0]}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
