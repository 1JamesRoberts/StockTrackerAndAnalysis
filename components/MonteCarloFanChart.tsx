import React, { useState, useEffect, useRef, useId } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MonteCarloResult } from '../lib/utils/monteCarlo';

interface MonteCarloFanChartProps {
  data: MonteCarloResult | null;
  isLoading: boolean;
}

const PADDING_TOP = 20;
const PADDING_BOTTOM = 20;
const PADDING_LEFT = 50;
const PADDING_RIGHT = 15;
const CHART_HEIGHT = 200;

export function MonteCarloFanChart({ data, isLoading }: MonteCarloFanChartProps) {
  const [chartWidth, setChartWidth] = React.useState(280);
  const chartRef = useRef<View>(null);
  const chartId = useId().replace(/:/g, '');

  useEffect(() => {
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.measure((x, y, w, h, pageX, pageY) => {
          const availableWidth = w - PADDING_LEFT - PADDING_RIGHT;
          setChartWidth(availableWidth > 0 ? availableWidth : 280);
        });
      }
    }, 50);
  }, []);

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{isLoading ? 'Simulating Paths...' : 'No Data'}</Text>
      </View>
    );
  }

  const { percentile5, percentile50, percentile95, samplePaths } = data;
  const days = percentile50.length;

  let minPrice = Math.floor(Math.min(...percentile5) * 0.95);
  let maxPrice = Math.ceil(Math.max(...percentile95) * 1.05);
  const priceRange = maxPrice - minPrice || 1;

  // Helpers to get X and Y coordinates
  const getX = (index: number) => PADDING_LEFT + (index / Math.max(1, days - 1)) * chartWidth;
  const getY = (val: number) => PADDING_TOP + ((maxPrice - val) / priceRange) * CHART_HEIGHT;

  // Build shaded area (95th down to 5th)
  let areaPath = '';
  for (let i = 0; i < days; i++) {
    const x = getX(i);
    const y = getY(percentile95[i]);
    areaPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  for (let i = days - 1; i >= 0; i--) {
    const x = getX(i);
    const y = getY(percentile5[i]);
    areaPath += ` L ${x} ${y}`;
  }
  areaPath += ' Z';

  // Build Median Line
  let medianPath = '';
  for (let i = 0; i < days; i++) {
    const x = getX(i);
    const y = getY(percentile50[i]);
    medianPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  // Build Sample Paths
  const samplePathsD = samplePaths.map(pathData => {
    let d = '';
    for (let i = 0; i < pathData.length; i++) {
      const x = getX(i);
      const y = getY(pathData[i]);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  });

  return (
    <View style={styles.container}>
      <View ref={chartRef} style={styles.chartBox}>
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>${maxPrice.toFixed(2)}</Text>
          <Text style={styles.axisLabel}>${((maxPrice + minPrice) / 2).toFixed(2)}</Text>
          <Text style={styles.axisLabel}>${minPrice.toFixed(2)}</Text>
        </View>

        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`fanGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#007AFF" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#007AFF" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          
          <Path d={areaPath} fill={`url(#fanGradient-${chartId})`} />
          
          {samplePathsD.map((d, idx) => (
            <Path key={idx} d={d} stroke="#8E8E93" strokeWidth="1" strokeOpacity="0.3" fill="none" />
          ))}

          <Path d={medianPath} stroke="#007AFF" strokeWidth="2.5" fill="none" />
        </Svg>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>Expected (50th)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#007AFF', opacity: 0.2 }]} />
          <Text style={styles.legendText}>90% Confidence</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    height: CHART_HEIGHT + PADDING_TOP + PADDING_BOTTOM,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
  },
  loadingText: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  chartBox: {
    height: CHART_HEIGHT + PADDING_TOP + PADDING_BOTTOM,
    width: '100%',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: PADDING_TOP - 6,
    bottom: PADDING_BOTTOM - 6,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  axisLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: -8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
