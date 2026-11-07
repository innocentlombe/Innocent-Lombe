import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CustomerOrder, DeliveryStatus } from '../../types/pos';

const STATUS_OPTIONS: DeliveryStatus[] = [
  'Pending',
  'Processing',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export const OrderTracking: React.FC = () => {
  const { orders, updateOrderStatus, storeProfile } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | DeliveryStatus>('All');

  // Filter orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchStatus = selectedStatus === 'All' || order.status === selectedStatus;
      if (!matchStatus) return false;
      if (!q) return true;

      return (
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.deliveryAddress.toLowerCase().includes(q)
      );
    });
  }, [orders, selectedStatus, searchQuery]);

  // Counts by status
  const counts = useMemo(() => {
    const res: Record<string, number> = { All: orders.length };
    orders.forEach((o) => {
      res[o.status] = (res[o.status] || 0) + 1;
    });
    return res;
  }, [orders]);

  const handleWhatsAppStatusUpdate = (order: CustomerOrder) => {
    const message = [
      `Hello ${order.customerName}! 👋`,
      `Update from *${storeProfile.businessName}* (Kasama):`,
      `Your order *#${order.id}* is currently: *${order.status.toUpperCase()}*.`,
      order.status === 'Ready for Pickup'
        ? `📍 Your items are packed and ready for collection at our shop: ${storeProfile.address}, ${storeProfile.city}.`
        : order.status === 'Out for Delivery'
        ? `🚚 Our delivery rider is on the way to: ${order.deliveryAddress}. Please keep your phone reachable.`
        : order.status === 'Delivered'
        ? `✅ Your order has been delivered! Thank you for choosing Innowear Fashion Collection.`
        : `We are preparing your items carefully.`,
      `--------------------------------`,
      `Total: ${storeProfile.currencySymbol}${order.totalAmount.toFixed(2)} (${order.paymentStatus})`,
      `Store phone: ${storeProfile.phone}`,
    ].join('\n');

    let phone = order.customerPhone.replace(/\D/g, '');
    if (phone && !phone.startsWith('260') && phone.startsWith('0')) {
      phone = '260' + phone.slice(1);
    }
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getStatusBadgeClass = (status: DeliveryStatus) => {
    switch (status) {
      case 'Pending':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Processing':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Ready for Pickup':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'Out for Delivery':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Delivered':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Cancelled':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Customer Orders & Delivery Dispatch</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track customer orders, pickup status, Kasama deliveries, and send WhatsApp dispatch updates.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Active Orders: <strong className="text-amber-400">{orders.length}</strong>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer name, phone, or location..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedStatus('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              selectedStatus === 'All'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            All ({counts['All'] || 0})
          </button>

          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                selectedStatus === status
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {status} ({counts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
            <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">No orders found.</p>
            <p className="text-xs text-slate-500 mt-1">Orders created with delivery during checkout appear here.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Order Info */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm text-white">{order.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>{order.customerName}</span>
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-1 text-slate-400 font-mono">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>{order.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{order.deliveryAddress} ({order.city})</span>
                  </div>
                </div>

                {/* Garments Breakdown */}
                <div className="text-xs text-slate-400 pt-1">
                  <span className="font-semibold text-slate-300">Garments: </span>
                  {order.items.map((i, idx) => (
                    <span key={idx} className="text-slate-300">
                      {i.name} ({i.size}/{i.colour}) x{i.quantity}
                      {idx < order.items.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>

                {order.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800/60 inline-block">
                    Note: {order.notes}
                  </p>
                )}
              </div>

              {/* Status Update & Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400">Total Amount</p>
                  <p className="text-base font-bold font-mono text-amber-400">
                    {storeProfile.currencySymbol} {order.totalAmount.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                    Status: {order.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as DeliveryStatus)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-hidden focus:border-amber-500 transition-colors"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {/* WhatsApp Notification Button */}
                  <button
                    type="button"
                    onClick={() => handleWhatsAppStatusUpdate(order)}
                    title="Notify Customer on WhatsApp"
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
