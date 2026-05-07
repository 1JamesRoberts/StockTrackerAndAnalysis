import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BacktestResult } from '../lib/utils/backtest';

interface QuantitativeMetricsGridProps {
  result: BacktestResult;
  baseline?: BacktestResult;
}

export function QuantitativeMetricsGrid({ result, baseline }: QuantitativeMetricsGridProps) {
  
  const MetricCard = ({ title, value, baselineValue, isPercent = false, invertColors = false }: { title: string, value: number, baselineValue?: number, isPercent?: boolean, invertColors?: boolean }) => {
    
    const formattedValue = isPercent ? `${(value * 100).toFixed(2)}%` : value.toFixed(2);
    const formattedBaseline = baselineValue !== undefined ? (isPercent ? `${(baselineValue * 100).toFixed(2)}%` : baselineValue.toFixed(2)) : null;
    
    let color = '#1C1C1E';
    if (invertColors) {
      if (value < 0) color = '#FF3B30';
      if (value > 0) color = '#34C759';
    } else {
      if (value > 0) color = '#34C759';
      if (value < 0) color = '#FF3B30';
    }

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{formattedValue}</Text>
        {formattedBaseline && (
          <Text style={styles.baseline}>Base: {formattedBaseline}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MetricCard 
        title="Total Return" 
        value={result.totalReturn} 
        baselineValue={baseline?.totalReturn}
        isPercent={true} 
      />
      <MetricCard 
        title="Volatility" 
        value={result.volatility} 
        baselineValue={baseline?.volatility}
        isPercent={true} 
        invertColors={true} // High volatility isn't necessarily red, but let's just keep it neutral actually
      />
      <MetricCard 
        title="Max Drawdown" 
        value={result.maxDrawdown} 
        baselineValue={baseline?.maxDrawdown}
        isPercent={true} 
        invertColors={true} // Drawdown is negative, red is worse
      />
      <MetricCard 
        title="Sharpe Ratio" 
        value={result.sharpeRatio} 
        baselineValue={baseline?.sharpeRatio}
        isPercent={false} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 16,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  baseline: {
    fontSize: 11,
    color: '#AEAEB2',
  },
});
