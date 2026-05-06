import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StockSearchResult } from '../lib/types';

interface SearchResultItemProps {
  result: StockSearchResult;
  onPress: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
}

export function SearchResultItem({ result, onPress, isInWatchlist, onToggleWatchlist }: SearchResultItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.symbol}>{result.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>{result.name}</Text>
        <Text style={styles.type}>{result.type} • {result.region}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.addButton, isInWatchlist && styles.addedButton]} 
        onPress={onToggleWatchlist}
      >
        <Text style={[styles.addButtonText, isInWatchlist && styles.addedButtonText]}>
          {isInWatchlist ? '✓ Added' : '+ Add'}
        </Text>
      </TouchableOpacity>
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
  info: {
    flex: 1,
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
    maxWidth: 200,
  },
  type: {
    fontSize: 12,
    color: '#AEAEB2',
    marginTop: 4,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  addedButton: {
    backgroundColor: '#34C759',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addedButtonText: {
    color: '#FFFFFF',
  },
});