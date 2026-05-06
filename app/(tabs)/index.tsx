import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useWatchlistStore } from '../../lib/store/watchlist';
import { useStockQuote } from '../../lib/hooks/useStock';
import { StockCard } from '../../components/StockCard';
import { StockQuote } from '../../lib/types';

function StockItem({ symbol, onPress }: { symbol: string; onPress: () => void }) {
  const { data: quote, isLoading, refetch } = useStockQuote(symbol);
  const [refreshing, setRefreshing] = useState(false);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading {symbol}...</Text>
      </View>
    );
  }
  
  if (!quote) return null;
  
  return (
    <StockCard 
      stock={quote} 
      onPress={onPress}
    />
  );
}

export default function WatchlistScreen() {
  const router = useRouter();
  const { items } = useWatchlistStore();
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const handleStockPress = (symbol: string) => {
    router.push(`/stock/${symbol}`);
  };
  
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📈</Text>
        <Text style={styles.emptyTitle}>No Stocks Yet</Text>
        <Text style={styles.emptySubtitle}>
          Search for stocks and add them to your watchlist
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => (
          <StockItem 
            symbol={item.symbol} 
            onPress={() => handleStockPress(item.symbol)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
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
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});