/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { POSProvider, usePOS, ActiveTab } from './context/POSContext';
import { Header } from './components/Header';
import { FirstRunModal } from './components/FirstRunModal';
import { PinPromptModal } from './components/PinPromptModal';
import { StaffSwitcherModal } from './components/StaffSwitcherModal';
import { POSTerminal } from './components/pos/POSTerminal';
import { ProductManagement } from './components/products/ProductManagement';
import { OrderTracking } from './components/orders/OrderTracking';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

function AppContent() {
  const { activeTab, setActiveTab, storeProfile, activeUser } = usePOS();

  // Pin & Staff Switcher Modals
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [targetTabForPin, setTargetTabForPin] = useState<ActiveTab | undefined>(undefined);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const handleOpenPinModal = (targetTab?: ActiveTab) => {
    setTargetTabForPin(targetTab);
    setIsPinModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Bar Header */}
      <Header
        onOpenPinModal={handleOpenPinModal}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'pos' && <POSTerminal />}
        {activeTab === 'products' && (
          <ProductManagement onOpenPinModal={() => handleOpenPinModal('products')} />
        )}
        {activeTab === 'orders' && <OrderTracking />}
        {activeTab === 'reports' && (
          <ReportsView onOpenPinModal={() => handleOpenPinModal('reports')} />
        )}
        {activeTab === 'settings' && (
          <SettingsView onOpenPinModal={() => handleOpenPinModal('settings')} />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900/80 py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-400">
            {storeProfile.businessName} · {storeProfile.address}, {storeProfile.city}, {storeProfile.country}
          </p>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>ShopScan POS Starter</span>
            <span>·</span>
            <span>Tel: {storeProfile.phone}</span>
            <span>·</span>
            <span className="font-mono text-amber-500/80">{storeProfile.currencySymbol} Kwacha</span>
          </div>
        </div>
      </footer>

      {/* First Run Onboarding Modal */}
      <FirstRunModal />

      {/* Tactile PIN Prompt Modal */}
      <PinPromptModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        targetTab={targetTabForPin}
        adminOnly={true}
      />

      {/* Staff Switcher Modal */}
      <StaffSwitcherModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
