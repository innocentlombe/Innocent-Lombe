import React from 'react';
import { Printer, Share2, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { Sale, StoreProfile } from '../../types/pos';

interface ReceiptModalProps {
  sale: Sale | null;
  storeProfile: StoreProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  storeProfile,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp receipt message formatting
  const generateWhatsAppMessage = () => {
    const lines = [
      `*${storeProfile.businessName}*`,
      `📍 ${storeProfile.address}, ${storeProfile.city}`,
      `📞 ${storeProfile.phone}`,
      `--------------------------------`,
      `*Receipt:* ${sale.id}`,
      `*Date:* ${new Date(sale.timestamp).toLocaleString()}`,
      `*Cashier:* ${sale.cashierName}`,
      sale.customerName ? `*Customer:* ${sale.customerName}` : '',
      `--------------------------------`,
      ...sale.items.map(
        (i) => `${i.name} (${i.size}/${i.colour}) x${i.quantity} = ${storeProfile.currencySymbol}${(i.quantity * i.sellingPrice).toFixed(2)}`
      ),
      `--------------------------------`,
      `*Subtotal:* ${storeProfile.currencySymbol}${sale.subtotal.toFixed(2)}`,
      sale.discountAmount > 0 ? `*Discount:* -${storeProfile.currencySymbol}${sale.discountAmount.toFixed(2)}` : '',
      `*TOTAL:* ${storeProfile.currencySymbol}${sale.totalAmount.toFixed(2)}`,
      `*Payment:* ${sale.paymentMethod}`,
      `*Tendered:* ${storeProfile.currencySymbol}${sale.amountTendered.toFixed(2)}`,
      sale.changeDue > 0 ? `*Change:* ${storeProfile.currencySymbol}${sale.changeDue.toFixed(2)}` : '',
      `--------------------------------`,
      storeProfile.receiptFooter,
    ].filter(Boolean);

    return encodeURIComponent(lines.join('\n'));
  };

  const handleWhatsAppShare = () => {
    const encoded = generateWhatsAppMessage();
    let phone = sale.customerPhone?.replace(/\D/g, '') || '';
    if (phone && !phone.startsWith('260') && phone.startsWith('0')) {
      phone = '260' + phone.slice(1);
    }
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold text-white">Sale Completed</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Canvas */}
        <div className="receipt-container mt-4 bg-white text-slate-950 p-5 rounded-xl shadow-inner font-mono text-xs leading-relaxed">
          
          <div className="text-center pb-3 border-b border-dashed border-slate-400">
            <h2 className="font-bold text-base tracking-tight font-sans text-slate-900">
              {storeProfile.businessName}
            </h2>
            <p className="text-[11px] text-slate-700">
              {storeProfile.address}, {storeProfile.city}, {storeProfile.country}
            </p>
            <p className="text-[11px] text-slate-700">
              Tel: {storeProfile.phone}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
              OFFICIAL SALES RECEIPT
            </p>
          </div>

          <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-600">Receipt #:</span>
              <span className="font-bold">{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date:</span>
              <span>{new Date(sale.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cashier:</span>
              <span>{sale.cashierName}</span>
            </div>
            {sale.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-600">Customer:</span>
                <span>{sale.customerName}</span>
              </div>
            )}
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-600">Phone:</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-400">
            <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-slate-600 pb-1">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="space-y-1.5 pt-1 text-[11px]">
              {sale.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-baseline">
                  <div className="col-span-6 truncate pr-1">
                    <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-600">{item.size} / {item.colour}</p>
                  </div>
                  <span className="col-span-2 text-center">{item.quantity}</span>
                  <span className="col-span-2 text-right">{item.sellingPrice.toFixed(2)}</span>
                  <span className="col-span-2 text-right font-semibold">{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payment */}
          <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span>{storeProfile.currencySymbol} {sale.subtotal.toFixed(2)}</span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Discount ({sale.discountType === 'percentage' ? `${sale.discountValue}%` : 'Fixed'}):</span>
                <span>-{storeProfile.currencySymbol} {sale.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {sale.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>VAT ({sale.taxRate}%):</span>
                <span>{storeProfile.currencySymbol} {sale.taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-slate-950 pt-1 border-t border-slate-300">
              <span>TOTAL PAID:</span>
              <span>{storeProfile.currencySymbol} {sale.totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-1 text-slate-700">
              <span>Payment Method:</span>
              <span className="font-semibold text-slate-900">{sale.paymentMethod}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">Amount Tendered:</span>
              <span>{storeProfile.currencySymbol} {sale.amountTendered.toFixed(2)}</span>
            </div>

            {sale.changeDue > 0 && (
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Change Due:</span>
                <span>{storeProfile.currencySymbol} {sale.changeDue.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer & Barcode simulation */}
          <div className="pt-3 text-center text-[10px] text-slate-600 space-y-2">
            <p className="font-mono tracking-widest text-[11px] text-slate-900">
              ||| | ||||| || |||| |||| ||| |||
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {sale.id}
            </p>
            <p className="italic leading-snug">
              {storeProfile.receiptFooter}
            </p>
          </div>

        </div>

        {/* Actions Button Bar */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send WhatsApp</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2.5 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer no-print text-center"
        >
          New Sale / Return to POS
        </button>

      </div>
    </div>
  );
};
