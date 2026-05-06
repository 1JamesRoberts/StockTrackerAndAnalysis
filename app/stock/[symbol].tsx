import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import { useStockQuote, useChartData } from '../../lib/hooks/useStock';
import { useWatchlistStore } from '../../lib/store/watchlist';
import { InteractiveChart } from '../../components/InteractiveChart';
import { TimeRange } from '../../lib/types';

export default function StockDetailsScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const { data: quote, isLoading: quoteLoading } = useStockQuote(symbol);
  const { data: chartData, isLoading: chartLoading } = useChartData(symbol, timeRange);
  const { isInWatchlist, addStock, removeStock } = useWatchlistStore();
  
  const inWatchlist = symbol ? isInWatchlist(symbol) : false;
  
  const handleToggleWatchlist = () => {
    if (!quote) return;
    if (inWatchlist) {
      removeStock(symbol);
    } else {
      addStock(symbol, quote.name);
    }
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };
  
  const isPositive = quote ? quote.change >= 0 : true;
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerTitle: quote ? quote.symbol : 'Loading...',
          headerLeft: router.canGoBack() ? undefined : (props) => (
            <HeaderBackButton 
              {...props}
              tintColor="#007AFF"
              onPress={() => router.replace('/')} 
            />
          ),
          headerRight: () => quote ? (
            <TouchableOpacity onPress={handleToggleWatchlist} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, inWatchlist && styles.addedText]}>
                {inWatchlist ? '✓ Added' : '+ Add'}
              </Text>
            </TouchableOpacity>
          ) : null,
        }} 
      />
      {quoteLoading || !quote ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.priceCard}>
            <Text style={styles.symbolText}>{quote.symbol}</Text>
            <Text style={styles.companyName}>{quote.name}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>${quote.price.toFixed(2)}</Text>
            </View>
            
            <View style={[
              styles.changeContainer,
              isPositive ? styles.positiveBg : styles.negativeBg
            ]}>
              <Text style={[
                styles.changeText,
                isPositive ? styles.positiveText : styles.negativeText
              ]}>
                {isPositive ? '▲' : '▼'} ${Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.changePercent).toFixed(2)}%)
              </Text>
            </View>
          </View>
          
          <InteractiveChart 
            data={chartData || []}
            isPositive={isPositive}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
          
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Open</Text>
                <Text style={styles.statValue}>${quote.open.toFixed(2)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>High</Text>
                <Text style={styles.statValue}>${quote.high.toFixed(2)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Low</Text>
                <Text style={styles.statValue}>${quote.low.toFixed(2)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Prev Close</Text>
                <Text style={styles.statValue}>${quote.previousClose.toFixed(2)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Volume</Text>
                <Text style={styles.statValue}>{(quote.volume / 1000000).toFixed(2)}M</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  addedText: {
    color: '#00C853',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  symbolText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  companyName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  changeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  positiveBg: {
    backgroundColor: '#E8F5E9',
  },
  negativeBg: {
    backgroundColor: '#FFEBEE',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveText: {
    color: '#00C853',
  },
  negativeText: {
    color: '#FF5252',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});