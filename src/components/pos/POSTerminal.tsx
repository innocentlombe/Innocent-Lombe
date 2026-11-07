import React, { useState, useMemo } from 'react';
import {
  Search,
  Scan,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Tag,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product, ProductCategory, Sale } from '../../types/pos';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { LowStockWidget } from './LowStockWidget';

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Traditional & Chitenge',
  'Menswear',
  'Womenswear',
  'Streetwear',
  'Footwear',
  'Accessories',
];

export const POSTerminal: React.FC = () => {
  const {
    products,
    cart,
    cartSubtotal,
    cartItemCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    storeProfile,
    activeUser,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { size: string; colour: string }>>({});
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);
  
  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Initialize selected size and colour for each product
  const getProductVariant = (prod: Product) => {
    if (selectedVariants[prod.id]) {
      return selectedVariants[prod.id];
    }
    return {
      size: prod.sizes[0] || 'Default',
      colour: prod.colours[0] || 'Default',
    };
  };

  const setProductSize = (productId: string, size: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        size,
        colour: prev[productId]?.colour || products.find((p) => p.id === productId)?.colours[0] || 'Default',
      },
    }));
  };

  const setProductColour = (productId: string, colour: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        size: prev[productId]?.size || products.find((p) => p.id === productId)?.sizes[0] || 'Default',
        colour,
      },
    }));
  };

  // Filter products by category, low-stock threshold & search query
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const alertThreshold = storeProfile.lowStockAlertThreshold ?? 5;

    return products.filter((prod) => {
      const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
      if (!matchesCategory) return false;

      if (filterLowStockOnly && prod.stockQuantity > alertThreshold) {
        return false;
      }

      if (!query) return true;

      const inName = prod.name.toLowerCase().includes(query);
      const inBarcode = prod.barcode.toLowerCase().includes(query);
      const inCategory = prod.category.toLowerCase().includes(query);
      const inSize = prod.sizes.some((s) => s.toLowerCase().includes(query));
      const inColour = prod.colours.some((c) => c.toLowerCase().includes(query));

      return inName || inBarcode || inCategory || inSize || inColour;
    });
  }, [products, selectedCategory, searchQuery, filterLowStockOnly, storeProfile.lowStockAlertThreshold]);

  // Barcode detection / scan handler
  const handleBarcodeScanned = (scannedCode: string) => {
    const clean = scannedCode.trim().toLowerCase();
    const matched = products.find(
      (p) => p.barcode.toLowerCase() === clean || p.id.toLowerCase() === clean
    );

    if (matched) {
      const variant = getProductVariant(matched);
      addToCart(matched, variant.size, variant.colour, 1);
      setScanMessage(`Added "${matched.name}" (${variant.size}) to basket!`);
      setTimeout(() => setScanMessage(null), 3500);
    } else {
      setScanMessage(`Barcode "${scannedCode}" not found in catalogue.`);
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  const handleSaleCompleted = (sale: Sale) => {
    setActiveReceipt(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      
      {/* Scan notification toast */}
      {scanMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{scanMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setScanMessage(null)}
            className="text-amber-400 hover:text-white text-xs ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Left Catalog + Right Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Product Catalog & Rapid Search (7 or 8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Low Stock Alert Dashboard Widget */}
          <LowStockWidget
            onSelectProductForBasket={(prod) => {
              const variant = getProductVariant(prod);
              addToCart(prod, variant.size, variant.colour, 1);
              setScanMessage(`Added "${prod.name}" (${variant.size}) to basket!`);
              setTimeout(() => setScanMessage(null), 3000);
            }}
            onFilterCatalogByLowStock={(active) => setFilterLowStockOnly(active)}
            isCatalogFilteredByLowStock={filterLowStockOnly}
          />

          {/* Search Bar & Barcode Scanner Trigger */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fashion catalog by garment name, SKU / barcode, or size..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>Scan Barcode / SKU</span>
            </button>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No fashion items match your filter.</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by SKU, or select 'All' categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredProducts.map((prod) => {
                const variant = getProductVariant(prod);
                const isOutOfStock = prod.stockQuantity === 0;
                const isLowStock = prod.stockQuantity > 0 && prod.stockQuantity <= prod.lowStockThreshold;

                return (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div>
                      {/* Top metadata unboxed */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span className="font-mono text-amber-500/90 font-medium">{prod.barcode}</span>
                        <div className="flex items-center gap-1">
                          {isOutOfStock ? (
                            <span className="text-rose-400 font-semibold">Out of Stock</span>
                          ) : isLowStock ? (
                            <span className="text-amber-400 font-semibold">Only {prod.stockQuantity} left</span>
                          ) : (
                            <span className="text-emerald-400">{prod.stockQuantity} in stock</span>
                          )}
                        </div>
                      </div>

                      <h4 className="font-semibold text-sm text-white leading-snug line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {prod.category}
                      </p>

                      {/* Selling Price */}
                      <div className="mt-2 text-base font-bold font-mono text-amber-400">
                        {storeProfile.currencySymbol} {prod.sellingPrice.toFixed(2)}
                      </div>

                      {/* Sizes Variant Selector */}
                      {prod.sizes.length > 0 && (
                        <div className="mt-3">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Size:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prod.sizes.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setProductSize(prod.id, size)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                                  variant.size === size
                                    ? 'bg-amber-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Colours Variant Selector */}
                      {prod.colours.length > 0 && (
                        <div className="mt-2.5">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Colour:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prod.colours.map((colour) => (
                              <button
                                key={colour}
                                type="button"
                                onClick={() => setProductColour(prod.id, colour)}
                                className={`px-2 py-0.5 rounded text-[10px] truncate max-w-[120px] transition-colors ${
                                  variant.colour === colour
                                    ? 'bg-amber-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {colour}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add to Basket Action */}
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(prod, variant.size, variant.colour, 1)}
                      className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Basket</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Column: Active Sales Basket (5 or 4 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl text-slate-100 flex flex-col h-[calc(100vh-6rem)] max-h-[780px]">
            
            {/* Basket Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Current Basket</h3>
                <span className="text-xs font-mono text-slate-400 font-medium">
                  ({cartItemCount} item{cartItemCount === 1 ? '' : 's'})
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Cashier Badge */}
            <div className="py-2 px-3 my-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span>Cashier: <strong className="text-slate-200">{activeUser?.name || 'Cashier'}</strong></span>
              <span className="font-mono text-amber-400">{storeProfile.city} Store</span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <ShoppingBag className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-medium text-slate-400">Basket is currently empty</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select clothing items on the left or scan a barcode to begin checkout.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.size} · {item.colour}
                      </p>
                      <p className="text-[11px] font-mono text-amber-400 mt-0.5">
                        {storeProfile.currencySymbol} {item.sellingPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 transition-colors ml-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Summary & Checkout CTA */}
            <div className="pt-3 border-t border-slate-800 space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">
                    {storeProfile.currencySymbol} {cartSubtotal.toFixed(2)}
                  </span>
                </div>
                {storeProfile.enableTax && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax ({storeProfile.taxRate}%):</span>
                    <span className="font-mono text-white">
                      {storeProfile.currencySymbol} {((cartSubtotal * storeProfile.taxRate) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-slate-800/60">
                  <span>Total Due:</span>
                  <span className="font-mono text-amber-400 text-base">
                    {storeProfile.currencySymbol} {cartSubtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Charge / Pay</span>
                <span className="font-mono">
                  ({storeProfile.currencySymbol}{cartSubtotal.toFixed(2)})
                </span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleCompleted={handleSaleCompleted}
      />

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        sale={activeReceipt}
        storeProfile={storeProfile}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={handleBarcodeScanned}
      />

    </div>
  );
};
