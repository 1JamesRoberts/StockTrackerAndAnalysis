import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WatchlistItem } from '../types';

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

interface WatchlistState {
  items: WatchlistItem[];
  addStock: (symbol: string, name: string) => void;
  removeStock: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  reorderItems: (fromIndex: number, toIndex: number) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [
        { symbol: 'AAPL', name: 'Apple Inc.', addedAt: Date.now() },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', addedAt: Date.now() },
        { symbol: 'MSFT', name: 'Microsoft Corporation', addedAt: Date.now() },
      ],
      
      addStock: (symbol, name) => {
        const { items } = get();
        if (items.some(item => item.symbol === symbol)) return;
        
        set({
          items: [...items, { symbol, name, addedAt: Date.now() }],
        });
      },
      
      removeStock: (symbol) => {
        const { items } = get();
        set({
          items: items.filter(item => item.symbol !== symbol),
        });
      },
      
      isInWatchlist: (symbol) => {
        const { items } = get();
        return items.some(item => item.symbol === symbol);
      },
      
      reorderItems: (fromIndex, toIndex) => {
        const { items } = get();
        const newItems = [...items];
        const [removed] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, removed);
        set({ items: newItems });
      },
    }),
    {
      name: 'watchlist-storage',
      storage: createJSONStorage(() => createWebStorage()),
    }
  )
);