import React, { useState, useRef } from 'react';
import {
  Settings,
  Building2,
  KeyRound,
  Shield,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  UserPlus,
  Trash2,
  Check,
  RefreshCw,
  Smartphone,
  Save,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import {
  exportDatabaseJSON,
  parseAndValidateBackupJSON,
  exportSalesCSV,
  exportProductsCSV,
} from '../../services/storage';
import { StaffUser } from '../../types/pos';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface SettingsViewProps {
  onOpenPinModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenPinModal }) => {
  const {
    database,
    storeProfile,
    staffUsers,
    products,
    sales,
    currentUserRole,
    updateStoreProfile,
    addStaffUser,
    updateStaffUser,
    deleteStaffUser,
    restoreFromBackup,
    resetToDefaults,
  } = usePOS();

  const isAdmin = currentUserRole === 'admin';

  // Store Profile Form State
  const [businessName, setBusinessName] = useState(storeProfile.businessName);
  const [phone, setPhone] = useState(storeProfile.phone);
  const [address, setAddress] = useState(storeProfile.address);
  const [city, setCity] = useState(storeProfile.city);
  const [country, setCountry] = useState(storeProfile.country);
  const [currencySymbol, setCurrencySymbol] = useState(storeProfile.currencySymbol);
  const [enableTax, setEnableTax] = useState(storeProfile.enableTax);
  const [taxRate, setTaxRate] = useState(storeProfile.taxRate.toString());
  const [receiptFooter, setReceiptFooter] = useState(storeProfile.receiptFooter);
  const [adminPin, setAdminPin] = useState(storeProfile.adminPin);
  const [employeePin, setEmployeePin] = useState(storeProfile.employeePin);

  const [profileSaved, setProfileSaved] = useState(false);

  // New staff modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'employee' | 'admin'>('employee');

  // File input ref for JSON restore
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Owner / Admin Settings Gate</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          System settings, backup restoration, and staff PIN configurations are restricted to administrators.
        </p>
        <button
          type="button"
          onClick={onOpenPinModal}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
        >
          Enter Admin PIN
        </button>
      </div>
    );
  }

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile({
      businessName: businessName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      currencySymbol: currencySymbol.trim(),
      enableTax,
      taxRate: parseFloat(taxRate) || 0,
      receiptFooter: receiptFooter.trim(),
      adminPin: adminPin.trim(),
      employeePin: employeePin.trim(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !/^\d{4,6}$/.test(newStaffPin.trim())) {
      alert('Please enter a valid staff name and a 4-6 digit numeric PIN.');
      return;
    }
    addStaffUser({
      name: newStaffName.trim(),
      username: newStaffUsername.trim() || newStaffName.toLowerCase().replace(/\s+/g, '_'),
      pin: newStaffPin.trim(),
      role: newStaffRole,
      active: true,
    });
    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffUsername('');
    setNewStaffPin('');
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateBackupJSON(content);
      if (res.success && res.data) {
        if (
          window.confirm(
            `Restore database from backup? This will replace current records with ${res.data.products.length} products, ${res.data.sales.length} sales, and ${res.data.orders.length} orders.`
          )
        ) {
          restoreFromBackup(res.data);
          setRestoreMessage({ text: 'Database restored successfully!', isError: false });
        }
      } else {
        setRestoreMessage({ text: res.error || 'Invalid backup file structure.', isError: true });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Store Configuration & Data Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage Innowear store profile, employee PINs, JSON backups, and CSV sales exports.
          </p>
        </div>
      </div>

      {/* MANDATORY SECURITY WARNING BANNER */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-400 uppercase tracking-wide">
            Security Notice — Local Device Prototype
          </p>
          <p>
            This PIN gate is a basic local-device prototype, not production-grade security.
            The PIN values are stored in browser-local data and can be bypassed by someone
            with technical access to the device/browser storage. For real staff security,
            deploy server-side accounts, hashed PIN/password credentials, role permissions,
            audit logs and protected database access.
          </p>
        </div>
      </div>

      {/* PWA Install Card */}
      <PWAInstallButton variant="settings" />

      {/* Store Profile Form */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Business Profile & Receipts</span>
          </h3>
          {profileSaved && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveStoreProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Store Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="No. 410"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kasama"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="K"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-amber-400 font-bold focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Role Separation Master PINs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex justify-between">
                  <span>Owner / Administrator PIN</span>
                  <span className="text-[10px] text-amber-400 font-mono">Full Access</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-center tracking-widest text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex justify-between">
                  <span>Employee / Cashier PIN</span>
                  <span className="text-[10px] text-blue-400 font-mono">Sales & Deliveries</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={employeePin}
                  onChange={(e) => setEmployeePin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-center tracking-widest text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Thermal Receipt Footer Policy Note</label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Store Settings</span>
          </button>
        </form>
      </div>

      {/* Staff Accounts Management */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Employee Accounts & Cashiers</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cashiers have restricted access to sales checkout and customer order tracking.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Cashier</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {staffUsers.map((user) => (
            <div key={user.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  user.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                }`}>
                  {user.role === 'admin' ? 'A' : 'E'}
                </div>
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">
                    Role: {user.role} · PIN: <span className="font-mono text-slate-300">••••</span>
                  </p>
                </div>
              </div>

              {user.role !== 'admin' && staffUsers.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete staff account "${user.name}"?`)) {
                      deleteStaffUser(user.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Remove Staff"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* JSON Backup & Restore + CSV Exports */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <span>Data Backup, Restore & CSV Reports</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export JSON backups to transfer data between devices, or export CSV spreadsheets for accountant analysis.
          </p>
        </div>

        {restoreMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            restoreMessage.isError
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{restoreMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Download JSON Backup */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Download className="w-4 h-4 text-amber-400" />
                Download JSON Backup
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Creates an offline file containing all {products.length} garments, {sales.length} sales, orders, and configuration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportDatabaseJSON(database)}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Download .JSON Backup</span>
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-400" />
                Restore from JSON File
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload a backup file to restore catalog and historical transaction records on this device.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Upload & Restore Backup</span>
              </button>
            </div>
          </div>

          {/* Export Sales CSV */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Export Sales Report (CSV)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Download itemized sales ledger with timestamps, cashiers, payment breakdown, and gross profit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportSalesCSV(sales, storeProfile.currencySymbol)}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Export Sales.csv</span>
            </button>
          </div>

          {/* Export Inventory CSV */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                Export Inventory Stock (CSV)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Download complete stock valuation sheet, SKUs, wholesale costs, and retail prices.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportProductsCSV(products, storeProfile.currencySymbol)}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Export Inventory.csv</span>
            </button>
          </div>
        </div>

        {/* Reset to Demo Defaults */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-300">Reset to Innowear Kasama Demo Data</p>
            <p className="text-[11px] text-slate-500">Restores initial fashion items, sample sales, and orders.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all local data back to initial Innowear Kasama defaults?')) {
                resetToDefaults();
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>

      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <h3 className="font-bold text-sm text-white mb-3">Add Employee Account</h3>
            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Mulenga Bwalya"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Quick PIN (4-6 Digits)</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-center tracking-widest text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value="employee">Employee / Cashier (POS & Orders)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
