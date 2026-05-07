import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StockQuote, PortfolioItem } from '../lib/types';

interface PortfolioCardProps {
  item: PortfolioItem;
  quote?: StockQuote;
  onPress: () => void;
  onEdit: () => void;
}

export function PortfolioCard({ item, quote, onPress, onEdit }: PortfolioCardProps) {
  const currentPrice = quote?.price || 0;
  const currentValue = currentPrice * item.shares;
  const totalCost = item.buyPrice * item.shares;
  const totalReturn = currentValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
  
  const isPositive = totalReturn >= 0;
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <View style={styles.rightSection}>
          <Text style={styles.price}>${currentValue.toFixed(2)}</Text>
          <Text style={styles.shares}>{item.shares} shares</Text>
        </View>
      </View>
      
      <View style={styles.bottomRow}>
        <View style={styles.costSection}>
          <Text style={styles.label}>Avg Cost</Text>
          <Text style={styles.value}>${item.buyPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.investedSection}>
          <Text style={styles.label}>Invested</Text>
          <Text style={styles.value}>${totalCost.toFixed(2)}</Text>
        </View>
        
        <View style={styles.returnSection}>
          <Text style={styles.label}>Total Return</Text>
          <View style={[styles.changeContainer, isPositive ? styles.positive : styles.negative]}>
            <Text style={[styles.change, isPositive ? styles.positiveText : styles.negativeText]}>
              {isPositive ? '+' : ''}{totalReturn.toFixed(2)} ({totalReturnPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  leftSection: {
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginRight: 12,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
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
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  shares: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  costSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  investedSection: {
    flex: 1,
    alignItems: 'center',
  },
  returnSection: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  changeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
