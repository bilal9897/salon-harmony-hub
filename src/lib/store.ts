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
};

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

export function useReportContacts() {
  const [whatsapp, setWhatsappState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.whatsappNumber) || DEFAULT_WHATSAPP
  );
  const [gmail, setGmailState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.gmailAddress) || DEFAULT_GMAIL
  );

  const setWhatsapp = useCallback((val: string) => {
    setWhatsappState(val);
    localStorage.setItem(STORAGE_KEYS.whatsappNumber, val);
  }, []);

  const setGmail = useCallback((val: string) => {
    setGmailState(val);
    localStorage.setItem(STORAGE_KEYS.gmailAddress, val);
  }, []);

  return { whatsapp, gmail, setWhatsapp, setGmail };
}
