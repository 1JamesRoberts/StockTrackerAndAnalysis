import { View, StyleSheet, Text } from 'react-native';
import { StockHistory } from '../lib/types';

interface MiniChartProps {
  data: StockHistory[];
  isPositive: boolean;
  height?: number;
}

export function MiniChart({ data, isPositive, height = 80 }: MiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noData}>No chart data</Text>
      </View>
    );
  }

  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const padding = 8;
  const chartHeight = height - padding * 2;

  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * 100;
    const y = padding + ((maxPrice - price) / range) * chartHeight;
    return { x, y };
  });

  const svgWidth = 300;
  const svgHeight = height;
  const svgPoints = points.map(p => ({
    x: (p.x / 100) * svgWidth,
    y: p.y
  }));

  let pathD = '';
  svgPoints.forEach((point, i) => {
    if (i === 0) {
      pathD += `M ${point.x} ${point.y}`;
    } else {
      pathD += ` L ${point.x} ${point.y}`;
    }
  });

  const areaPathD = pathD + ` L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  const color = isPositive ? '#34C759' : '#FF3B30';

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.priceLabel}>Last {data.length} days</Text>
      </View>
      <View style={[styles.chartWrapper, { height: chartHeight + 20 }]}>
        <svg width="100%" height={chartHeight + 20} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={areaPathD} fill="url(#gradient)" />
          <path d={pathD} stroke={color} strokeWidth="2" fill="none" />
        </svg>
      </View>
      <View style={styles.footer}>
        <Text style={styles.dateLabel}>{data[0]?.date || ''}</Text>
        <Text style={styles.dateLabel}>{data[data.length - 1]?.date || ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  chartWrapper: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: '#AEAEB2',
  },
  noData: {
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
});