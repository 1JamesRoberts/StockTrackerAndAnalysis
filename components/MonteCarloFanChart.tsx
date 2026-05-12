import React, { useState, useEffect, useRef, useId } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    const availableWidth = width - PADDING_LEFT - PADDING_RIGHT;
    if (availableWidth > 0) {
      setChartWidth(availableWidth);
    }
  };

  const handleMove = (xPos: number) => {
    if (!data) return;
    if (xPos < PADDING_LEFT || xPos > PADDING_LEFT + chartWidth) {
      setActiveIndex(null);
      return;
    }
    const days = data.percentile50.length;
    let index = Math.round(((xPos - PADDING_LEFT) / chartWidth) * (days - 1));
    index = Math.max(0, Math.min(index, days - 1));
    setActiveIndex(index);
  };

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{isLoading ? 'Simulating Paths...' : 'No Data'}</Text>
      </View>
    );
  }

  const { percentile5, percentile50, percentile95, samplePaths } = data;
  const days = percentile50.length;

  const rawMinPrice = Math.min(...percentile5);
  const rawMaxPrice = Math.max(...percentile95);
  const pricePad = (rawMaxPrice - rawMinPrice) * 0.1 || rawMinPrice * 0.1 || 1;
  
  const minPrice = Math.max(0, rawMinPrice - pricePad);
  const maxPrice = rawMaxPrice + pricePad;
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
      <View 
        ref={chartRef} 
        style={styles.chartBox} 
        onLayout={handleLayout}
        onTouchMove={e => handleMove(e.nativeEvent.locationX)}
        onTouchEnd={() => setActiveIndex(null)}
        onMouseMove={(e: any) => {
          const x = e.nativeEvent.offsetX ?? e.nativeEvent.locationX;
          if (x !== undefined) {
            handleMove(x);
          } else if (chartRef.current && e.clientX) {
            chartRef.current.measure((fx, fy, w, h, px, py) => {
              handleMove(e.clientX - px);
            });
          }
        }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>${maxPrice.toFixed(2)}</Text>
          <Text style={styles.axisLabel}>${((maxPrice + minPrice) / 2).toFixed(2)}</Text>
          <Text style={styles.axisLabel}>${minPrice.toFixed(2)}</Text>
        </View>

        <Svg pointerEvents="none" width={chartWidth + PADDING_LEFT + PADDING_RIGHT} height={CHART_HEIGHT + PADDING_TOP + PADDING_BOTTOM} style={StyleSheet.absoluteFill}>
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
          
          {/* Active Hover Line and Point */}
          {activeIndex !== null && (
            <>
              <Path 
                d={`M ${getX(activeIndex)} ${PADDING_TOP} L ${getX(activeIndex)} ${PADDING_TOP + CHART_HEIGHT}`} 
                stroke="#E5E5EA" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
              <Circle 
                cx={getX(activeIndex)} 
                cy={getY(percentile50[activeIndex])} 
                r="5" 
                fill="#007AFF" 
                stroke="#FFF" 
                strokeWidth="2" 
              />
            </>
          )}
        </Svg>

        {/* Tooltip Overlay */}
        {activeIndex !== null && (
          <View 
            style={[
              styles.tooltip, 
              { 
                left: Math.min(Math.max(10, getX(activeIndex) - 50), chartWidth + PADDING_LEFT - 80), 
                top: Math.max(0, getY(percentile50[activeIndex]) - 75) 
              }
            ]}
          >
            <Text style={styles.tooltipText}>Day {activeIndex}</Text>
            <Text style={styles.tooltipText}>Exp: ${percentile50[activeIndex].toFixed(2)}</Text>
            <Text style={[styles.tooltipText, {fontSize: 10, color: '#AEAEB2', fontWeight: '500'}]}>
              High: ${percentile95[activeIndex].toFixed(2)}
            </Text>
            <Text style={[styles.tooltipText, {fontSize: 10, color: '#AEAEB2', fontWeight: '500'}]}>
              Low: ${percentile5[activeIndex].toFixed(2)}
            </Text>
          </View>
        )}
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
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    pointerEvents: 'none',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
});
