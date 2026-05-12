import { create } from 'zustand';
import { PortfolioItem, TransactionRecord } from '../types';

interface PortfolioState {
  userId: string | null;
  apiClient: (<T>(endpoint: string, options?: RequestInit) => Promise<T>) | null;
  items: PortfolioItem[];
  transactions: TransactionRecord[];
  
  setAuth: (userId: string | null, apiClient: <T>(endpoint: string, options?: RequestInit) => Promise<T>) => void;
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
  apiClient: null,
  items: [],
  transactions: [],
  
  setAuth: (userId, apiClient) => {
    set({ userId, apiClient });
    if (userId) {
      get().initPortfolio();
    } else {
      set({ items: [], transactions: [] });
    }
  },

  initPortfolio: async () => {
    const { userId, apiClient } = get();
    if (!userId || !apiClient) return;
    try {
      const [items, transactions] = await Promise.all([
        apiClient<PortfolioItem[]>('/portfolio'),
        apiClient<TransactionRecord[]>('/transactions')
      ]);
      set({ items, transactions });
    } catch (e) {
      console.error('Failed to init portfolio', e);
    }
  },

  addStock: async (item) => {
    const { items, transactions, userId, apiClient } = get();
    if (!userId || !apiClient) return;

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
      await apiClient('/portfolio', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
      await apiClient('/transactions', {
        method: 'POST',
        body: JSON.stringify(newTransaction)
      });
    } catch (e) {
      console.error('Failed to save to backend', e);
    }
  },

  updateStock: async (id, updates) => {
    const { items, userId, apiClient } = get();
    if (!userId || !apiClient) return;
    
    set({
      items: items.map(item => item.id === id ? { ...item, ...updates } : item),
    });

    try {
      await apiClient(`/portfolio/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Failed to update stock', e);
    }
  },

  sellStock: async (id, sharesToSell, sellPrice, sellDate) => {
    const { items, transactions, userId, apiClient } = get();
    if (!userId || !apiClient) return;
    
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
      await apiClient('/transactions', {
        method: 'POST',
        body: JSON.stringify(newTransaction)
      });

      if (remainingShares > 0) {
        await apiClient(`/portfolio/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ shares: remainingShares })
        });
      } else {
        await apiClient(`/portfolio/${id}`, {
          method: 'DELETE'
        });
      }
    } catch (e) {
      console.error('Failed to sell stock on backend', e);
    }
  },

  removeStock: async (id) => {
    const { items, userId, apiClient } = get();
    if (!userId || !apiClient) return;

    set({
      items: items.filter(item => item.id !== id),
    });

    try {
      await apiClient(`/portfolio/${id}`, {
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
    const { transactions, userId, apiClient } = get();
    if (!userId || !apiClient) return;

    set({
      transactions: transactions.map(t => t.id === id ? { ...t, ...updates } : t),
    });

    try {
      await apiClient(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Failed to update transaction', e);
    }
  },

  deleteTransaction: async (id) => {
    const { transactions, userId, apiClient } = get();
    if (!userId || !apiClient) return;

    set({
      transactions: transactions.filter(t => t.id !== id),
    });

    try {
      await apiClient(`/transactions/${id}`, {
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
