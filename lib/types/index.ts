export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface StockHistory {
  date: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '1Y';

export interface ChartDataPoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
}