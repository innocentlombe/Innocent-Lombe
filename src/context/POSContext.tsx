import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  AppDatabase,
  CartItem,
  CustomerOrder,
  DeliveryStatus,
  PaymentMethod,
  Product,
  Sale,
  StaffUser,
  StoreProfile,
  UserRole,
} from '../types/pos';
import {
  loadDatabase,
  saveDatabase,
  initializeDefaultDatabase,
} from '../services/storage';

export type ActiveTab = 'pos' | 'products' | 'orders' | 'reports' | 'settings';

interface POSContextType {
  database: AppDatabase;
  storeProfile: StoreProfile;
  products: Product[];
  sales: Sale[];
  orders: CustomerOrder[];
  staffUsers: StaffUser[];
  activeUser: StaffUser | null;
  currentUserRole: UserRole;
  isFirstRun: boolean;
  activeTab: ActiveTab;
  cart: CartItem[];
  cartSubtotal: number;
  cartItemCount: number;
  
  // Navigation
  setActiveTab: (tab: ActiveTab) => void;
  requestNavigate: (tab: ActiveTab) => boolean; // returns true if allowed, false if pin needed

  // Auth & Roles
  loginWithPin: (pin: string) => { success: boolean; user?: StaffUser; error?: string };
  loginWithCredentials: (username: string, pass: string) => { success: boolean; user?: StaffUser; error?: string };
  logout: () => void;
  verifyAdminPin: (pin: string) => boolean;
  setupFirstRun: (params: {
    adminUsername: string;
    adminName: string;
    adminPasswordHash: string;
    adminPin: string;
    employeePin: string;
  }) => void;

  // Cart operations
  addToCart: (product: Product, size: string, colour: string, quantity?: number) => void;
  updateCartQuantity: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  // Checkout & Sales
  completeSale: (params: {
    paymentMethod: PaymentMethod;
    amountTendered: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    notes?: string;
    isDeliveryOrder?: boolean;
  }) => Sale;

  // Product Management
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, diff: number) => void;

  // Customer Orders
  updateOrderStatus: (orderId: string, status: DeliveryStatus) => void;

  // Settings & DB
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  addStaffUser: (user: Omit<StaffUser, 'id' | 'createdAt'>) => void;
  updateStaffUser: (id: string, user: Partial<StaffUser>) => void;
  deleteStaffUser: (id: string) => void;
  restoreFromBackup: (backup: AppDatabase) => void;
  resetToDefaults: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [database, setDatabase] = useState<AppDatabase>(() => loadDatabase());
  const [activeUser, setActiveUser] = useState<StaffUser | null>(() => {
    // Default logged in as admin if configured, or default admin
    const defaultUser = database.users.find((u) => u.active && u.role === 'admin') || database.users[0] || null;
    return defaultUser;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync state to localStorage whenever database changes
  useEffect(() => {
    saveDatabase(database);
  }, [database]);

  const isFirstRun = !database.isConfigured;
  const currentUserRole: UserRole = activeUser?.role || 'employee';

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Auth handlers
  const loginWithPin = (pin: string) => {
    const trimmed = pin.trim();
    // Check if matches store admin PIN
    if (database.storeProfile.adminPin === trimmed) {
      const admin = database.users.find((u) => u.role === 'admin') || {
        id: 'user-admin',
        username: 'admin',
        name: 'Administrator',
        role: 'admin' as UserRole,
        pin: trimmed,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setActiveUser(admin);
      return { success: true, user: admin };
    }

    // Check individual users
    const matched = database.users.find((u) => u.active && u.pin === trimmed);
    if (matched) {
      setActiveUser(matched);
      return { success: true, user: matched };
    }

    // Check store employee PIN
    if (database.storeProfile.employeePin === trimmed) {
      const emp = database.users.find((u) => u.role === 'employee') || {
        id: 'user-emp-default',
        username: 'staff',
        name: 'Floor Cashier',
        role: 'employee' as UserRole,
        pin: trimmed,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setActiveUser(emp);
      return { success: true, user: emp };
    }

    return { success: false, error: 'Incorrect PIN. Please re-enter or ask administrator.' };
  };

  const loginWithCredentials = (username: string, pass: string) => {
    const trimmedUser = username.trim().toLowerCase();
    const matched = database.users.find(
      (u) => u.active && u.username.toLowerCase() === trimmedUser && (u.passwordHash === pass || u.pin === pass)
    );
    if (matched) {
      setActiveUser(matched);
      return { success: true, user: matched };
    }
    return { success: false, error: 'Invalid username or password.' };
  };

  const logout = () => {
    // Switch to employee profile or null
    const employee = database.users.find((u) => u.role === 'employee' && u.active);
    if (employee) {
      setActiveUser(employee);
    } else {
      setActiveUser(null);
    }
    setActiveTab('pos');
  };

  const verifyAdminPin = (pin: string): boolean => {
    const trimmed = pin.trim();
    if (database.storeProfile.adminPin === trimmed) return true;
    const adminUser = database.users.find((u) => u.role === 'admin' && u.pin === trimmed);
    return !!adminUser;
  };

  const setupFirstRun = ({
    adminUsername,
    adminName,
    adminPasswordHash,
    adminPin,
    employeePin,
  }: {
    adminUsername: string;
    adminName: string;
    adminPasswordHash: string;
    adminPin: string;
    employeePin: string;
  }) => {
    const updatedUsers: StaffUser[] = [
      {
        id: 'user-admin',
        username: adminUsername || 'admin',
        name: adminName || 'Innocent Lombe (Owner)',
        role: 'admin',
        pin: adminPin,
        passwordHash: adminPasswordHash,
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user-emp-1',
        username: 'staff',
        name: 'Chileshe Mwape',
        role: 'employee',
        pin: employeePin,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const updatedProfile: StoreProfile = {
      ...database.storeProfile,
      adminPin,
      employeePin,
    };

    const newDb: AppDatabase = {
      ...database,
      storeProfile: updatedProfile,
      users: updatedUsers,
      isConfigured: true,
    };

    setDatabase(newDb);
    setActiveUser(updatedUsers[0]);
  };

  const requestNavigate = (tab: ActiveTab): boolean => {
    // Employee can only access 'pos', 'orders', 'products'
    if (currentUserRole === 'employee' && (tab === 'reports' || tab === 'settings')) {
      return false; // requires admin PIN prompt
    }
    setActiveTab(tab);
    return true;
  };

  // Cart Management
  const addToCart = (product: Product, size: string, colour: string, quantity = 1) => {
    const cartItemId = `${product.id}-${size}-${colour}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          category: product.category,
          size,
          colour,
          sellingPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity,
          barcode: product.barcode,
        },
      ];
    });
  };

  const updateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Checkout and Sales Complete
  const completeSale = ({
    paymentMethod,
    amountTendered,
    discountType,
    discountValue,
    customerName,
    customerPhone,
    deliveryAddress,
    notes,
    isDeliveryOrder = false,
  }: {
    paymentMethod: PaymentMethod;
    amountTendered: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    notes?: string;
    isDeliveryOrder?: boolean;
  }): Sale => {
    if (cart.length === 0) {
      throw new Error('Basket is empty.');
    }

    const subtotal = cartSubtotal;
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    } else {
      discountAmount = Math.min(subtotal, Math.max(0, discountValue));
    }

    const discountedSubtotal = subtotal - discountAmount;
    const taxRate = database.storeProfile.enableTax ? database.storeProfile.taxRate : 0;
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const totalAmount = discountedSubtotal + taxAmount;
    const changeDue = Math.max(0, amountTendered - totalAmount);

    const costTotal = cart.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    const grossProfit = totalAmount - costTotal;

    const saleId = `INNO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleItems = cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      size: item.size,
      colour: item.colour,
      sellingPrice: item.sellingPrice,
      costPrice: item.costPrice,
      quantity: item.quantity,
      subtotal: item.sellingPrice * item.quantity,
      barcode: item.barcode,
    }));

    const newSale: Sale = {
      id: saleId,
      timestamp: new Date().toISOString(),
      cashierId: activeUser?.id || 'cashier',
      cashierName: activeUser?.name || 'Cashier',
      items: saleItems,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      costTotal,
      grossProfit,
      paymentMethod,
      amountTendered,
      changeDue,
      customerName,
      customerPhone,
      notes,
    };

    // Deduct stock for each sold product
    const updatedProducts = database.products.map((prod) => {
      const soldItem = cart.find((c) => c.productId === prod.id);
      if (soldItem) {
        const remaining = Math.max(0, prod.stockQuantity - soldItem.quantity);
        return {
          ...prod,
          stockQuantity: remaining,
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });

    let updatedOrders = database.orders;
    if (isDeliveryOrder && customerName) {
      const newOrder: CustomerOrder = {
        id: `ORD-KAS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        saleId,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || '',
        deliveryAddress: deliveryAddress?.trim() || 'Store Pickup',
        city: database.storeProfile.city || 'Kasama',
        status: 'Pending',
        items: saleItems,
        totalAmount,
        paymentStatus: 'Paid',
        notes: notes || 'Delivery order created via POS checkout',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedOrders = [newOrder, ...updatedOrders];
    }

    setDatabase({
      ...database,
      products: updatedProducts,
      sales: [newSale, ...database.sales],
      orders: updatedOrders,
    });

    clearCart();
    return newSale;
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDatabase((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
    }));
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setDatabase((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p
      ),
    }));
  };

  const deleteProduct = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const adjustStock = (id: string, diff: number) => {
    setDatabase((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id === id) {
          const newQty = Math.max(0, p.stockQuantity + diff);
          return { ...p, stockQuantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      }),
    }));
  };

  // Customer Order Tracking
  const updateOrderStatus = (orderId: string, status: DeliveryStatus) => {
    setDatabase((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              updatedAt: new Date().toISOString(),
              fulfilledAt: status === 'Delivered' ? new Date().toISOString() : o.fulfilledAt,
            }
          : o
      ),
    }));
  };

  // Settings & DB Management
  const updateStoreProfile = (profile: Partial<StoreProfile>) => {
    setDatabase((prev) => ({
      ...prev,
      storeProfile: { ...prev.storeProfile, ...profile },
    }));
  };

  const addStaffUser = (userData: Omit<StaffUser, 'id' | 'createdAt'>) => {
    const newUser: StaffUser = {
      ...userData,
      id: `user-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setDatabase((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
  };

  const updateStaffUser = (id: string, userData: Partial<StaffUser>) => {
    setDatabase((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...userData } : u)),
    }));
  };

  const deleteStaffUser = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  };

  const restoreFromBackup = (backup: AppDatabase) => {
    setDatabase(backup);
    setActiveUser(backup.users.find((u) => u.role === 'admin') || backup.users[0] || null);
    clearCart();
  };

  const resetToDefaults = () => {
    const freshDb = initializeDefaultDatabase();
    setDatabase(freshDb);
    setActiveUser(freshDb.users[0]);
    clearCart();
  };

  return (
    <POSContext.Provider
      value={{
        database,
        storeProfile: database.storeProfile,
        products: database.products,
        sales: database.sales,
        orders: database.orders,
        staffUsers: database.users,
        activeUser,
        currentUserRole,
        isFirstRun,
        activeTab,
        cart,
        cartSubtotal,
        cartItemCount,
        setActiveTab,
        requestNavigate,
        loginWithPin,
        loginWithCredentials,
        logout,
        verifyAdminPin,
        setupFirstRun,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        completeSale,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        updateOrderStatus,
        updateStoreProfile,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
        restoreFromBackup,
        resetToDefaults,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
