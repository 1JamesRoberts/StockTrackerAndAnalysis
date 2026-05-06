import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { ChartDataPoint, TimeRange } from '../lib/types';

interface InteractiveChartProps {
  data: ChartDataPoint[];
  isPositive: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const PADDING_TOP = 25;
const PADDING_BOTTOM = 25;
const PADDING_LEFT = 45;
const PADDING_RIGHT = 15;
const CHART_HEIGHT = 170;

export function InteractiveChart({ 
  data, 
  isPositive, 
  timeRange,
  onTimeRangeChange
}: InteractiveChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = React.useState(280);
  const chartRef = useRef<View>(null);
  
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
    minPrice = Math.floor(Math.min(...prices) * 0.98);
    maxPrice = Math.ceil(Math.max(...prices) * 1.02);
    
    const priceRange = maxPrice - minPrice || 1;
    const availableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    
    data.forEach((item, index) => {
      const xPercent = data.length > 1 ? index / (data.length - 1) : 0.5;
      const xPos = PADDING_LEFT + xPercent * chartWidth;
      const yPos = PADDING_TOP + ((maxPrice - item.price) / priceRange) * availableHeight;
      points.push({ x: xPos, y: yPos, price: item.price, date: item.date });
    });
  }

  const selectedPoint = hoverIndex !== null ? points[hoverIndex] : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const wrapper = document.getElementById('chart-interactive-area');
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

  return (
    <View style={styles.container}>
      <View style={styles.card}>
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

        <View ref={chartRef} style={styles.chartBox}>
          {selectedPoint && (
            <View style={[styles.tooltip, { left: selectedPoint.x - 40 }]}>
              <Text style={styles.tooltipPrice}>${selectedPoint.price.toFixed(2)}</Text>
              <Text style={styles.tooltipDate}>{formatDate(selectedPoint.date, timeRange)}</Text>
            </View>
          )}

          <View 
            id="chart-interactive-area"
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
              <Text style={styles.axisLabel}>${maxPrice}</Text>
              <Text style={styles.axisLabel}>${Math.round((maxPrice + minPrice) / 2)}</Text>
              <Text style={styles.axisLabel}>${minPrice}</Text>
            </View>

            <View style={styles.grid}>
              {[0, 25, 50, 75, 100].map((pos, i) => (
                <View key={i} style={[styles.gridLine, { top: `${pos}%` }]} />
              ))}
            </View>

            <View style={[styles.chartContent, { left: PADDING_LEFT, width: chartWidth }]}>
              {points.map((p, i) => {
                if (i === points.length - 1) return null;
                const nextP = points[i + 1];
                const width = nextP.x - p.x;
                const avgY = (p.y + nextP.y) / 2;
                const bottomY = CHART_HEIGHT - PADDING_BOTTOM;
                return (
                  <View
                    key={`fill-${i}`}
                    style={[
                      styles.areaFill,
                      {
                        left: p.x - PADDING_LEFT,
                        top: avgY - PADDING_TOP,
                        width: width + 1,
                        height: bottomY - (avgY - PADDING_TOP),
                        backgroundColor: color,
                      }
                    ]}
                  />
                );
              })}
              
              {points.slice(0, -1).map((p, i) => {
                const np = points[i + 1];
                const dx = np.x - p.x;
                const dy = np.y - p.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <View
                    key={i}
                    style={[
                      styles.lineSegment,
                      {
                        left: p.x - PADDING_LEFT,
                        top: p.y - PADDING_TOP,
                        width: len,
                        backgroundColor: color,
                        transform: [{ rotate: `${angle}deg` }],
                      }
                    ]}
                  />
                );
              })}

              {points.map((p, i) => {
                const isSelected = i === hoverIndex;
                return (
                  <View
                    key={i}
                    style={[
                      styles.pointWrapper,
                      {
                        left: p.x - PADDING_LEFT - 6,
                        top: p.y - PADDING_TOP - 6,
                      }
                    ]}
                  >
                    <View style={[
                      styles.pointDot,
                      { 
                        backgroundColor: isSelected ? color : 'transparent',
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
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
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