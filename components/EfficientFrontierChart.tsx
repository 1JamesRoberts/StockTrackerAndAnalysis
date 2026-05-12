import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { EfficientFrontierResult, PortfolioPoint } from '../lib/utils/efficientFrontier';

interface EfficientFrontierChartProps {
  data: EfficientFrontierResult | null;
  symbols: string[];
  isLoading: boolean;
  onHover?: (point: PortfolioPoint | null) => void;
}

const PADDING_TOP = 20;
const PADDING_BOTTOM = 30;
const PADDING_LEFT = 50;
const PADDING_RIGHT = 30;
const CHART_HEIGHT = 220;

export function EfficientFrontierChart({ data, symbols, isLoading, onHover }: EfficientFrontierChartProps) {
  const [chartWidth, setChartWidth] = React.useState(280);
  const chartRef = useRef<View>(null);
  const [activePoint, setActivePoint] = useState<PortfolioPoint | null>(null);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    const availableWidth = width - PADDING_LEFT - PADDING_RIGHT;
    if (availableWidth > 0) {
      setChartWidth(availableWidth);
    }
  };

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

  // Find min/max for scaling relative to their actual values
  const rawMinVol = Math.min(...boundaryPoints.map(p => p.volatility), minVariance.volatility, maxSharpe.volatility);
  const rawMaxVol = Math.max(...boundaryPoints.map(p => p.volatility), minVariance.volatility, maxSharpe.volatility);
  const rawMinRet = Math.min(...boundaryPoints.map(p => p.return), minVariance.return, maxSharpe.return);
  const rawMaxRet = Math.max(...boundaryPoints.map(p => p.return), minVariance.return, maxSharpe.return);

  // Add 10% padding for better visualization
  const volPad = (rawMaxVol - rawMinVol) * 0.1 || 0.05;
  const retPad = (rawMaxRet - rawMinRet) * 0.1 || 0.05;

  const minVol = Math.max(0, rawMinVol - volPad);
  const maxVol = rawMaxVol + volPad;
  const minRet = rawMinRet - retPad;
  const maxRet = rawMaxRet + retPad;

  const volRange = maxVol - minVol || 1;
  const retRange = maxRet - minRet || 1;

  const getX = (vol: number) => PADDING_LEFT + ((vol - minVol) / volRange) * chartWidth;
  const getY = (ret: number) => PADDING_TOP + ((maxRet - ret) / retRange) * CHART_HEIGHT;

  // Interaction handlers
  const handleMove = (xPos: number) => {
    if (xPos < PADDING_LEFT || xPos > PADDING_LEFT + chartWidth) {
      setActivePoint(null);
      if (onHover) onHover(null);
      return;
    }
    const targetVol = minVol + ((xPos - PADDING_LEFT) / chartWidth) * volRange;
    // Find closest point by volatility
    let closest = boundaryPoints[0];
    let minDist = Math.abs(closest.volatility - targetVol);
    for (const p of boundaryPoints) {
      const dist = Math.abs(p.volatility - targetVol);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    setActivePoint(closest);
    if (onHover) onHover(closest);
  };

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
      <View 
        ref={chartRef} 
        style={styles.chartBox}
        onLayout={handleLayout}
        onTouchMove={e => handleMove(e.nativeEvent.locationX)}
        onTouchEnd={() => { setActivePoint(null); if (onHover) onHover(null); }}
        onMouseMove={(e: any) => {
          // On web, nativeEvent.offsetX provides the local coordinate instantly
          const x = e.nativeEvent.offsetX ?? e.nativeEvent.locationX;
          if (x !== undefined) {
            handleMove(x);
          } else if (chartRef.current && e.clientX) {
            chartRef.current.measure((fx, fy, w, h, px, py) => {
              handleMove(e.clientX - px);
            });
          }
        }}
        onMouseLeave={() => { setActivePoint(null); if (onHover) onHover(null); }}
      >
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

        <Svg pointerEvents="none" width={chartWidth + PADDING_LEFT + PADDING_RIGHT} height={CHART_HEIGHT + PADDING_TOP + PADDING_BOTTOM} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="efGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#007AFF" />
              <Stop offset="1" stopColor="#34C759" />
            </LinearGradient>
          </Defs>

          {/* Efficient Frontier Curve */}
          <Path d={pathD} stroke="url(#efGradient)" strokeWidth="3" fill="none" strokeLinejoin="round" />

          {/* Active Hover Line and Point */}
          {activePoint && (
            <>
              <Path 
                d={`M ${getX(activePoint.volatility)} ${PADDING_TOP} L ${getX(activePoint.volatility)} ${PADDING_TOP + CHART_HEIGHT}`} 
                stroke="#E5E5EA" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
              <Circle 
                cx={getX(activePoint.volatility)} 
                cy={getY(activePoint.return)} 
                r="5" 
                fill="#1C1C1E" 
                stroke="#FFF" 
                strokeWidth="2" 
              />
            </>
          )}

          {/* Minimum Variance Point (Circle) */}
          <Circle 
            cx={mvX} cy={mvY} r="6" fill="#007AFF" stroke="#FFF" strokeWidth="2" 
          />

          {/* Max Sharpe Point (Star) */}
          <Path 
            d={drawStar(msX, msY, 5, 8, 4)} fill="#FF9500" stroke="#FFF" strokeWidth="1"
          />
        </Svg>

        {/* Tooltip Overlay */}
        {activePoint && (
          <View 
            style={[
              styles.tooltip, 
              { 
                left: Math.min(Math.max(10, getX(activePoint.volatility) - 45), chartWidth + PADDING_LEFT - 80), 
                top: Math.max(0, getY(activePoint.return) - 55) 
              }
            ]}
          >
            <Text style={styles.tooltipText}>Ret: {(activePoint.return * 100).toFixed(2)}%</Text>
            <Text style={styles.tooltipText}>Vol: {(activePoint.volatility * 100).toFixed(2)}%</Text>
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
