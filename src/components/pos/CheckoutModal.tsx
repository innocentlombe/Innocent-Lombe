import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  Percent,
  Truck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { PaymentMethod, Sale } from '../../types/pos';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted: (sale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
}) => {
  const { cart, cartSubtotal, storeProfile, completeSale } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTenderedStr, setAmountTenderedStr] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isDeliveryOrder, setIsDeliveryOrder] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = cartSubtotal;
  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const discountedSubtotal = subtotal - discountAmount;
  const taxRate = storeProfile.enableTax ? storeProfile.taxRate : 0;
  const taxAmount = (discountedSubtotal * taxRate) / 100;
  const grandTotal = discountedSubtotal + taxAmount;

  // Tendered calculation
  const amountTendered = amountTenderedStr === '' ? grandTotal : parseFloat(amountTenderedStr) || 0;
  const changeDue = Math.max(0, amountTendered - grandTotal);

  if (!isOpen) return null;

  const handleQuickCash = (amount: number) => {
    setPaymentMethod('Cash');
    setAmountTenderedStr(amount.toString());
  };

  const handleExactCash = () => {
    setAmountTenderedStr(grandTotal.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Cannot complete sale: basket is empty.');
      return;
    }

    if (paymentMethod === 'Cash' && amountTendered < grandTotal) {
      setError(`Amount tendered (${storeProfile.currencySymbol}${amountTendered}) is less than total due (${storeProfile.currencySymbol}${grandTotal.toFixed(2)}).`);
      return;
    }

    if (isDeliveryOrder && !customerName.trim()) {
      setError('Please provide customer name for delivery orders.');
      return;
    }

    try {
      const createdSale = completeSale({
        paymentMethod,
        amountTendered: paymentMethod === 'Cash' ? amountTendered : grandTotal,
        discountType,
        discountValue,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: isDeliveryOrder ? deliveryAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        isDeliveryOrder,
      });

      onSaleCompleted(createdSale);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to finalize sale.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Checkout & Payment</h3>
            <p className="text-xs text-slate-400">
              {cart.length} item{cart.length > 1 ? 's' : ''} in basket
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Total display card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-mono text-slate-400">Total Amount Due</p>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                {storeProfile.currencySymbol} {grandTotal.toFixed(2)}
              </p>
            </div>
            {discountAmount > 0 && (
              <div className="text-right">
                <span className="text-[11px] text-rose-400 font-medium">
                  Saved {storeProfile.currencySymbol}{discountAmount.toFixed(2)}
                </span>
                <p className="text-xs text-slate-500 line-through font-mono">
                  {storeProfile.currencySymbol}{subtotal.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'Cash'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Airtel Money')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'Airtel Money'
                    ? 'border-red-500 bg-red-500/15 text-red-300 shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-red-400" />
                <span>Airtel Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('MTN MoMo')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'MTN MoMo'
                    ? 'border-yellow-500 bg-yellow-500/15 text-yellow-300 shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
                <span>MTN MoMo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Zamtel Kwacha')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'Zamtel Kwacha'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zamtel Kwacha</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card / POS')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'Card / POS'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-300 shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Card / POS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Bank Transfer')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'Bank Transfer'
                    ? 'border-purple-500 bg-purple-500/15 text-purple-300 shadow-xs'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          {/* Cash Tendered & Change Section */}
          {paymentMethod === 'Cash' && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Amount Tendered ({storeProfile.currencySymbol})
                </label>
                <button
                  type="button"
                  onClick={handleExactCash}
                  className="text-[11px] text-amber-400 hover:underline font-medium"
                >
                  Exact ({storeProfile.currencySymbol}{grandTotal.toFixed(2)})
                </button>
              </div>

              <input
                type="number"
                step="1"
                min="0"
                value={amountTenderedStr}
                onChange={(e) => setAmountTenderedStr(e.target.value)}
                placeholder={grandTotal.toString()}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-hidden focus:border-amber-500"
              />

              {/* Quick Cash Buttons in Zambian Kwacha */}
              <div className="flex flex-wrap gap-1.5">
                {[50, 100, 200, 500, 1000].map((denomination) => (
                  <button
                    key={denomination}
                    type="button"
                    onClick={() => handleQuickCash(denomination)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-medium text-slate-200 transition-colors"
                  >
                    K{denomination}
                  </button>
                ))}
              </div>

              {/* Change Due Banner */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Change Due to Customer:</span>
                <span className={`font-mono text-sm font-bold ${
                  changeDue > 0 ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {storeProfile.currencySymbol} {changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Discount Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Discount Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`py-1 text-xs font-medium rounded-md transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  % Percent
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`py-1 text-xs font-medium rounded-md transition-colors ${
                    discountType === 'fixed'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  K Amount
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Discount Value {discountType === 'percentage' ? '(%)' : `(${storeProfile.currencySymbol})`}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : subtotal}
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Customer Details & Delivery Checkbox */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Bwalya Musonda"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Customer Phone (for WhatsApp Receipt)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +260977123456"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Delivery Order Toggle */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  checked={isDeliveryOrder}
                  onChange={(e) => setIsDeliveryOrder(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-700 text-amber-500 focus:ring-0 bg-slate-900"
                />
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  Route as Customer Delivery Order (Track status in Kasama)
                </span>
              </label>

              {isDeliveryOrder && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address / landmark in Kasama (e.g. Plot 12, Tazara Area)..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Note or reference */}
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mobile Money reference number or cashier notes (optional)..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Complete Sale & Issue Receipt</span>
          </button>
        </form>

      </div>
    </div>
  );
};
