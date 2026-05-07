import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AllocationBreakdownProps {
  symbols: string[];
  weights: number[];
  title?: string;
  subtitle?: string;
}

// Institutional color palette
const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE', '#FF2D55', '#E5E5EA'];

export function AllocationBreakdown({ symbols, weights, title, subtitle }: AllocationBreakdownProps) {
  if (!symbols.length || !weights.length) return null;

  const validPairs = symbols.map((sym, i) => ({
    symbol: sym,
    weight: weights[i],
    color: COLORS[i % COLORS.length]
  })).filter(item => item.weight > 0.005); // Filter out tiny dust weights (< 0.5%)

  // Sort descending by weight for cleaner visualization
  validPairs.sort((a, b) => b.weight - a.weight);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title || 'Optimal Allocation'}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Stacked Bar */}
      <View style={styles.barContainer}>
        {validPairs.map((item, idx) => (
          <View 
            key={item.symbol} 
            style={[
              styles.barSegment, 
              { 
                width: `${Math.max(item.weight * 100, 1)}%`, 
                backgroundColor: item.color,
                borderTopLeftRadius: idx === 0 ? 8 : 0,
                borderBottomLeftRadius: idx === 0 ? 8 : 0,
                borderTopRightRadius: idx === validPairs.length - 1 ? 8 : 0,
                borderBottomRightRadius: idx === validPairs.length - 1 ? 8 : 0,
              }
            ]} 
          />
        ))}
      </View>

      {/* Legend / List */}
      <View style={styles.legendContainer}>
        {validPairs.map(item => (
          <View key={item.symbol} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendSymbol}>{item.symbol}</Text>
            </View>
            <Text style={styles.legendWeight}>{(item.weight * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  barContainer: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    marginBottom: 20,
  },
  barSegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  legendWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
});
