import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  QrCode,
  ArrowUpDown,
  Lock,
  Printer,
  X,
  Check,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product, ProductCategory } from '../../types/pos';

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Traditional & Chitenge',
  'Menswear',
  'Womenswear',
  'Streetwear',
  'Footwear',
  'Accessories',
];

interface ProductManagementProps {
  onOpenPinModal: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ onOpenPinModal }) => {
  const {
    products,
    storeProfile,
    currentUserRole,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockDiff, setStockDiff] = useState<number>(0);
  const [barcodePreviewProduct, setBarcodePreviewProduct] = useState<Product | null>(null);

  const isAdmin = currentUserRole === 'admin';

  // Filter products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'All' || prod.category === selectedCategory;
      if (!matchCat) return false;
      if (filterLowStockOnly && prod.stockQuantity > prod.lowStockThreshold) return false;
      if (!query) return true;

      return (
        prod.name.toLowerCase().includes(query) ||
        prod.barcode.toLowerCase().includes(query) ||
        prod.category.toLowerCase().includes(query) ||
        prod.sizes.some((s) => s.toLowerCase().includes(query)) ||
        prod.colours.some((c) => c.toLowerCase().includes(query))
      );
    });
  }, [products, selectedCategory, filterLowStockOnly, searchQuery]);

  // Inventory valuation summary
  const summary = useMemo(() => {
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      totalStockUnits += p.stockQuantity;
      totalCostValuation += p.stockQuantity * p.costPrice;
      totalRetailValuation += p.stockQuantity * p.sellingPrice;
      if (p.stockQuantity <= p.lowStockThreshold) {
        lowStockCount++;
      }
    });

    return {
      totalStockUnits,
      totalCostValuation,
      totalRetailValuation,
      lowStockCount,
      totalSkus: products.length,
    };
  }, [products]);

  const handleAdjustStockConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;
    adjustStock(stockAdjustProduct.id, stockDiff);
    setStockAdjustProduct(null);
    setStockDiff(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      
      {/* Top Banner & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Garment Inventory & Stock Control</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage fashion SKUs, size/colour variations, wholesale cost, and retail pricing in {storeProfile.city}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenPinModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin PIN to Add / Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-medium">Total SKUs in Catalog</p>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {summary.totalSkus}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-medium">Total Garment Units</p>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {summary.totalStockUnits} pcs
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-medium">Low Stock Alerts</p>
          <p className={`text-xl font-bold font-mono mt-1 ${
            summary.lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {summary.lowStockCount} items
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-medium">Retail Valuation</p>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">
            {storeProfile.currencySymbol} {summary.totalRetailValuation.toLocaleString()}
          </p>
          {isAdmin && (
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Wholesale Cost: {storeProfile.currencySymbol} {summary.totalCostValuation.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, barcode/SKU, or variant..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
              filterLowStockOnly
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock ({summary.lowStockCount})</span>
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-amber-500 transition-colors shrink-0"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU / Barcode</th>
                <th className="py-3 px-4 font-semibold">Garment Details</th>
                <th className="py-3 px-4 font-semibold">Sizes & Colours</th>
                {isAdmin && <th className="py-3 px-4 font-semibold">Cost</th>}
                <th className="py-3 px-4 font-semibold">Selling Price</th>
                <th className="py-3 px-4 font-semibold">Stock Level</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-slate-500">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stockQuantity === 0;
                  const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= prod.lowStockThreshold;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-amber-400 font-medium">
                        {prod.barcode}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{prod.name}</p>
                        <p className="text-[11px] text-slate-400">{prod.category}</p>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[11px] text-slate-300">
                          <span className="font-medium text-slate-400">Sizes:</span> {prod.sizes.join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          <span className="font-medium text-slate-400">Colours:</span> {prod.colours.join(', ')}
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {storeProfile.currencySymbol} {prod.costPrice.toFixed(2)}
                        </td>
                      )}

                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {storeProfile.currencySymbol} {prod.sellingPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-xs ${
                            isOutOfStock ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {prod.stockQuantity} pcs
                          </span>
                          {isLow && (
                            <span className="text-[10px] text-amber-400 font-medium">
                              (Low)
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="text-[10px] text-rose-400 font-medium">
                              (Out)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Barcode Tag Preview Button */}
                          <button
                            type="button"
                            onClick={() => setBarcodePreviewProduct(prod)}
                            title="Preview Barcode Tag"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Stock Adjust Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setStockAdjustProduct(prod);
                              setStockDiff(0);
                            }}
                            title="Adjust Stock Quantity"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Edit Product (Admin only) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setEditingProduct(prod)}
                              title="Edit Garment"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Product (Admin only) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete "${prod.name}" from catalog?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              title="Delete Garment"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Adjust Stock Level</h3>
              <button
                type="button"
                onClick={() => setStockAdjustProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-xs">
              <p className="font-semibold text-white">{stockAdjustProduct.name}</p>
              <p className="text-slate-400 font-mono mt-0.5">
                Current Stock: <strong className="text-amber-400">{stockAdjustProduct.stockQuantity}</strong> pcs
              </p>
            </div>

            <form onSubmit={handleAdjustStockConfirm} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Change Quantity (+ for intake, - for damages/shrinkage)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStockDiff((prev) => prev - 1)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={stockDiff}
                    onChange={(e) => setStockDiff(parseInt(e.target.value) || 0)}
                    className="flex-1 text-center py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-sm font-bold text-white focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setStockDiff((prev) => prev + 1)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold"
                  >
                    +1
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">New Resulting Stock:</span>
                <span className="font-bold font-mono text-amber-400">
                  {Math.max(0, stockAdjustProduct.stockQuantity + stockDiff)} pcs
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Save Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Tag Preview Modal */}
      {barcodePreviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Garment Price & Barcode Tag</h3>
              <button
                type="button"
                onClick={() => setBarcodePreviewProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Tag Design */}
            <div className="my-4 p-4 rounded-xl bg-white text-slate-950 text-center font-mono border-2 border-dashed border-slate-300 shadow-sm">
              <p className="text-[11px] font-bold tracking-wider font-sans uppercase text-slate-900">
                INNOWEAR KASAMA
              </p>
              <h4 className="text-sm font-bold mt-1 font-sans text-slate-950 line-clamp-1">
                {barcodePreviewProduct.name}
              </h4>
              <p className="text-[10px] text-slate-600">
                Sizes: {barcodePreviewProduct.sizes.join(' · ')}
              </p>
              
              {/* Barcode graphic lines */}
              <div className="my-2 py-1 text-slate-900 tracking-widest text-lg font-bold">
                ||||| ||| |||| || |||||| | ||||
              </div>
              
              <p className="text-xs font-bold text-slate-800">
                {barcodePreviewProduct.barcode}
              </p>
              
              <p className="text-base font-black text-slate-950 mt-1 font-sans">
                {storeProfile.currencySymbol} {barcodePreviewProduct.sellingPrice.toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Tag</span>
              </button>
              <button
                type="button"
                onClick={() => setBarcodePreviewProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          currency={storeProfile.currencySymbol}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={(data) => {
            if (editingProduct) {
              updateProduct(editingProduct.id, data);
            } else {
              addProduct(data as any);
            }
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

    </div>
  );
};

interface ProductFormModalProps {
  product: Product | null;
  currency: string;
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  currency,
  onClose,
  onSave,
}) => {
  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'Menswear');
  const [sizesStr, setSizesStr] = useState(product?.sizes.join(', ') || 'S, M, L, XL');
  const [coloursStr, setColoursStr] = useState(product?.colours.join(', ') || 'Black, Navy');
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || '200');
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice?.toString() || '400');
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity?.toString() || '15');
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold?.toString() || '3');
  const [barcode, setBarcode] = useState(product?.barcode || `INNO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [description, setDescription] = useState(product?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sizes = sizesStr.split(',').map((s) => s.trim()).filter(Boolean);
    const colours = coloursStr.split(',').map((c) => c.trim()).filter(Boolean);

    onSave({
      name: name.trim(),
      category,
      sizes: sizes.length > 0 ? sizes : ['Standard'],
      colours: colours.length > 0 ? colours : ['Default'],
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stockQuantity: parseInt(stockQuantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 3,
      barcode: barcode.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-white">
            {isEditing ? 'Edit Garment Product' : 'Add New Fashion Product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Garment Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chitenge Executive Blazer"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
              >
                <option value="Traditional & Chitenge">Traditional & Chitenge</option>
                <option value="Menswear">Menswear</option>
                <option value="Womenswear">Womenswear</option>
                <option value="Streetwear">Streetwear</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Barcode / SKU</label>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. INNO-CHIT-001"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Sizes (comma-separated)
              </label>
              <input
                type="text"
                value={sizesStr}
                onChange={(e) => setSizesStr(e.target.value)}
                placeholder="S, M, L, XL"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Colours (comma-separated)
              </label>
              <input
                type="text"
                value={coloursStr}
                onChange={(e) => setColoursStr(e.target.value)}
                placeholder="Black, Gold, Navy"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Cost Price ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Selling Price ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-amber-400 font-bold focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Stock Qty
              </label>
              <input
                type="number"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Low Stock Alert
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description / Fabric Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Pure cotton, tailored fit, hand-wash only..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Add Product to Inventory'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
