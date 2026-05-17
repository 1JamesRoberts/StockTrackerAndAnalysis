import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface OptimizerControlsProps {
  days: number;
  setDays: (d: number) => void;
  simulations: number;
  setSimulations: (s: number) => void;
  onRunMC: () => void;
  onRunEF: () => void;
  isMCRunning: boolean;
  isEFRunning: boolean;
}

export function OptimizerControls({
  days,
  setDays,
  simulations,
  setSimulations,
  onRunMC,
  onRunEF,
  isMCRunning,
  isEFRunning,
}: OptimizerControlsProps) {
  const dayOptions = [30, 90, 180, 365];
  const simOptions = [1000, 5000, 10000];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Simulation Parameters</Text>
      
      <Text style={styles.label}>Time Horizon (Days)</Text>
      <View style={styles.buttonGroup}>
        {dayOptions.map(d => (
          <TouchableOpacity 
            key={d} 
            style={[styles.optionBtn, days === d && styles.optionBtnActive]}
            onPress={() => setDays(d)}
          >
            <Text style={[styles.optionText, days === d && styles.optionTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Number of Paths</Text>
      <View style={styles.buttonGroup}>
        {simOptions.map(s => (
          <TouchableOpacity 
            key={s} 
            style={[styles.optionBtn, simulations === s && styles.optionBtnActive]}
            onPress={() => setSimulations(s)}
          >
            <Text style={[styles.optionText, simulations === s && styles.optionTextActive]}>{s / 1000}k</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.runBtn, isMCRunning && styles.runBtnDisabled]} 
          onPress={onRunMC}
          disabled={isMCRunning}
        >
          <Text style={styles.runBtnText}>{isMCRunning ? 'Simulating...' : 'Run Monte Carlo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.runBtn, { backgroundColor: '#34C759' }, isEFRunning && styles.runBtnDisabled]} 
          onPress={onRunEF}
          disabled={isEFRunning}
        >
          <Text style={styles.runBtnText}>{isEFRunning ? 'Optimizing...' : 'Run Frontier'}</Text>
        </TouchableOpacity>
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  optionBtnActive: {
    backgroundColor: '#1C1C1E',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  runBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  runBtnDisabled: {
    opacity: 0.5,
  },
  runBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
