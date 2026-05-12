import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { usePortfolioStore } from '../../lib/store/portfolio';
import { useMultipleStockHistory } from '../../lib/hooks/useStock';
import { calculateReturns, calculateMean, calculateCovariance } from '../../lib/utils/math';
import { runMonteCarloAsync, MonteCarloResult } from '../../lib/utils/monteCarlo';
import { runEfficientFrontierAsync, EfficientFrontierResult, PortfolioPoint } from '../../lib/utils/efficientFrontier';
import { OptimizerControls } from '../../components/OptimizerControls';
import { MonteCarloFanChart } from '../../components/MonteCarloFanChart';
import { EfficientFrontierChart } from '../../components/EfficientFrontierChart';
import { AllocationBreakdown } from '../../components/AllocationBreakdown';

export default function OptimizerScreen() {
  const { items } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  
  const [mcDays, setMcDays] = useState(90);
  const [mcSims, setMcSims] = useState(5000);
  
  const [isMCRunning, setIsMCRunning] = useState(false);
  const [isEFRunning, setIsEFRunning] = useState(false);
  
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);
  const [efResult, setEfResult] = useState<EfficientFrontierResult | null>(null);
  const [hoveredPortfolio, setHoveredPortfolio] = useState<PortfolioPoint | null>(null);

  const uniqueSymbols = useMemo(() => Array.from(new Set(items.map(item => item.symbol))), [items]);
  const historyQueries = useMultipleStockHistory(uniqueSymbols, '1Y');

  const onRefresh = () => {
    setRefreshing(true);
    historyQueries.forEach(query => query.refetch());
    setTimeout(() => setRefreshing(false), 1000);
  };

  const isDataReady = historyQueries.every(q => q.data && q.data.length > 0);

  // Math prep
  const { expectedReturns, covarianceMatrix, currentPortfolioValue, dailyDrift, dailyVol } = useMemo(() => {
    if (!isDataReady || uniqueSymbols.length === 0) {
      return { expectedReturns: [], covarianceMatrix: [], currentPortfolioValue: 0, dailyDrift: 0, dailyVol: 0 };
    }

    const pricesMap: Record<string, number[]> = {};
    const returnsMap: Record<string, number[]> = {};
    const expectedReturns: number[] = [];

    uniqueSymbols.forEach((symbol, index) => {
      const hist = historyQueries[index].data || [];
      const sorted = [...hist].sort((a, b) => a.date.localeCompare(b.date));
      const prices = sorted.map(h => h.close);
      pricesMap[symbol] = prices;
      
      const rets = calculateReturns(prices);
      returnsMap[symbol] = rets;
      expectedReturns.push(calculateMean(rets));
    });

    const covarianceMatrix: number[][] = [];
    for (let i = 0; i < uniqueSymbols.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < uniqueSymbols.length; j++) {
        const r1 = returnsMap[uniqueSymbols[i]];
        const r2 = returnsMap[uniqueSymbols[j]];
        const minLen = Math.min(r1.length, r2.length);
        const a1 = r1.slice(r1.length - minLen);
        const a2 = r2.slice(r2.length - minLen);
        row.push(calculateCovariance(a1, a2));
      }
      covarianceMatrix.push(row);
    }

    // Current Portfolio weights
    let totalValue = 0;
    const weights: number[] = [];
    uniqueSymbols.forEach(symbol => {
      const symbolShares = items
        .filter(item => item.symbol === symbol)
        .reduce((sum, item) => sum + item.shares, 0);

      const prices = pricesMap[symbol];
      if (prices && prices.length > 0) {
        const val = prices[prices.length - 1] * symbolShares;
        weights.push(val);
        totalValue += val;
      } else {
        weights.push(0);
      }
    });
    
    let portDrift = 0;
    let portVar = 0;
    
    if (totalValue > 0) {
      for (let i = 0; i < weights.length; i++) weights[i] /= totalValue;
      for (let i = 0; i < weights.length; i++) {
        portDrift += weights[i] * expectedReturns[i];
        for (let j = 0; j < weights.length; j++) {
          portVar += weights[i] * weights[j] * covarianceMatrix[i][j];
        }
      }
    }

    return {
      expectedReturns,
      covarianceMatrix,
      currentPortfolioValue: totalValue,
      dailyDrift: portDrift,
      dailyVol: Math.sqrt(portVar)
    };
  }, [uniqueSymbols, historyQueries, isDataReady, items]);

  const handleRunMC = async () => {
    if (!isDataReady) {
      Alert.alert('Data Loading', 'Please wait for historical data to load.');
      return;
    }
    if (currentPortfolioValue <= 0) return;

    setIsMCRunning(true);
    // Yield initially so React can render the loading state immediately
    await new Promise(r => setTimeout(r, 10));

    try {
      const res = await runMonteCarloAsync(
        currentPortfolioValue,
        dailyVol,
        dailyDrift,
        mcDays,
        mcSims
      );
      setMcResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMCRunning(false);
    }
  };

  const handleRunEF = async () => {
    if (!isDataReady) {
      Alert.alert('Data Loading', 'Please wait for historical data to load.');
      return;
    }
    if (uniqueSymbols.length < 2) {
      Alert.alert('Not Enough Assets', 'Efficient Frontier requires at least 2 distinct assets in your portfolio.');
      return;
    }

    setIsEFRunning(true);
    await new Promise(r => setTimeout(r, 10));

    try {
      const res = await runEfficientFrontierAsync(
        uniqueSymbols,
        covarianceMatrix,
        expectedReturns,
        50 // Resolution
      );
      setEfResult(res);
      setHoveredPortfolio(res.maxSharpe); // Default to Max Sharpe
    } catch (e) {
      console.error(e);
    } finally {
      setIsEFRunning(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🧮</Text>
        <Text style={styles.emptyTitle}>No Data</Text>
        <Text style={styles.emptySubtitle}>Add stocks to unlock advanced models.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.controlsSection}>
        <OptimizerControls
          days={mcDays}
          setDays={setMcDays}
          simulations={mcSims}
          setSimulations={setMcSims}
          onRunMC={handleRunMC}
          onRunEF={handleRunEF}
          isMCRunning={isMCRunning}
          isEFRunning={isEFRunning}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monte Carlo Simulation</Text>
        <Text style={styles.sectionDesc}>Projects future portfolio value paths using Geometric Brownian Motion.</Text>
        <MonteCarloFanChart data={mcResult} isLoading={isMCRunning} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Efficient Frontier</Text>
        <Text style={styles.sectionDesc}>Optimizes target weightings using Modern Portfolio Theory.</Text>
        <EfficientFrontierChart 
          data={efResult} 
          symbols={uniqueSymbols} 
          isLoading={isEFRunning} 
          onHover={(p) => {
            if (p) setHoveredPortfolio(p);
            else if (efResult) setHoveredPortfolio(efResult.maxSharpe);
          }}
        />
        {efResult && hoveredPortfolio && (
          <AllocationBreakdown 
            symbols={uniqueSymbols} 
            weights={hoveredPortfolio.weights} 
            title="Portfolio Weights"
            subtitle={`Ret: ${(hoveredPortfolio.return * 100).toFixed(2)}% • Vol: ${(hoveredPortfolio.volatility * 100).toFixed(2)}% • Sharpe: ${hoveredPortfolio.sharpe.toFixed(2)}`}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  controlsSection: {
    margin: 16,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
