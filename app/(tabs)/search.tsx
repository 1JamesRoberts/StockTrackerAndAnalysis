import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useStockSearch } from '../../lib/hooks/useStock';
import { useWatchlistStore } from '../../lib/store/watchlist';
import { SearchInput } from '../../components/SearchInput';
import { SearchResultItem } from '../../components/SearchResultItem';
import { StockSearchResult } from '../../lib/types';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useStockSearch(query);
  const { addStock, removeStock, isInWatchlist } = useWatchlistStore();
  
  const handleStockPress = (result: StockSearchResult) => {
    router.push(`/stock/${result.symbol}`);
  };
  
  const handleToggleWatchlist = (result: StockSearchResult) => {
    if (isInWatchlist(result.symbol)) {
      removeStock(result.symbol);
    } else {
      addStock(result.symbol, result.name);
    }
  };
  
  const renderItem = ({ item }: { item: StockSearchResult }) => (
    <SearchResultItem
      result={item}
      onPress={() => handleStockPress(item)}
      isInWatchlist={isInWatchlist(item.symbol)}
      onToggleWatchlist={() => handleToggleWatchlist(item)}
    />
  );
  
  return (
    <View style={styles.container}>
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by symbol or company name..."
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
      
      {!isLoading && query.length > 0 && results && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No stocks found for "{query}"</Text>
        </View>
      )}
      
      {!isLoading && results && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.symbol}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {!query && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>
            Try searching for stocks like AAPL, GOOGL, MSFT, TSLA, or NVDA
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  list: {
    paddingVertical: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  hintIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
});