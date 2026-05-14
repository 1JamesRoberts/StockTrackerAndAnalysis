import React, { useState, useEffect, useRef, useId } from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ChartDataPoint, TimeRange } from '../lib/types';

interface InteractiveChartProps {
  data: ChartDataPoint[];
  baselineData?: ChartDataPoint[];
  isPositive?: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  transparentBackground?: boolean;
  isPnL?: boolean;
}

const PADDING_TOP = 25;
const PADDING_BOTTOM = 25;
const PADDING_LEFT = 45;
const PADDING_RIGHT = 15;
const CHART_HEIGHT = 170;

export function InteractiveChart({
  data,
  baselineData,
  isPositive = true,
  timeRange,
  onTimeRangeChange,
  transparentBackground = false,
  isPnL = false
}: InteractiveChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = React.useState(280);
  const chartRef = useRef<View>(null);
  const chartId = useId().replace(/:/g, '');
  const gradientId = `gradient-${chartId}`;
  const lineGradientId = `lineGradient-${chartId}`;

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '1Y'];
  const color = isPositive ? '#00C853' : '#FF5252';

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

  let points: { x: number; y: number; price: number; date: string }[] = [];
  let minPrice = 0;
  let maxPrice = 0;

  if (data && data.length > 0) {
    const prices = data.map(d => d.price);
    const baselinePrices = baselineData ? baselineData.map(d => d.price) : [];
    const allPrices = [...prices, ...baselinePrices];
    
    if (isPnL) {
      minPrice = Math.min(0, ...allPrices);
      maxPrice = Math.max(0, ...allPrices);
      // Give some padding
      const rng = maxPrice - minPrice;
      if (rng === 0) {
        maxPrice = 10;
        minPrice = -10;
      } else {
        maxPrice += rng * 0.1;
        minPrice -= rng * 0.1;
      }
    } else {
      minPrice = Math.floor(Math.min(...allPrices) * 0.98);
      maxPrice = Math.ceil(Math.max(...allPrices) * 1.02);
    }

    const priceRange = maxPrice - minPrice || 1;
    const availableHeight = CHART_HEIGHT;

    data.forEach((item, index) => {
      const xPercent = data.length > 1 ? index / (data.length - 1) : 0.5;
      const xPos = PADDING_LEFT + xPercent * chartWidth;
      const yPos = PADDING_TOP + ((maxPrice - item.price) / priceRange) * availableHeight;
      points.push({ x: xPos, y: yPos, price: item.price, date: item.date });
    });
  }

  const selectedPoint = hoverIndex !== null ? points[hoverIndex] : null;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const interactionId = `chart-interactive-area-${chartId}`;
    const wrapper = document.getElementById(interactionId);
    if (!wrapper) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;

      if (relativeX < PADDING_LEFT || relativeX > PADDING_LEFT + chartWidth || points.length === 0) {
        setHoverIndex(null);
        return;
      }

      const xPercent = (relativeX - PADDING_LEFT) / chartWidth;
      const index = Math.round(xPercent * (points.length - 1));
      setHoverIndex(Math.max(0, Math.min(index, points.length - 1)));
    };

    wrapper.addEventListener('mousemove', onMouseMove);
    wrapper.addEventListener('mouseleave', () => setHoverIndex(null));

    return () => {
      wrapper.removeEventListener('mousemove', onMouseMove);
      wrapper.removeEventListener('mouseleave', () => setHoverIndex(null));
    };
  }, [points.length, chartWidth]);

  const svgHeight = CHART_HEIGHT;
  let pathD = '';
  points.forEach((p, i) => {
    const x = p.x - PADDING_LEFT;
    const y = p.y - PADDING_TOP;
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  let baselinePathD = '';
  if (baselineData && baselineData.length > 0 && maxPrice - minPrice !== 0) {
    baselineData.forEach((item, index) => {
      const xPercent = baselineData.length > 1 ? index / (baselineData.length - 1) : 0.5;
      const x = (xPercent * chartWidth);
      const y = (((maxPrice - item.price) / (maxPrice - minPrice || 1)) * CHART_HEIGHT);
      if (index === 0) {
        baselinePathD += `M ${x} ${y}`;
      } else {
        baselinePathD += ` L ${x} ${y}`;
      }
    });
  }
  const zeroYPercent = ((maxPrice - 0) / (maxPrice - minPrice || 1)) * 100;
  const clampedZeroPercent = Math.max(0, Math.min(100, zeroYPercent));
  const zeroSvgY = (clampedZeroPercent / 100) * svgHeight;
  const baseAreaY = isPnL ? zeroSvgY : svgHeight;
  const areaPathD = pathD ? `${pathD} L ${chartWidth} ${baseAreaY} L 0 ${baseAreaY} Z` : '';

  return (
    <View style={[styles.container, transparentBackground && styles.transparentContainer]}>
      <View style={[styles.card, transparentBackground && styles.transparentCard]}>
        {!transparentBackground && timeRange !== 'ALL' && (
          <View style={styles.tabs}>
            {timeRanges.map(range => (
              <Pressable
                key={range}
                onPress={() => onTimeRangeChange(range)}
                style={[styles.tab, timeRange === range && styles.tabActive]}
              >
                <Text style={[styles.tabText, timeRange === range && styles.tabTextActive]}>
                  {range}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View ref={chartRef} style={styles.chartBox}>
          {selectedPoint && (
            <View style={[styles.tooltip, { left: selectedPoint.x - 40 }]}>
              <Text style={styles.tooltipPrice}>
                {selectedPoint.price < 0 ? `-$${Math.abs(selectedPoint.price).toFixed(2)}` : `$${selectedPoint.price.toFixed(2)}`}
              </Text>
              <Text style={styles.tooltipDate}>{formatDate(selectedPoint.date, timeRange)}</Text>
            </View>
          )}

          <View
            id={`chart-interactive-area-${chartId}`}
            style={[styles.chartArea, { width: chartWidth + PADDING_LEFT + PADDING_RIGHT }]}
            onTouchMove={e => {
              const x = e.nativeEvent.locationX;
              if (x < PADDING_LEFT || x > PADDING_LEFT + chartWidth) {
                setHoverIndex(null);
                return;
              }
              const idx = Math.round(((x - PADDING_LEFT) / chartWidth) * (points.length - 1));
              setHoverIndex(idx);
            }}
            onTouchEnd={() => setHoverIndex(null)}
          >
            <View style={styles.yAxis}>
              <Text style={styles.axisLabel}>
                {maxPrice < 0 ? `-$${Math.abs(maxPrice).toFixed(2)}` : `$${maxPrice.toFixed(2)}`}
              </Text>
              <Text style={styles.axisLabel}>
                {((maxPrice + minPrice) / 2) < 0 ? `-$${Math.abs((maxPrice + minPrice) / 2).toFixed(2)}` : `$${((maxPrice + minPrice) / 2).toFixed(2)}`}
              </Text>
              <Text style={styles.axisLabel}>
                {minPrice < 0 ? `-$${Math.abs(minPrice).toFixed(2)}` : `$${minPrice.toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.grid}>
              {[0, 25, 50, 75, 100].map((pos, i) => (
                <View key={i} style={[styles.gridLine, transparentBackground && styles.gridLineTransparent, { top: `${pos}%` }]} />
              ))}
              {isPnL && (
                <View style={[styles.zeroLine, transparentBackground && styles.zeroLineTransparent, { top: `${clampedZeroPercent}%` }]} />
              )}
            </View>

            <View style={[styles.chartContent, { left: PADDING_LEFT, width: chartWidth }]}>
              {points.length > 0 && (
                <View style={{ position: 'absolute', left: 0, top: PADDING_TOP, width: chartWidth, height: svgHeight, overflow: 'hidden' }}>
                  <Svg width={chartWidth} height={svgHeight}>
                    <Defs>
                      {isPnL ? (
                        <>
                          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2={svgHeight} gradientUnits="userSpaceOnUse">
                            <Stop offset="0%" stopColor="#00C853" stopOpacity="0.3" />
                            <Stop offset={`${clampedZeroPercent}%`} stopColor="#00C853" stopOpacity="0.0" />
                            <Stop offset={`${clampedZeroPercent}%`} stopColor="#FF5252" stopOpacity="0.0" />
                            <Stop offset="100%" stopColor="#FF5252" stopOpacity="0.3" />
                          </LinearGradient>
                          <LinearGradient id={lineGradientId} x1="0" y1="0" x2="0" y2={svgHeight} gradientUnits="userSpaceOnUse">
                            <Stop offset="0%" stopColor="#00C853" />
                            <Stop offset={`${clampedZeroPercent}%`} stopColor="#00C853" />
                            <Stop offset={`${clampedZeroPercent}%`} stopColor="#FF5252" />
                            <Stop offset="100%" stopColor="#FF5252" />
                          </LinearGradient>
                        </>
                      ) : (
                        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                          <Stop offset="1" stopColor={color} stopOpacity="0.0" />
                        </LinearGradient>
                      )}
                    </Defs>
                    <Path d={areaPathD} fill={`url(#${gradientId})`} />
                    {baselinePathD ? (
                      <Path d={baselinePathD} stroke="#AEAEB2" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                    ) : null}
                    <Path d={pathD} stroke={isPnL ? `url(#${lineGradientId})` : color} strokeWidth="2" fill="none" />
                  </Svg>
                </View>
              )}

              {points.map((p, i) => {
                const isSelected = i === hoverIndex;
                const pointColor = isPnL ? (p.price >= 0 ? '#00C853' : '#FF5252') : color;
                return (
                  <View
                    key={i}
                    style={[
                      styles.pointWrapper,
                      {
                        left: p.x - PADDING_LEFT - 6,
                        top: p.y - 6,
                      }
                    ]}
                  >
                    <View style={[
                      styles.pointDot,
                      {
                        backgroundColor: isSelected ? pointColor : 'transparent',
                        opacity: isSelected ? 1 : 0,
                        borderColor: '#fff',
                      }
                    ]} />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.xAxis}>
            <Text style={styles.axisLabel}>
              {data?.[0] ? formatDate(data[0].date, timeRange) : ''}
            </Text>
            <Text style={styles.axisLabel}>
              {data?.[data.length - 1] ? formatDate(data[data.length - 1].date, timeRange) : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function formatDate(d: string, r: TimeRange): string {
  if (!d) return '';
  const date = new Date(d);
  if (r === '1D') {
    return `${date.getHours() % 12 || 12}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  transparentContainer: { padding: 0 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  transparentCard: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, padding: 0 },
  tabs: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },
  tabActive: { backgroundColor: '#1a1a1a' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  chartBox: { position: 'relative', height: CHART_HEIGHT + PADDING_TOP + PADDING_BOTTOM + 30 },
  chartArea: { height: CHART_HEIGHT + PADDING_TOP + PADDING_BOTTOM, position: 'relative' },
  yAxis: { position: 'absolute', left: 8, top: PADDING_TOP, bottom: PADDING_BOTTOM, justifyContent: 'space-between', zIndex: 10 },
  axisLabel: { fontSize: 10, color: '#999' },
  grid: { position: 'absolute', left: PADDING_LEFT, right: PADDING_RIGHT, top: PADDING_TOP, bottom: PADDING_BOTTOM, zIndex: 0 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#eee' },
  gridLineTransparent: { backgroundColor: 'rgba(255,255,255,0.1)' },
  zeroLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderStyle: 'dashed' },
  zeroLineTransparent: { backgroundColor: 'rgba(255,255,255,0.5)' },
  chartContent: { position: 'absolute', top: 0, bottom: 0, overflow: 'visible' },
  areaFill: { position: 'absolute', opacity: 0.15, zIndex: 5 },
  lineSegment: { position: 'absolute', height: 2, transformOrigin: 'left center', zIndex: 10 },
  pointWrapper: { position: 'absolute', width: 16, height: 16, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  pointDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff', opacity: 0 },
  tooltip: { position: 'absolute', top: 5, backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, zIndex: 200, alignItems: 'center' },
  tooltipPrice: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tooltipDate: { color: '#999', fontSize: 10, marginTop: 2 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingLeft: PADDING_LEFT },
});