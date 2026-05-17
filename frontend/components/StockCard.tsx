import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StockQuote } from '../lib/types';

interface StockCardProps {
  stock: StockQuote;
  onPress: () => void;
}

export function StockCard({ stock, onPress }: StockCardProps) {
  const isPositive = stock.change >= 0;
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <Text style={styles.symbol}>{stock.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>{stock.name}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.price}>${stock.price.toFixed(2)}</Text>
        <View style={[styles.changeContainer, isPositive ? styles.positive : styles.negative]}>
          <Text style={[styles.change, isPositive ? styles.positiveText : styles.negativeText]}>
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  name: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    maxWidth: 150,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  changeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  positive: {
    backgroundColor: '#E8F5E9',
  },
  negative: {
    backgroundColor: '#FFEBEE',
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveText: {
    color: '#34C759',
  },
  negativeText: {
    color: '#FF3B30',
  },
});