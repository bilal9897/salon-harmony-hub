import { useState, useCallback } from 'react';

export interface Transaction {
  id: string;
  clientName: string;
  serviceType: string;
  staffMember: string;
  amount: number;
  paymentMethod: 'cash' | 'online';
  date: string;
  time: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface DailyCash {
  date: string;
  actualCash: number;
}

const STORAGE_KEYS = {
  transactions: 'salon_transactions',
  expenses: 'salon_expenses',
  dailyCash: 'salon_daily_cash',
  staffMembers: 'salon_staff_members',
  serviceTypes: 'salon_service_types',
  whatsappNumber: 'salon_whatsapp_number',
  gmailAddress: 'salon_gmail_address',
  salonName: 'salon_name',
  paymentPresets: 'salon_payment_presets',
  expensePresets: 'salon_expense_presets',
  servicePrices: 'salon_service_prices',
  menuItems: 'cafe_menu_items',
  tables: 'cafe_tables',
  openOrders: 'cafe_open_orders',
};

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface OpenOrder {
  id: string;
  tableName: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  lines: OrderLine[];
  staffMember?: string;
  createdAt: string;
}

const DEFAULT_MENU: MenuItem[] = [
  { id: 'm1', name: 'Masala Chai', category: 'Beverages', price: 20 },
  { id: 'm2', name: 'Filter Coffee', category: 'Beverages', price: 40 },
  { id: 'm3', name: 'Cold Coffee', category: 'Beverages', price: 80 },
  { id: 'm4', name: 'Veg Sandwich', category: 'Snacks', price: 60 },
  { id: 'm5', name: 'Samosa', category: 'Snacks', price: 25 },
  { id: 'm6', name: 'Maggi', category: 'Snacks', price: 50 },
  { id: 'm7', name: 'Paneer Roll', category: 'Mains', price: 120 },
  { id: 'm8', name: 'Veg Burger', category: 'Mains', price: 90 },
  { id: 'm9', name: 'Chocolate Cake', category: 'Desserts', price: 70 },
];

const DEFAULT_TABLES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

const DEFAULT_PAYMENT_PRESETS = [100, 200, 500, 1000, 1500, 2000];
const DEFAULT_EXPENSE_PRESETS = [30, 40, 100, 150, 200, 500];

const DEFAULT_STAFF = ['Azam', 'Shahnawaz', 'Aalam'];
const DEFAULT_SERVICES = [
  'Haircut', 'Hair Color', 'Blowout', 'Styling', 'Manicure',
  'Pedicure', 'Facial', 'Waxing', 'Massage', 'Bridal Package', 'Other'
];

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    load<Transaction>(STORAGE_KEYS.transactions, [])
  );

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => {
      const next = [{ ...t, id: crypto.randomUUID() }, ...prev];
      save(STORAGE_KEYS.transactions, next);
      return next;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      save(STORAGE_KEYS.transactions, next);
      return next;
    });
  }, []);

  return { transactions, addTransaction, deleteTransaction };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    load<Expense>(STORAGE_KEYS.expenses, [])
  );

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
      const next = [{ ...e, id: crypto.randomUUID() }, ...prev];
      save(STORAGE_KEYS.expenses, next);
      return next;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      save(STORAGE_KEYS.expenses, next);
      return next;
    });
  }, []);

  return { expenses, addExpense, deleteExpense };
}

export function useDailyCash() {
  const [entries, setEntries] = useState<DailyCash[]>(() =>
    load<DailyCash>(STORAGE_KEYS.dailyCash, [])
  );

  const setDailyCash = useCallback((entry: DailyCash) => {
    setEntries(prev => {
      const next = [entry, ...prev.filter(e => e.date !== entry.date)];
      save(STORAGE_KEYS.dailyCash, next);
      return next;
    });
  }, []);

  return { dailyCashEntries: entries, setDailyCash };
}

// Dynamic staff & services
export function useStaffMembers() {
  const [staff, setStaff] = useState<string[]>(() =>
    load<string>(STORAGE_KEYS.staffMembers, DEFAULT_STAFF)
  );

  const addStaff = useCallback((name: string) => {
    setStaff(prev => {
      if (prev.includes(name)) return prev;
      const next = [...prev, name];
      save(STORAGE_KEYS.staffMembers, next);
      return next;
    });
  }, []);

  const removeStaff = useCallback((name: string) => {
    setStaff(prev => {
      const next = prev.filter(s => s !== name);
      save(STORAGE_KEYS.staffMembers, next);
      return next;
    });
  }, []);

  const updateStaff = useCallback((oldName: string, newName: string) => {
    setStaff(prev => {
      const next = prev.map(s => s === oldName ? newName : s);
      save(STORAGE_KEYS.staffMembers, next);
      return next;
    });
  }, []);

  return { staff, addStaff, removeStaff, updateStaff };
}

export function useServiceTypes() {
  const [services, setServices] = useState<string[]>(() =>
    load<string>(STORAGE_KEYS.serviceTypes, DEFAULT_SERVICES)
  );

  const addService = useCallback((name: string) => {
    setServices(prev => {
      if (prev.includes(name)) return prev;
      const next = [...prev, name];
      save(STORAGE_KEYS.serviceTypes, next);
      return next;
    });
  }, []);

  const removeService = useCallback((name: string) => {
    setServices(prev => {
      const next = prev.filter(s => s !== name);
      save(STORAGE_KEYS.serviceTypes, next);
      return next;
    });
  }, []);

  const updateService = useCallback((oldName: string, newName: string) => {
    setServices(prev => {
      const next = prev.map(s => s === oldName ? newName : s);
      save(STORAGE_KEYS.serviceTypes, next);
      return next;
    });
  }, []);

  return { services, addService, removeService, updateService };
}

export function useServicePrices() {
  const [prices, setPricesState] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.servicePrices);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const setPrice = useCallback((service: string, price: number) => {
    setPricesState(prev => {
      const next = { ...prev, [service]: price };
      localStorage.setItem(STORAGE_KEYS.servicePrices, JSON.stringify(next));
      return next;
    });
  }, []);

  const removePrice = useCallback((service: string) => {
    setPricesState(prev => {
      const next = { ...prev };
      delete next[service];
      localStorage.setItem(STORAGE_KEYS.servicePrices, JSON.stringify(next));
      return next;
    });
  }, []);

  return { prices, setPrice, removePrice };
}

// Analytics helpers
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getStaffStats(transactions: Transaction[]) {
  const map: Record<string, number> = {};
  transactions.forEach(t => {
    map[t.staffMember] = (map[t.staffMember] || 0) + t.amount;
  });
  return Object.entries(map)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function getExpensesByCategory(expenses: Expense[]) {
  const map: Record<string, number> = {};
  expenses.forEach(e => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return Object.entries(map).map(([category, amount]) => ({ category, amount }));
}

export const EXPENSE_CATEGORIES = [
  'Chits', 'Food', 'Chai', 'Food & Chai', 'Rent', 'Other'
];

const DEFAULT_WHATSAPP = '918197925360';
const DEFAULT_GMAIL = 'freshsalon@gmail.com';
const DEFAULT_SALON_NAME = 'Fresh Saloon';

export function getSalonName(): string {
  return localStorage.getItem(STORAGE_KEYS.salonName) || DEFAULT_SALON_NAME;
}

export function useReportContacts() {
  const [whatsapp, setWhatsappState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.whatsappNumber) || DEFAULT_WHATSAPP
  );
  const [gmail, setGmailState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.gmailAddress) || DEFAULT_GMAIL
  );
  const [salonName, setSalonNameState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.salonName) || DEFAULT_SALON_NAME
  );

  const setWhatsapp = useCallback((val: string) => {
    setWhatsappState(val);
    localStorage.setItem(STORAGE_KEYS.whatsappNumber, val);
  }, []);

  const setGmail = useCallback((val: string) => {
    setGmailState(val);
    localStorage.setItem(STORAGE_KEYS.gmailAddress, val);
  }, []);

  const setSalonName = useCallback((val: string) => {
    setSalonNameState(val);
    localStorage.setItem(STORAGE_KEYS.salonName, val);
  }, []);

  return { whatsapp, gmail, salonName, setWhatsapp, setGmail, setSalonName };
}

export function useAmountPresets() {
  const [paymentPresets, setPaymentPresetsState] = useState<number[]>(() =>
    load<number>(STORAGE_KEYS.paymentPresets, DEFAULT_PAYMENT_PRESETS)
  );
  const [expensePresets, setExpensePresetsState] = useState<number[]>(() =>
    load<number>(STORAGE_KEYS.expensePresets, DEFAULT_EXPENSE_PRESETS)
  );

  const setPaymentPresets = useCallback((presets: number[]) => {
    const sorted = [...presets].sort((a, b) => a - b);
    setPaymentPresetsState(sorted);
    save(STORAGE_KEYS.paymentPresets, sorted);
  }, []);

  const setExpensePresets = useCallback((presets: number[]) => {
    const sorted = [...presets].sort((a, b) => a - b);
    setExpensePresetsState(sorted);
    save(STORAGE_KEYS.expensePresets, sorted);
  }, []);

  return { paymentPresets, expensePresets, setPaymentPresets, setExpensePresets };
}

// ========== CAFE: Menu ==========
export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>(() =>
    load<MenuItem>(STORAGE_KEYS.menuItems, DEFAULT_MENU)
  );

  const addItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    setItems(prev => {
      const next = [...prev, { ...item, id: crypto.randomUUID() }];
      save(STORAGE_KEYS.menuItems, next);
      return next;
    });
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<MenuItem>) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, ...patch } : i);
      save(STORAGE_KEYS.menuItems, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      save(STORAGE_KEYS.menuItems, next);
      return next;
    });
  }, []);

  return { items, addItem, updateItem, removeItem };
}

// ========== CAFE: Tables ==========
export function useTables() {
  const [tables, setTablesState] = useState<string[]>(() =>
    load<string>(STORAGE_KEYS.tables, DEFAULT_TABLES)
  );

  const addTable = useCallback((name: string) => {
    setTablesState(prev => {
      if (prev.includes(name)) return prev;
      const next = [...prev, name];
      save(STORAGE_KEYS.tables, next);
      return next;
    });
  }, []);

  const removeTable = useCallback((name: string) => {
    setTablesState(prev => {
      const next = prev.filter(t => t !== name);
      save(STORAGE_KEYS.tables, next);
      return next;
    });
  }, []);

  return { tables, addTable, removeTable };
}

// ========== CAFE: Open Orders ==========
export function useOpenOrders() {
  const [orders, setOrders] = useState<OpenOrder[]>(() =>
    load<OpenOrder>(STORAGE_KEYS.openOrders, [])
  );

  const upsertOrder = useCallback((order: OpenOrder) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === order.id);
      const next = exists
        ? prev.map(o => o.id === order.id ? order : o)
        : [order, ...prev];
      save(STORAGE_KEYS.openOrders, next);
      return next;
    });
  }, []);

  const closeOrder = useCallback((id: string) => {
    setOrders(prev => {
      const next = prev.filter(o => o.id !== id);
      save(STORAGE_KEYS.openOrders, next);
      return next;
    });
  }, []);

  return { orders, upsertOrder, closeOrder };
}
