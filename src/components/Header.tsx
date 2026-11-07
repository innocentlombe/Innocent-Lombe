import React, { useState } from 'react';
import {
  ShoppingBag,
  Package,
  Truck,
  BarChart3,
  Settings,
  Lock,
  UserCheck,
  Shield,
  WifiOff,
  LogOut,
} from 'lucide-react';
import { usePOS, ActiveTab } from '../context/POSContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './common/PWAInstallButton';

interface HeaderProps {
  onOpenPinModal: (targetTab?: ActiveTab) => void;
  onOpenStaffModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPinModal, onOpenStaffModal }) => {
  const {
    activeTab,
    requestNavigate,
    setActiveTab,
    activeUser,
    currentUserRole,
    cartItemCount,
    logout,
  } = usePOS();
  const isOnline = useOnlineStatus();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleNavClick = (tab: ActiveTab) => {
    const allowed = requestNavigate(tab);
    if (!allowed) {
      onOpenPinModal(tab);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2.5 text-left group focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md font-extrabold text-base tracking-tighter">
              IW
            </div>
            <div>
              <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                INNOWEAR
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest text-amber-500/90 font-semibold">
                KASAMA
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleNavClick('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>POS Register</span>
            {cartItemCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'pos' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
              }`}>
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'products'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Deliveries</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
            {currentUserRole === 'employee' && (
              <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
            {currentUserRole === 'employee' && (
              <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Action & Staff Lock */}
        <div className="flex items-center gap-2 shrink-0">
          {!isOnline && (
            <div
              title="Operating in offline mode. Local cached storage is active."
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-[11px] font-medium border border-amber-500/30"
            >
              <WifiOff className="w-3 h-3 animate-pulse" />
              <span className="hidden md:inline">Offline</span>
            </div>
          )}

          <PWAInstallButton />

          {/* User profile / Staff switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors focus:outline-hidden"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentUserRole === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
              }`}>
                {currentUserRole === 'admin' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
              </div>
              <span className="max-w-[90px] sm:max-w-[130px] truncate font-medium text-left">
                {activeUser?.name || 'Cashier'}
              </span>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1.5 text-xs text-slate-200 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">{activeUser?.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">Role: {currentUserRole}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenStaffModal();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Switch Staff / Enter PIN</span>
                </button>

                {currentUserRole === 'employee' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenPinModal();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-amber-400 font-medium"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Unlock Owner / Admin</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-rose-400"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Terminal / Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
