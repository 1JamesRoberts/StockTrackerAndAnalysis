import { StockHistory, ChartDataPoint } from '../types';
import { calculateStandardDeviation, calculateMean } from './math';

export type RebalanceFrequency = 'none' | 'daily' | 'monthly' | 'yearly';

export interface BacktestResult {
  equityCurve: ChartDataPoint[];
  dailyReturns: number[];
  totalReturn: number;
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export function calculateMaxDrawdown(equityCurve: ChartDataPoint[]): number {
  if (equityCurve.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = equityCurve[0].price;

  for (let i = 1; i < equityCurve.length; i++) {
    const value = equityCurve[i].price;
    if (value > peak) {
      peak = value;
    }
    const drawdown = (value - peak) / peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

export function calculateSharpeRatio(dailyReturns: number[], riskFreeRate = 0): number {
  if (dailyReturns.length <= 1) return 0;
  
  const meanDailyReturn = calculateMean(dailyReturns);
  const stdDevDailyReturn = calculateStandardDeviation(dailyReturns, meanDailyReturn);
  
  if (stdDevDailyReturn === 0) return 0;
  
  // Annualize Sharpe ratio (assume 252 trading days per year)
  const annualizedReturn = meanDailyReturn * 252;
  const annualizedStdDev = stdDevDailyReturn * Math.sqrt(252);
  
  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

export function runBacktest(
  symbols: string[],
  weights: number[], // Should sum to 1
  historyMap: Record<string, StockHistory[]>,
  rebalanceFreq: RebalanceFrequency,
  initialCapital = 10000
): BacktestResult {
  if (symbols.length === 0 || weights.length !== symbols.length) {
    return { equityCurve: [], dailyReturns: [], totalReturn: 0, volatility: 0, maxDrawdown: 0, sharpeRatio: 0 };
  }

  // 1. Gather all unique dates where ALL symbols have data
  const dateSets = symbols.map(sym => {
    const history = historyMap[sym] || [];
    return new Set(history.map(h => h.date.split('T')[0]));
  });

  if (dateSets.some(set => set.size === 0)) {
     return { equityCurve: [], dailyReturns: [], totalReturn: 0, volatility: 0, maxDrawdown: 0, sharpeRatio: 0 };
  }

  // Find intersection of all dates
  let commonDates = new Set([...dateSets[0]]);
  for (let i = 1; i < dateSets.length; i++) {
    const currentSet = dateSets[i];
    commonDates = new Set([...commonDates].filter(x => currentSet.has(x)));
  }

  const timelineDates = Array.from(commonDates).sort();
  if (timelineDates.length === 0) {
    return { equityCurve: [], dailyReturns: [], totalReturn: 0, volatility: 0, maxDrawdown: 0, sharpeRatio: 0 };
  }

  // Create fast lookup for prices
  const priceMap: Record<string, Record<string, number>> = {};
  symbols.forEach(sym => {
    priceMap[sym] = {};
    (historyMap[sym] || []).forEach(h => {
      priceMap[sym][h.date.split('T')[0]] = h.close;
    });
  });

  const equityCurve: ChartDataPoint[] = [];
  const dailyReturns: number[] = [];

  let shares: number[] = new Array(symbols.length).fill(0);
  let prevTotalValue = initialCapital;
  let currentPortfolioValue = initialCapital;

  let prevDate = new Date(timelineDates[0]);

  // Initial Allocation
  const firstDateStr = timelineDates[0];
  for (let i = 0; i < symbols.length; i++) {
    const price = priceMap[symbols[i]][firstDateStr];
    shares[i] = (initialCapital * weights[i]) / price;
  }
  
  equityCurve.push({ date: firstDateStr, price: initialCapital });

  for (let i = 1; i < timelineDates.length; i++) {
    const dateStr = timelineDates[i];
    const currentDate = new Date(dateStr);

    // Calculate current portfolio value based on held shares
    currentPortfolioValue = 0;
    for (let j = 0; j < symbols.length; j++) {
      currentPortfolioValue += shares[j] * priceMap[symbols[j]][dateStr];
    }

    // Daily return
    const dailyReturn = (currentPortfolioValue - prevTotalValue) / prevTotalValue;
    dailyReturns.push(dailyReturn);
    equityCurve.push({ date: dateStr, price: currentPortfolioValue });

    // Check rebalance trigger
    let shouldRebalance = false;
    if (rebalanceFreq === 'daily') {
      shouldRebalance = true;
    } else if (rebalanceFreq === 'monthly') {
      if (currentDate.getMonth() !== prevDate.getMonth()) {
        shouldRebalance = true;
      }
    } else if (rebalanceFreq === 'yearly') {
      if (currentDate.getFullYear() !== prevDate.getFullYear()) {
        shouldRebalance = true;
      }
    }

    if (shouldRebalance) {
      for (let j = 0; j < symbols.length; j++) {
        const price = priceMap[symbols[j]][dateStr];
        shares[j] = (currentPortfolioValue * weights[j]) / price;
      }
    }

    prevTotalValue = currentPortfolioValue;
    prevDate = currentDate;
  }

  const totalReturn = (currentPortfolioValue - initialCapital) / initialCapital;
  
  // Calculate Volatility (annualized std dev of daily returns)
  const stdDevDailyReturn = calculateStandardDeviation(dailyReturns);
  const volatility = stdDevDailyReturn * Math.sqrt(252);
  
  const maxDrawdown = calculateMaxDrawdown(equityCurve);
  const sharpeRatio = calculateSharpeRatio(dailyReturns);

  return {
    equityCurve,
    dailyReturns,
    totalReturn,
    volatility,
    maxDrawdown,
    sharpeRatio
  };
}
