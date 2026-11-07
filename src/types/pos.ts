export type UserRole = 'admin' | 'employee';

export interface StaffUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin: string; // 4-6 digit quick PIN
  passwordHash?: string; // For administrator account
  active: boolean;
  createdAt: string;
}

export type ProductCategory = 
  | 'Menswear'
  | 'Womenswear'
  | 'Traditional & Chitenge'
  | 'Streetwear'
  | 'Footwear'
  | 'Accessories';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  sizes: string[]; // e.g. ['S', 'M', 'L', 'XL'] or ['32', '34', '36']
  colours: string[]; // e.g. ['Black', 'Olive', 'Chitenge Gold']
  costPrice: number; // in Zambian Kwacha (K)
  sellingPrice: number; // in Zambian Kwacha (K)
  stockQuantity: number;
  lowStockThreshold: number;
  barcode: string; // SKU or barcode (e.g. 'INNO-CHIT-001')
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique cart entry ID (productId + size + color)
  productId: string;
  name: string;
  category: ProductCategory;
  size: string;
  colour: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  barcode: string;
}

export type PaymentMethod = 
  | 'Cash'
  | 'Airtel Money'
  | 'MTN MoMo'
  | 'Zamtel Kwacha'
  | 'Card / POS'
  | 'Bank Transfer';

export interface SaleItem {
  productId: string;
  name: string;
  category: ProductCategory;
  size: string;
  colour: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  barcode: string;
}

export interface Sale {
  id: string; // Receipt / Order # e.g. INNO-20261107-1042
  timestamp: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number; // percentage
  taxAmount: number;
  totalAmount: number;
  costTotal: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeDue: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export type DeliveryStatus = 
  | 'Pending'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface CustomerOrder {
  id: string; // Order reference #
  saleId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string; // default "Kasama"
  status: DeliveryStatus;
  items: SaleItem[];
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Deposit';
  depositAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
}

export interface StoreProfile {
  businessName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number;
  enableTax: boolean;
  receiptFooter: string;
  adminPin: string;
  employeePin: string;
  lowStockAlertThreshold?: number;
}

export interface AppDatabase {
  version: number;
  storeProfile: StoreProfile;
  users: StaffUser[];
  products: Product[];
  sales: Sale[];
  orders: CustomerOrder[];
  isConfigured: boolean;
}
