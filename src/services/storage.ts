import { AppDatabase, Product, Sale, CustomerOrder, StaffUser, StoreProfile } from '../types/pos';
import { DEFAULT_STORE_PROFILE, INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_ORDERS } from './sampleData';

const STORAGE_KEY = 'innowear_pos_data_v1';

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initializeDefaultDatabase();
    }
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed || !parsed.products || !Array.isArray(parsed.products)) {
      return initializeDefaultDatabase();
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load database from localStorage, initializing defaults:', error);
    return initializeDefaultDatabase();
  }
}

export function saveDatabase(data: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save database to localStorage:', error);
  }
}

export function initializeDefaultDatabase(): AppDatabase {
  const defaultAdmin: StaffUser = {
    id: 'user-admin',
    username: 'admin',
    name: 'Innocent Lombe (Owner)',
    role: 'admin',
    pin: '1234',
    passwordHash: 'admin2026',
    active: true,
    createdAt: new Date().toISOString(),
  };

  const defaultEmployee: StaffUser = {
    id: 'user-emp-1',
    username: 'staff',
    name: 'Chileshe Mwape',
    role: 'employee',
    pin: '0000',
    active: true,
    createdAt: new Date().toISOString(),
  };

  const initialDb: AppDatabase = {
    version: 1,
    storeProfile: DEFAULT_STORE_PROFILE,
    users: [defaultAdmin, defaultEmployee],
    products: INITIAL_PRODUCTS,
    sales: INITIAL_SALES,
    orders: INITIAL_ORDERS,
    isConfigured: false, // will trigger first-run setup wizard if false!
  };

  saveDatabase(initialDb);
  return initialDb;
}

/**
 * Downloads the full database state as a formatted JSON backup file
 */
export function exportDatabaseJSON(database: AppDatabase): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `innowear_pos_backup_${timestamp}.json`;
  const jsonContent = JSON.stringify(database, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and restores a database from JSON string
 */
export function parseAndValidateBackupJSON(jsonStr: string): { success: boolean; data?: AppDatabase; error?: string } {
  try {
    const data = JSON.parse(jsonStr) as AppDatabase;
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid JSON format.' };
    }
    if (!Array.isArray(data.products) || !Array.isArray(data.sales) || !Array.isArray(data.orders)) {
      return { success: false, error: 'Missing core database tables (products, sales, or orders).' };
    }
    if (!data.storeProfile || !data.storeProfile.businessName) {
      return { success: false, error: 'Missing store profile configuration.' };
    }
    return { success: true, data };
  } catch {
    return { success: false, error: 'Corrupt or unreadable JSON file syntax.' };
  }
}

/**
 * Exports Sales transactions to CSV format
 */
export function exportSalesCSV(sales: Sale[], currency: string = 'K'): void {
  const headers = [
    'Sale ID',
    'Date & Time',
    'Cashier',
    'Customer Name',
    'Customer Phone',
    'Items Summary',
    'Units Sold',
    `Subtotal (${currency})`,
    `Discount (${currency})`,
    `Tax Amount (${currency})`,
    `Total Paid (${currency})`,
    `Cost Total (${currency})`,
    `Gross Profit (${currency})`,
    'Payment Method',
    'Notes',
  ];

  const escapeCSV = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = sales.map((sale) => {
    const itemsSummary = sale.items.map((i) => `${i.name} (${i.size}/${i.colour}) x${i.quantity}`).join('; ');
    const totalUnits = sale.items.reduce((sum, i) => sum + i.quantity, 0);

    return [
      escapeCSV(sale.id),
      escapeCSV(new Date(sale.timestamp).toLocaleString()),
      escapeCSV(sale.cashierName),
      escapeCSV(sale.customerName || 'Walk-in Customer'),
      escapeCSV(sale.customerPhone || ''),
      escapeCSV(itemsSummary),
      totalUnits,
      sale.subtotal.toFixed(2),
      sale.discountAmount.toFixed(2),
      sale.taxAmount.toFixed(2),
      sale.totalAmount.toFixed(2),
      sale.costTotal.toFixed(2),
      sale.grossProfit.toFixed(2),
      escapeCSV(sale.paymentMethod),
      escapeCSV(sale.notes || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `innowear_sales_report_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Products & Stock inventory to CSV format
 */
export function exportProductsCSV(products: Product[], currency: string = 'K'): void {
  const headers = [
    'Barcode / SKU',
    'Product Name',
    'Category',
    'Sizes Available',
    'Colours Available',
    `Cost Price (${currency})`,
    `Selling Price (${currency})`,
    'Stock Quantity',
    'Low Stock Alert Level',
    'Stock Status',
    `Inventory Valuation Cost (${currency})`,
    `Inventory Valuation Retail (${currency})`,
    'Description',
  ];

  const escapeCSV = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = products.map((p) => {
    const valuationCost = p.stockQuantity * p.costPrice;
    const valuationRetail = p.stockQuantity * p.sellingPrice;
    const status = p.stockQuantity === 0 ? 'Out of Stock' : p.stockQuantity <= p.lowStockThreshold ? 'Low Stock' : 'In Stock';

    return [
      escapeCSV(p.barcode),
      escapeCSV(p.name),
      escapeCSV(p.category),
      escapeCSV(p.sizes.join('/')),
      escapeCSV(p.colours.join('/')),
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.stockQuantity,
      p.lowStockThreshold,
      escapeCSV(status),
      valuationCost.toFixed(2),
      valuationRetail.toFixed(2),
      escapeCSV(p.description || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `innowear_inventory_stock_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
