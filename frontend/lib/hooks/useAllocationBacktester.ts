import { useMemo } from 'react';
import { StockHistory } from '../types';
import { runBacktest, RebalanceFrequency, BacktestResult } from '../utils/backtest';

export interface UseAllocationBacktesterProps {
  symbols: string[];
  weights: number[]; // e.g. [0.6, 0.4]
  historyMap: Record<string, StockHistory[]>;
  rebalanceFreq: RebalanceFrequency;
  initialCapital?: number;
}

export interface UseAllocationBacktesterResult {
  portfolio: BacktestResult;
  baseline: BacktestResult;
  isReady: boolean;
}

export function useAllocationBacktester({
  symbols,
  weights,
  historyMap,
  rebalanceFreq,
  initialCapital = 10000
}: UseAllocationBacktesterProps): UseAllocationBacktesterResult {
  
  return useMemo(() => {
    // Check if we have all data
    const isReady = symbols.length > 0 && 
                    weights.length === symbols.length && 
                    symbols.every(sym => historyMap[sym] && historyMap[sym].length > 0);

    if (!isReady) {
      const emptyResult = { equityCurve: [], dailyReturns: [], totalReturn: 0, volatility: 0, maxDrawdown: 0, sharpeRatio: 0 };
      return { portfolio: emptyResult, baseline: emptyResult, isReady: false };
    }

    // 1. Run backtest for User Allocation
    const portfolioResult = runBacktest(symbols, weights, historyMap, rebalanceFreq, initialCapital);

    // 2. Run backtest for Baseline (Equal Weight, No Rebalance)
    const baselineWeights = new Array(symbols.length).fill(1 / symbols.length);
    const baselineResult = runBacktest(symbols, baselineWeights, historyMap, 'none', initialCapital);

    return {
      portfolio: portfolioResult,
      baseline: baselineResult,
      isReady: true,
    };
  }, [symbols, weights, historyMap, rebalanceFreq, initialCapital]);
}
