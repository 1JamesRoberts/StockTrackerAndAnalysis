import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

export interface PieChartData {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

export function PieChartWidget({ data, size = 150, title }: { data: PieChartData[], size?: number, title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  const radius = size / 2;
  const center = size / 2;

  // Filter out 0 value items
  const validData = data.filter(d => d.value > 0);

  const paths = validData.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    if (angle >= 359.9) {
      return (
        <G key={index}>
          <Path
            d={`M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius} Z`}
            fill={item.color}
          />
        </G>
      );
    }

    const d = `
      M ${center} ${center}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;

    return <Path key={index} d={d} fill={item.color} />;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {total > 0 ? (
        <View style={styles.content}>
          <Svg width={size} height={size}>
            {paths}
          </Svg>
          
          <View style={styles.legendContainer}>
            {validData.map((item, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={styles.legendText}>
                  <Text style={styles.legendLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.legendValue}>
                    ${item.value.toFixed(2)} ({(item.value / total * 100).toFixed(1)}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.emptyChart, { width: size, height: size, borderRadius: size/2 }]}>
          <Text style={styles.emptyText}>No data</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginLeft: 16,
    gap: 8,
    flexShrink: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  legendText: {
    flexShrink: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  legendValue: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyChart: {
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyText: {
    color: '#8E8E93',
  }
});
