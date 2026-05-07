import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { EfficientFrontierResult, PortfolioPoint } from '../lib/utils/efficientFrontier';

interface EfficientFrontierChartProps {
  data: EfficientFrontierResult | null;
  symbols: string[];
  isLoading: boolean;
}

const PADDING_TOP = 20;
const PADDING_BOTTOM = 30;
const PADDING_LEFT = 50;
const PADDING_RIGHT = 30;
const CHART_HEIGHT = 220;

export function EfficientFrontierChart({ data, symbols, isLoading }: EfficientFrontierChartProps) {
  const [chartWidth, setChartWidth] = React.useState(280);
  const chartRef = useRef<View>(null);
  const [tooltip, setTooltip] = useState<{ point: PortfolioPoint; title: string; x: number; y: number } | null>(null);

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
        <Text style={styles.loadingText}>{isLoading ? 'Optimizing Frontier...' : 'No Data'}</Text>
      </View>
    );
  }

  const { boundaryPoints, minVariance, maxSharpe } = data;

  if (boundaryPoints.length === 0) {
    return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Not enough variance data.</Text></View>;
  }

  // Find min/max for scaling
  let minVol = Math.floor(Math.min(...boundaryPoints.map(p => p.volatility)) * 0.9);
  let maxVol = Math.ceil(Math.max(...boundaryPoints.map(p => p.volatility)) * 1.1);
  let minRet = Math.floor(Math.min(...boundaryPoints.map(p => p.return)) * 0.9);
  let maxRet = Math.ceil(Math.max(...boundaryPoints.map(p => p.return)) * 1.1);

  // Ensure maxSharpe is inside bounds (it should be, but just in case)
  maxVol = Math.max(maxVol, maxSharpe.volatility * 1.1);
  maxRet = Math.max(maxRet, maxSharpe.return * 1.1);

  const volRange = maxVol - minVol || 1;
  const retRange = maxRet - minRet || 1;

  const getX = (vol: number) => PADDING_LEFT + ((vol - minVol) / volRange) * chartWidth;
  const getY = (ret: number) => PADDING_TOP + ((maxRet - ret) / retRange) * CHART_HEIGHT;

  // Build the curve path
  let pathD = '';
  boundaryPoints.forEach((p, i) => {
    const x = getX(p.volatility);
    const y = getY(p.return);
    pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const msX = getX(maxSharpe.volatility);
  const msY = getY(maxSharpe.return);
  
  const mvX = getX(minVariance.volatility);
  const mvY = getY(minVariance.return);

  // Star polygon generator for Max Sharpe
  const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    let path = '';

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      path += ` L ${x} ${y}`;
      rot += step;
    }
    path += ' Z';
    return path;
  };

  return (
    <View style={styles.container}>
      <View ref={chartRef} style={styles.chartBox}>
        {/* Y-Axis */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{(maxRet * 100).toFixed(1)}%</Text>
          <Text style={styles.axisLabel}>{((maxRet + minRet) / 2 * 100).toFixed(1)}%</Text>
          <Text style={styles.axisLabel}>{(minRet * 100).toFixed(1)}%</Text>
        </View>

        {/* X-Axis */}
        <View style={styles.xAxisLabels}>
          <Text style={styles.axisLabel}>{(minVol * 100).toFixed(1)}%</Text>
          <Text style={styles.axisLabel}>{((maxVol + minVol) / 2 * 100).toFixed(1)}%</Text>
          <Text style={styles.axisLabel}>{(maxVol * 100).toFixed(1)}%</Text>
        </View>
        <Text style={styles.xAxisTitle}>Volatility (Risk)</Text>
        <Text style={styles.yAxisTitle}>Expected Return</Text>

        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="efGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#007AFF" />
              <Stop offset="1" stopColor="#34C759" />
            </LinearGradient>
          </Defs>

          {/* Efficient Frontier Curve */}
          <Path d={pathD} stroke="url(#efGradient)" strokeWidth="3" fill="none" strokeLinejoin="round" />

          {/* Minimum Variance Point (Circle) */}
          <Circle 
            cx={mvX} cy={mvY} r="6" fill="#007AFF" stroke="#FFF" strokeWidth="2" 
            onPress={() => setTooltip({ point: minVariance, title: 'Min Variance', x: mvX, y: mvY })}
          />

          {/* Max Sharpe Point (Star) */}
          <Path 
            d={drawStar(msX, msY, 5, 8, 4)} fill="#FF9500" stroke="#FFF" strokeWidth="1"
            onPress={() => setTooltip({ point: maxSharpe, title: 'Max Sharpe', x: msX, y: msY })}
          />
        </Svg>

        {tooltip && (
          <View style={[styles.tooltip, { left: Math.min(tooltip.x - 60, chartWidth - 80), top: Math.max(10, tooltip.y - 120) }]}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipTitle}>{tooltip.title}</Text>
              <Text style={styles.closeTooltip} onPress={() => setTooltip(null)}>✕</Text>
            </View>
            <View style={styles.tooltipStats}>
              <Text style={styles.tooltipStatText}>Ret: {(tooltip.point.return * 100).toFixed(2)}%</Text>
              <Text style={styles.tooltipStatText}>Vol: {(tooltip.point.volatility * 100).toFixed(2)}%</Text>
            </View>
            <View style={styles.tooltipDivider} />
            {symbols.map((sym, idx) => (
              <View key={sym} style={styles.tooltipRow}>
                <Text style={styles.tooltipSymbol}>{sym}</Text>
                <Text style={styles.tooltipWeight}>{(tooltip.point.weights[idx] * 100).toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendShape, { borderRadius: 6, backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>Min Variance</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.legendText}>Max Sharpe</Text>
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
    zIndex: 1,
  },
  xAxisLabels: {
    position: 'absolute',
    left: PADDING_LEFT,
    right: PADDING_RIGHT,
    bottom: PADDING_BOTTOM - 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  axisLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  xAxisTitle: {
    position: 'absolute',
    bottom: 0,
    left: PADDING_LEFT,
    right: PADDING_RIGHT,
    textAlign: 'center',
    fontSize: 10,
    color: '#AEAEB2',
    fontWeight: '600',
  },
  yAxisTitle: {
    position: 'absolute',
    left: -20,
    top: CHART_HEIGHT / 2,
    transform: [{ rotate: '-90deg' }],
    fontSize: 10,
    color: '#AEAEB2',
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendShape: {
    width: 12,
    height: 12,
  },
  starIcon: {
    fontSize: 10,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    padding: 12,
    borderRadius: 12,
    minWidth: 120,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeTooltip: {
    color: '#AEAEB2',
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 12,
  },
  tooltipStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tooltipStatText: {
    color: '#AEAEB2',
    fontSize: 10,
  },
  tooltipDivider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginBottom: 8,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tooltipSymbol: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipWeight: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '700',
  },
});
