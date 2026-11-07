import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  CreditCard,
  DollarSign,
  Package,
  Lock,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { exportSalesCSV } from '../../services/storage';
import { Sale } from '../../types/pos';

type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'all';

interface ReportsViewProps {
  onOpenPinModal: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenPinModal }) => {
  const { sales, storeProfile, currentUserRole } = usePOS();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const isAdmin = currentUserRole === 'admin';

  // Filter sales by timeRange
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((sale) => {
      const saleTime = new Date(sale.timestamp).getTime();
      switch (timeRange) {
        case 'today':
          return saleTime >= todayStart;
        case 'yesterday':
          return saleTime >= yesterdayStart && saleTime < todayStart;
        case 'week':
          return saleTime >= weekStart;
        case 'month':
          return saleTime >= monthStart;
        case 'all':
        default:
          return true;
      }
    });
  }, [sales, timeRange]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    let totalUnits = 0;

    const paymentTotals: Record<string, number> = {};
    const productStats: Record<string, { name: string; category: string; units: number; revenue: number; profit: number }> = {};
    const customerMap: Record<string, { name: string; phone: string; orderCount: number; totalSpend: number; lastDate: string }> = {};

    filteredSales.forEach((sale) => {
      totalRevenue += sale.totalAmount;
      totalCost += sale.costTotal;
      totalDiscount += sale.discountAmount;

      // Payment method breakdown
      paymentTotals[sale.paymentMethod] = (paymentTotals[sale.paymentMethod] || 0) + sale.totalAmount;

      // Items aggregation
      sale.items.forEach((item) => {
        totalUnits += item.quantity;
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.name,
            category: item.category,
            units: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productStats[item.productId].units += item.quantity;
        productStats[item.productId].revenue += item.subtotal;
        productStats[item.productId].profit += item.subtotal - item.costPrice * item.quantity;
      });

      // Customer aggregation
      if (sale.customerName) {
        const key = (sale.customerPhone || sale.customerName).toLowerCase();
        if (!customerMap[key]) {
          customerMap[key] = {
            name: sale.customerName,
            phone: sale.customerPhone || 'N/A',
            orderCount: 0,
            totalSpend: 0,
            lastDate: sale.timestamp,
          };
        }
        customerMap[key].orderCount += 1;
        customerMap[key].totalSpend += sale.totalAmount;
        if (new Date(sale.timestamp) > new Date(customerMap[key].lastDate)) {
          customerMap[key].lastDate = sale.timestamp;
        }
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
    const customers = Object.values(customerMap).sort((a, b) => b.totalSpend - a.totalSpend);

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      totalDiscount,
      totalUnits,
      orderCount: filteredSales.length,
      averageOrderValue,
      paymentTotals,
      topProducts,
      customers,
    };
  }, [filteredSales]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Owner / Admin Access Required</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Sales reports and profit margins are restricted to store administrators. Enter your Administrator PIN to view analytics.
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-6">
      
      {/* Header & Export Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Sales Performance & Profit Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time gross revenue, profit margins, top selling garments, and customer summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {(['today', 'yesterday', 'week', 'month', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  timeRange === r
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Time' : r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => exportSalesCSV(filteredSales, storeProfile.currencySymbol)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Gross Sales Revenue</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {storeProfile.currencySymbol} {metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {metrics.orderCount} transaction{metrics.orderCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Gross Profit</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {storeProfile.currencySymbol} {metrics.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-400/80 font-medium mt-1">
            Profit Margin: <span className="font-mono font-bold">{metrics.profitMargin.toFixed(1)}%</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Garments Sold</p>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {metrics.totalUnits} pcs
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Avg Order: <span className="font-mono">{storeProfile.currencySymbol}{metrics.averageOrderValue.toFixed(0)}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Cost of Goods Sold (COGS)</p>
          <p className="text-2xl font-bold font-mono text-slate-300 mt-1">
            {storeProfile.currencySymbol} {metrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Discounts: <span className="font-mono">-{storeProfile.currencySymbol}{metrics.totalDiscount.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* 2-Column Split: Payment Breakdown + Top Selling Garments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Payment Methods Breakdown (4 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Sales by Payment Method</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(metrics.paymentTotals).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No sales recorded in this period.</p>
            ) : (
              Object.entries(metrics.paymentTotals).map(([method, amount]) => {
                const pct = metrics.totalRevenue > 0 ? (amount / metrics.totalRevenue) * 100 : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">{method}</span>
                      <span className="font-mono font-semibold text-white">
                        {storeProfile.currencySymbol} {amount.toFixed(2)} <span className="text-slate-400 text-[10px]">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Top-Selling Garments & Margin</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-2">Garment</th>
                  <th className="pb-2 text-center">Units</th>
                  <th className="pb-2 text-right">Revenue</th>
                  <th className="pb-2 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.topProducts.slice(0, 6).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/40">
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold text-white truncate max-w-[180px]">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.category}</p>
                    </td>
                    <td className="py-2.5 text-center font-mono font-semibold text-slate-200">
                      {item.units}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-white">
                      {storeProfile.currencySymbol} {item.revenue.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-emerald-400">
                      {storeProfile.currencySymbol} {item.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Customer Summary Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Customer Summary & Order History</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {metrics.customers.length} registered customer{metrics.customers.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Phone Number</th>
                <th className="py-2.5 px-3 text-center">Total Orders</th>
                <th className="py-2.5 px-3 text-right">Total Spend</th>
                <th className="py-2.5 px-3 text-right">Last Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No customer data recorded yet. Enter customer names during POS checkout to build your CRM.
                  </td>
                </tr>
              ) : (
                metrics.customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{c.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{c.phone}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-200">
                      {c.orderCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      {storeProfile.currencySymbol} {c.totalSpend.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {new Date(c.lastDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
