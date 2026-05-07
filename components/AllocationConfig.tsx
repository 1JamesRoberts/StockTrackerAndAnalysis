import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RebalanceFrequency } from '../lib/utils/backtest';

interface AllocationConfigProps {
  symbols: string[];
  weights: number[];
  onChangeWeight: (index: number, weight: number) => void;
  rebalanceFreq: RebalanceFrequency;
  onChangeRebalanceFreq: (freq: RebalanceFrequency) => void;
}

export function AllocationConfig({
  symbols,
  weights,
  onChangeWeight,
  rebalanceFreq,
  onChangeRebalanceFreq
}: AllocationConfigProps) {
  const frequencies: { label: string; value: RebalanceFrequency }[] = [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const isError = Math.abs(totalWeight - 1) > 0.01;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Target Allocation</Text>
      
      <View style={styles.assetsList}>
        {symbols.map((sym, index) => (
          <View key={sym} style={styles.assetRow}>
            <Text style={styles.symbol}>{sym}</Text>
            <View style={styles.weightControl}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => onChangeWeight(index, Math.max(0, weights[index] - 0.05))}
              >
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.weightText}>{Math.round(weights[index] * 100)}%</Text>
              
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => onChangeWeight(index, Math.min(1, weights[index] + 0.05))}
              >
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={[styles.totalValue, isError ? styles.errorText : styles.successText]}>
          {Math.round(totalWeight * 100)}%
        </Text>
      </View>
      {isError && (
        <Text style={styles.errorHint}>Weights should sum to exactly 100%.</Text>
      )}

      <Text style={styles.sectionTitle}>Rebalance Frequency</Text>
      <View style={styles.freqContainer}>
        {frequencies.map(f => (
          <TouchableOpacity 
            key={f.value}
            style={[styles.freqButton, rebalanceFreq === f.value && styles.freqButtonActive]}
            onPress={() => onChangeRebalanceFreq(f.value)}
          >
            <Text style={[styles.freqText, rebalanceFreq === f.value && styles.freqTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    marginTop: 8,
  },
  assetsList: {
    marginBottom: 8,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  weightControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  weightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 44,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF3B30',
  },
  successText: {
    color: '#34C759',
  },
  errorHint: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'right',
  },
  freqContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  freqButtonActive: {
    backgroundColor: '#1C1C1E',
  },
  freqText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  freqTextActive: {
    color: '#FFFFFF',
  },
});
