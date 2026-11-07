import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sliders,
  Plus,
  ShoppingBag,
  Check,
  Package,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';

interface LowStockWidgetProps {
  onSelectProductForBasket?: (product: Product) => void;
  onFilterCatalogByLowStock?: (active: boolean) => void;
  isCatalogFilteredByLowStock?: boolean;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  onSelectProductForBasket,
  onFilterCatalogByLowStock,
  isCatalogFilteredByLowStock = false,
}) => {
  const { products, storeProfile, updateStoreProfile, adjustStock, addToCart } = usePOS();

  // Local state for threshold (initializes from storeProfile or 5)
  const [threshold, setThreshold] = useState<number>(() => {
    return storeProfile.lowStockAlertThreshold ?? 5;
  });

  // Widget collapse state (remembered in sessionStorage)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('innowear_low_stock_expanded');
    return saved !== null ? saved === 'true' : true;
  });

  // Settings dropdown for custom threshold
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick Restock dialog
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);

  const toggleExpanded = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    sessionStorage.setItem('innowear_low_stock_expanded', String(next));
  };

  // Find products where stock is below the customizable threshold
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => p.stockQuantity <= threshold)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }, [products, threshold]);

  const outOfStockCount = useMemo(() => {
    return lowStockProducts.filter((p) => p.stockQuantity === 0).length;
  }, [lowStockProducts]);

  const handleSetThreshold = (val: number) => {
    const safeVal = Math.max(1, Math.min(100, val));
    setThreshold(safeVal);
  };

  const handleSaveAsDefault = () => {
    updateStoreProfile({ lowStockAlertThreshold: threshold });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowThresholdSettings(false);
    }, 1800);
  };

  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockProduct || restockQty <= 0) return;
    adjustStock(quickRestockProduct.id, restockQty);
    setQuickRestockProduct(null);
    setRestockQty(5);
  };

  const handleQuickAdd = (product: Product) => {
    if (onSelectProductForBasket) {
      onSelectProductForBasket(product);
    } else {
      addToCart(product, product.sizes[0] || 'Default', product.colours[0] || 'Default', 1);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-amber-500/30 overflow-hidden shadow-lg transition-all">
      
      {/* Widget Header Strip */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/15 via-slate-900/80 to-slate-900 flex items-center justify-between gap-3 border-b border-amber-500/20">
        
        {/* Left: Icon + Title + Count */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            lowStockProducts.length > 0
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-tight">
                Low Stock Alert
              </h3>
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.2 rounded-full ${
                lowStockProducts.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {lowStockProducts.length} {lowStockProducts.length === 1 ? 'item' : 'items'}
              </span>
              {outOfStockCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded-full hidden sm:inline">
                  {outOfStockCount} out of stock
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Highlighting items with <strong className="text-amber-400 font-mono">≤ {threshold} units</strong> remaining
            </p>
          </div>
        </div>

        {/* Right: Controls & Threshold Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Threshold Settings Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThresholdSettings(!showThresholdSettings)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              title="Change minimum stock threshold"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Threshold:</span>
              <span className="font-mono text-amber-400 font-bold">≤{threshold}</span>
            </button>

            {/* Threshold Popover Dropdown */}
            {showThresholdSettings && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 text-xs z-50 animate-scale-up">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Customise Threshold</span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">≤ {threshold} pcs</span>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Alert when stock quantity falls to or below:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetThreshold(threshold - 1)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={threshold}
                        onChange={(e) => handleSetThreshold(parseInt(e.target.value) || 1)}
                        className="flex-1 text-center py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono font-bold text-amber-400 focus:outline-hidden focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetThreshold(threshold + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">
                      Quick Presets
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSetThreshold(preset)}
                          className={`py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                            threshold === preset
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          ≤ {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save as default button */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleSaveAsDefault}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved as Store Default!</span>
                        </>
                      ) : (
                        <span>Save as Store Default</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Catalog Filter Toggle */}
          {onFilterCatalogByLowStock && (
            <button
              type="button"
              onClick={() => onFilterCatalogByLowStock(!isCatalogFilteredByLowStock)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                isCatalogFilteredByLowStock
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{isCatalogFilteredByLowStock ? 'Showing Low Stock' : 'Filter Grid'}</span>
            </button>
          )}

          {/* Expand / Collapse Button */}
          <button
            type="button"
            onClick={toggleExpanded}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse Widget' : 'Expand Widget'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-3.5 space-y-3">
          
          {lowStockProducts.length === 0 ? (
            <div className="py-4 px-3 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
              <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-200">
                All Fashion Inventory is Healthy
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No products are currently at or below the threshold of {threshold} units in stock.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {lowStockProducts.map((prod) => {
                const isZero = prod.stockQuantity === 0;

                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      isZero
                        ? 'bg-rose-950/20 border-rose-800/50 hover:border-rose-700'
                        : 'bg-slate-950/60 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    <div>
                      {/* Top Bar: SKU + Stock Status */}
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-mono text-slate-400 font-semibold">{prod.barcode}</span>
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded-sm ${
                          isZero
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {isZero ? '0 in stock' : `${prod.stockQuantity} left`}
                        </span>
                      </div>

                      {/* Garment Title & Price */}
                      <p className="font-semibold text-xs text-white truncate" title={prod.name}>
                        {prod.name}
                      </p>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>{prod.category}</span>
                        <span className="font-mono font-bold text-amber-400">
                          {storeProfile.currencySymbol}{prod.sellingPrice.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Quick Restock & Add to Basket */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickRestockProduct(prod);
                          setRestockQty(5);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="Intake fresh delivery / restock"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-amber-400" />
                        <span>Restock</span>
                      </button>

                      <button
                        type="button"
                        disabled={isZero}
                        onClick={() => handleQuickAdd(prod)}
                        className="flex-1 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Add to current customer basket"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Quick Restock Modal Dialog */}
      {quickRestockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Quick Restock / Delivery Intake</h3>
              <button
                type="button"
                onClick={() => setQuickRestockProduct(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ×
              </button>
            </div>

            <div className="my-3 text-xs">
              <p className="font-semibold text-white">{quickRestockProduct.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current stock: <strong className="text-amber-400 font-mono">{quickRestockProduct.stockQuantity} pcs</strong> · SKU: {quickRestockProduct.barcode}
              </p>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Quantity received from supplier / workshop:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockQty(Math.max(1, restockQty - 1))}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-sm font-bold text-amber-400 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setRestockQty(restockQty + 1)}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-1.5 mt-2">
                  {[5, 10, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setRestockQty(qty)}
                      className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">New Resulting Stock:</span>
                <span className="font-bold font-mono text-emerald-400">
                  {quickRestockProduct.stockQuantity + restockQty} pcs
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Confirm Restock
                </button>
                <button
                  type="button"
                  onClick={() => setQuickRestockProduct(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
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
