import { View, Text, FlatList, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { usePortfolioStore } from '../../lib/store/portfolio';
import { useMultipleStockQuotes } from '../../lib/hooks/useStock';
import { PortfolioCard } from '../../components/PortfolioCard';
import { PortfolioItem } from '../../lib/types';

export default function PortfolioScreen() {
  const router = useRouter();
  const { items } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // Extract unique symbols to fetch quotes
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set(items.map(item => item.symbol));
    return Array.from(symbols);
  }, [items]);

  const quoteQueries = useMultipleStockQuotes(uniqueSymbols);
  
  const onRefresh = () => {
    setRefreshing(true);
    quoteQueries.forEach(query => query.refetch());
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const handleStockPress = (symbol: string) => {
    router.push(`/stock/${symbol}`);
  };

  // Create a map of symbol -> quote for easy lookup
  const quotesMap = useMemo(() => {
    const map: Record<string, any> = {};
    uniqueSymbols.forEach((symbol, index) => {
      if (quoteQueries[index].data) {
        map[symbol] = quoteQueries[index].data;
      }
    });
    return map;
  }, [uniqueSymbols, quoteQueries]);

  // Calculate Portfolio Metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let dailyChangeValue = 0;

    items.forEach(item => {
      const quote = quotesMap[item.symbol];
      if (quote) {
        totalValue += quote.price * item.shares;
        dailyChangeValue += quote.change * item.shares;
      }
      totalCost += item.buyPrice * item.shares;
    });

    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const dailyReturnPercent = (totalValue - dailyChangeValue) > 0 ? (dailyChangeValue / (totalValue - dailyChangeValue)) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalReturn,
      totalReturnPercent,
      dailyChangeValue,
      dailyReturnPercent
    };
  }, [items, quotesMap]);
  
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💼</Text>
        <Text style={styles.emptyTitle}>Empty Portfolio</Text>
        <Text style={styles.emptySubtitle}>
          Search for stocks and add positions to start tracking your wealth.
        </Text>
      </View>
    );
  }

  const renderHeader = () => {
    const isTotalPositive = metrics.totalReturn >= 0;
    const isDailyPositive = metrics.dailyChangeValue >= 0;

    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Portfolio Value</Text>
        <Text style={styles.totalValue}>${metrics.totalValue.toFixed(2)}</Text>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Return</Text>
            <Text style={[styles.metricValue, isTotalPositive ? styles.positiveText : styles.negativeText]}>
              {isTotalPositive ? '+' : ''}${metrics.totalReturn.toFixed(2)}
            </Text>
            <Text style={[styles.metricPercent, isTotalPositive ? styles.positiveText : styles.negativeText]}>
              {isTotalPositive ? '▲' : '▼'} {Math.abs(metrics.totalReturnPercent).toFixed(2)}%
            </Text>
          </View>
          
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Today's Return</Text>
            <Text style={[styles.metricValue, isDailyPositive ? styles.positiveText : styles.negativeText]}>
              {isDailyPositive ? '+' : ''}${metrics.dailyChangeValue.toFixed(2)}
            </Text>
            <Text style={[styles.metricPercent, isDailyPositive ? styles.positiveText : styles.negativeText]}>
              {isDailyPositive ? '▲' : '▼'} {Math.abs(metrics.dailyReturnPercent).toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PortfolioCard 
            item={item} 
            quote={quotesMap[item.symbol]}
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
    paddingVertical: 16,
  },
  headerContainer: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 16,
    color: '#EBEBF5',
    opacity: 0.8,
  },
  totalValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#EBEBF5',
    opacity: 0.6,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricPercent: {
    fontSize: 14,
    fontWeight: '500',
  },
  positiveText: {
    color: '#34C759',
  },
  negativeText: {
    color: '#FF3B30',
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