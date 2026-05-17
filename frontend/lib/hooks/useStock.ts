import { useQuery, useQueries } from '@tanstack/react-query';
import { searchStocks, getQuote, getStockHistory, getChartData, getNews, getCompanyProfile } from '../api/stocks';
import { TimeRange } from '../types';

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchStocks(query),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => getQuote(symbol),
    enabled: !!symbol,
    refetchInterval: 60000,
  });
}

export function useMultipleStockQuotes(symbols: string[]) {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ['quote', symbol],
      queryFn: () => getQuote(symbol),
      enabled: !!symbol,
      refetchInterval: 60000,
    })),
  });
}

export function useStockHistory(symbol: string, range: TimeRange = '1M') {
  return useQuery({
    queryKey: ['history', symbol, range],
    queryFn: () => getStockHistory(symbol, range),
    enabled: !!symbol,
    staleTime: 1000 * 60 * 15,
  });
}

export function useMultipleStockHistory(symbols: string[], range: TimeRange = '1M') {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ['history', symbol, range],
      queryFn: () => getStockHistory(symbol, range),
      enabled: !!symbol,
      staleTime: 1000 * 60 * 15,
    })),
  });
}

export function useChartData(symbol: string, range: TimeRange = '1M') {
  return useQuery({
    queryKey: ['chart', symbol, range],
    queryFn: () => getChartData(symbol, range),
    enabled: !!symbol,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNews(symbol?: string) {
  return useQuery({
    queryKey: ['news', symbol || 'general'],
    queryFn: () => getNews(symbol),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useMultipleCompanyProfiles(symbols: string[]) {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ['profile', symbol],
      queryFn: () => getCompanyProfile(symbol),
      enabled: !!symbol,
      staleTime: 1000 * 60 * 60 * 24, // 24 hours (profile data is stable)
    })),
  });
}