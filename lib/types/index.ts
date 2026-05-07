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

export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  buyPrice: number;
  buyDate: string;
}

export interface TransactionRecord {
  id: string;
  portfolioItemId?: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  date: string;
  realizedGain?: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '1Y' | 'ALL';

export interface ChartDataPoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
}

export interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  url: string;
  image: string;
  datetime: number;
  source: string;
  related: string;
}