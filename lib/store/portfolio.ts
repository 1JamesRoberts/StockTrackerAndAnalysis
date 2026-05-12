import { create } from 'zustand';
import { PortfolioItem, TransactionRecord } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

interface PortfolioState {
  userId: string | null;
  items: PortfolioItem[];
  transactions: TransactionRecord[];
  
  setUserId: (userId: string | null) => void;
  initPortfolio: () => Promise<void>;
  
  addStock: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updateStock: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  sellStock: (id: string, sharesToSell: number, sellPrice: number, sellDate: string) => Promise<void>;
  removeStock: (id: string) => Promise<void>;
  isInPortfolio: (symbol: string) => boolean;
  
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearPortfolio: () => void;
  clearTransactions: () => void;
}

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  userId: null,
  items: [],
  transactions: [],
  
  setUserId: (userId: string | null) => {
    set({ userId });
    if (userId) {
      get().initPortfolio();
    } else {
      set({ items: [], transactions: [] });
    }
  },

  initPortfolio: async () => {
    const { userId } = get();
    if (!userId) return;
    try {
      const [itemsRes, txnsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/portfolio/${userId}`),
        fetch(`${API_BASE_URL}/transactions/${userId}`)
      ]);
      const items = await itemsRes.json();
      const transactions = await txnsRes.json();
      set({ items, transactions });
    } catch (e) {
      console.error('Failed to init portfolio', e);
    }
  },

  addStock: async (item) => {
    const { items, transactions, userId } = get();
    if (!userId) return;

    const itemId = Math.random().toString(36).substring(2, 9);
    const newItem: PortfolioItem = { ...item, id: itemId };

    const newTransaction: TransactionRecord = {
      id: Math.random().toString(36).substring(2, 9),
      portfolioItemId: itemId,
      symbol: item.symbol,
      name: item.name,
      type: 'BUY',
      shares: item.shares,
      price: item.buyPrice,
      date: item.buyDate,
    };

    set({
      items: [...items, newItem],
      transactions: [...transactions, newTransaction],
    });

    try {
      await fetch(`${API_BASE_URL}/portfolio/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      await fetch(`${API_BASE_URL}/transactions/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
    } catch (e) {
      console.error('Failed to save to backend', e);
    }
  },

  updateStock: async (id, updates) => {
    const { items, userId } = get();
    if (!userId) return;
    
    set({
      items: items.map(item => item.id === id ? { ...item, ...updates } : item),
    });

    try {
      await fetch(`${API_BASE_URL}/portfolio/${userId}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Failed to update stock', e);
    }
  },

  sellStock: async (id, sharesToSell, sellPrice, sellDate) => {
    const { items, transactions, userId } = get();
    if (!userId) return;
    
    const item = items.find(i => i.id === id);
    if (!item || sharesToSell <= 0) return;

    const actualSharesToSell = Math.min(sharesToSell, item.shares);
    const realizedGain = (sellPrice - item.buyPrice) * actualSharesToSell;

    const newTransaction: TransactionRecord = {
      id: Math.random().toString(36).substring(2, 9),
      portfolioItemId: id,
      symbol: item.symbol,
      name: item.name,
      type: 'SELL',
      shares: actualSharesToSell,
      price: sellPrice,
      date: sellDate,
      realizedGain,
    };

    const remainingShares = item.shares - actualSharesToSell;

    set({
      items: remainingShares > 0 
        ? items.map(i => i.id === id ? { ...i, shares: remainingShares } : i)
        : items.filter(i => i.id !== id),
      transactions: [...transactions, newTransaction],
    });

    try {
      await fetch(`${API_BASE_URL}/transactions/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });

      if (remainingShares > 0) {
        await fetch(`${API_BASE_URL}/portfolio/${userId}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shares: remainingShares })
        });
      } else {
        await fetch(`${API_BASE_URL}/portfolio/${userId}/${id}`, {
          method: 'DELETE'
        });
      }
    } catch (e) {
      console.error('Failed to sell stock on backend', e);
    }
  },

  removeStock: async (id) => {
    const { items, userId } = get();
    if (!userId) return;

    set({
      items: items.filter(item => item.id !== id),
    });

    try {
      await fetch(`${API_BASE_URL}/portfolio/${userId}/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete stock', e);
    }
  },

  isInPortfolio: (symbol) => {
    const { items } = get();
    return items.some(item => item.symbol === symbol);
  },

  updateTransaction: async (id, updates) => {
    const { transactions, userId } = get();
    if (!userId) return;

    set({
      transactions: transactions.map(t => t.id === id ? { ...t, ...updates } : t),
    });

    try {
      await fetch(`${API_BASE_URL}/transactions/${userId}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Failed to update transaction', e);
    }
  },

  deleteTransaction: async (id) => {
    const { transactions, userId } = get();
    if (!userId) return;

    set({
      transactions: transactions.filter(t => t.id !== id),
    });

    try {
      await fetch(`${API_BASE_URL}/transactions/${userId}/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete transaction', e);
    }
  },

  clearPortfolio: () => {
    set({ items: [] });
  },

  clearTransactions: () => {
    set({ transactions: [] });
  }
}));
