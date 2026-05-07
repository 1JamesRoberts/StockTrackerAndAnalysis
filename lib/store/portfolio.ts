import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PortfolioItem, TransactionRecord } from '../types';

interface Storage {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

const createWebStorage = (): Storage => ({
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
});

interface PortfolioState {
  items: PortfolioItem[];
  transactions: TransactionRecord[];
  addStock: (item: Omit<PortfolioItem, 'id'>) => void;
  updateStock: (id: string, updates: Partial<PortfolioItem>) => void;
  sellStock: (id: string, sharesToSell: number, sellPrice: number, sellDate: string) => void;
  removeStock: (id: string) => void;
  isInPortfolio: (symbol: string) => boolean;
  clearPortfolio: () => void;
  clearTransactions: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      items: [],
      transactions: [],
      
      addStock: (item) => {
        const { items, transactions } = get();
        
        const itemId = Math.random().toString(36).substring(2, 9);
        const newItem: PortfolioItem = {
          ...item,
          id: itemId,
        };

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
      },

      updateStock: (id, updates) => {
        const { items } = get();
        set({
          items: items.map(item => item.id === id ? { ...item, ...updates } : item),
        });
      },

      sellStock: (id, sharesToSell, sellPrice, sellDate) => {
        const { items, transactions } = get();
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
      },
      
      removeStock: (id) => {
        const { items } = get();
        set({
          items: items.filter(item => item.id !== id),
        });
      },
      
      isInPortfolio: (symbol) => {
        const { items } = get();
        return items.some(item => item.symbol === symbol);
      },

      clearPortfolio: () => {
        set({ items: [] });
      },

      clearTransactions: () => {
        set({ transactions: [] });
      }
    }),
    {
      name: 'portfolio-storage',
      storage: createJSONStorage(() => createWebStorage()),
    }
  )
);
