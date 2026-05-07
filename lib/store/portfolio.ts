import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PortfolioItem } from '../types';

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
  addStock: (item: Omit<PortfolioItem, 'id'>) => void;
  removeStock: (id: string) => void;
  isInPortfolio: (symbol: string) => boolean;
  clearPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addStock: (item) => {
        const { items } = get();
        
        const newItem: PortfolioItem = {
          ...item,
          id: Math.random().toString(36).substring(2, 9),
        };

        set({
          items: [...items, newItem],
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
      }
    }),
    {
      name: 'portfolio-storage',
      storage: createJSONStorage(() => createWebStorage()),
    }
  )
);
