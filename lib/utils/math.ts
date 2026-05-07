import { PortfolioItem, StockHistory, ChartDataPoint } from '../types';

export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

export function calculateMean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

export function calculateVariance(data: number[], mean?: number): number {
  if (data.length <= 1) return 0;
  const m = mean !== undefined ? mean : calculateMean(data);
  const sumSq = data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0);
  return sumSq / (data.length - 1); // Sample variance
}

export function calculateStandardDeviation(data: number[], mean?: number): number {
  return Math.sqrt(calculateVariance(data, mean));
}

export function calculateCovariance(data1: number[], data2: number[]): number {
  if (data1.length !== data2.length || data1.length <= 1) return 0;
  const mean1 = calculateMean(data1);
  const mean2 = calculateMean(data2);
  let sum = 0;
  for (let i = 0; i < data1.length; i++) {
    sum += (data1[i] - mean1) * (data2[i] - mean2);
  }
  return sum / (data1.length - 1);
}

export function calculateCorrelation(data1: number[], data2: number[]): number {
  if (data1.length !== data2.length || data1.length <= 1) return 0;
  const cov = calculateCovariance(data1, data2);
  const std1 = calculateStandardDeviation(data1);
  const std2 = calculateStandardDeviation(data2);
  if (std1 === 0 || std2 === 0) return 0;
  return cov / (std1 * std2);
}

export function buildCorrelationMatrix(symbols: string[], pricesMap: Record<string, number[]>): number[][] {
  const matrix: number[][] = [];
  const returnsMap: Record<string, number[]> = {};

  symbols.forEach(symbol => {
    const prices = pricesMap[symbol] || [];
    returnsMap[symbol] = calculateReturns(prices);
  });

  for (let i = 0; i < symbols.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < symbols.length; j++) {
      if (i === j) {
        row.push(1);
      } else {
        const r1 = returnsMap[symbols[i]];
        const r2 = returnsMap[symbols[j]];
        // To calculate correlation, arrays must be of equal length. We align them from the end (most recent).
        const minLen = Math.min(r1.length, r2.length);
        const a1 = r1.slice(r1.length - minLen);
        const a2 = r2.slice(r2.length - minLen);
        row.push(calculateCorrelation(a1, a2));
      }
    }
    matrix.push(row);
  }

  return matrix;
}

export function calculatePortfolioEquityCurve(portfolio: PortfolioItem[], historyMap: Record<string, StockHistory[]>): ChartDataPoint[] {
  // 1. Gather all unique dates from all stock histories to form a unified timeline
  const allDates = new Set<string>();
  Object.values(historyMap).forEach(history => {
    history.forEach(point => allDates.add(point.date.split('T')[0]));
  });

  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length === 0) return [];

  const equityCurve: ChartDataPoint[] = [];

  // For each date, calculate total portfolio value
  sortedDates.forEach(date => {
    let totalValue = 0;
    
    portfolio.forEach(item => {
      // Check if we owned this stock on this date
      const buyDate = item.buyDate;
      if (date >= buyDate) {
        const history = historyMap[item.symbol];
        if (history) {
          // Find the price for this specific date, or the closest previous date
          const pastPrices = history.filter(h => h.date.split('T')[0] <= date);
          if (pastPrices.length > 0) {
            // Because TwelveData might be sorted oldest to newest or newest to oldest. 
            // We assume oldest to newest (ascending) here based on our fetch logic.
            pastPrices.sort((a, b) => a.date.localeCompare(b.date));
            const priceOnDate = pastPrices[pastPrices.length - 1].close;
            totalValue += priceOnDate * item.shares;
          }
        }
      }
    });

    if (totalValue > 0) {
      equityCurve.push({
        date: date,
        price: totalValue,
      });
    }
  });

  return equityCurve;
}

export function calculatePortfolioPnLCurve(portfolio: PortfolioItem[], historyMap: Record<string, StockHistory[]>): ChartDataPoint[] {
  const allDates = new Set<string>();
  Object.values(historyMap).forEach(history => {
    history.forEach(point => allDates.add(point.date.split('T')[0]));
  });

  portfolio.forEach(item => {
    allDates.add(item.buyDate.split('T')[0]);
  });

  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length === 0 || portfolio.length === 0) return [];
  
  const earliestBuyDate = portfolio.reduce((min, item) => item.buyDate.split('T')[0] < min ? item.buyDate.split('T')[0] : min, portfolio[0].buyDate.split('T')[0]);

  const timelineDates = sortedDates.filter(d => d >= earliestBuyDate);
  if (timelineDates.length === 0) return [];

  const pnlCurve: ChartDataPoint[] = [];
  let isFirstPoint = true;

  timelineDates.forEach(date => {
    let totalPnL = 0;
    let hasOwnedStocks = false;
    
    portfolio.forEach(item => {
      const buyDate = item.buyDate.split('T')[0];
      if (date >= buyDate) {
        hasOwnedStocks = true;
        const history = historyMap[item.symbol];
        if (history) {
          const pastPrices = history.filter(h => h.date.split('T')[0] <= date);
          if (pastPrices.length > 0) {
            pastPrices.sort((a, b) => a.date.localeCompare(b.date));
            const priceOnDate = pastPrices[pastPrices.length - 1].close;
            const gain = (priceOnDate - item.buyPrice) * item.shares;
            totalPnL += gain;
          }
        }
      }
    });

    if (hasOwnedStocks) {
      if (isFirstPoint && date === earliestBuyDate) {
        pnlCurve.push({ date, price: 0 }); // strictly 0.00 on the first purchase date
        isFirstPoint = false;
      } else {
        pnlCurve.push({ date, price: totalPnL });
        isFirstPoint = false;
      }
    }
  });

  return pnlCurve;
}
