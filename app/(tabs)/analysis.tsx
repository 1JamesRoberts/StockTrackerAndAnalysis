import { View, Text, StyleSheet, ScrollView, RefreshControl, Linking, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { usePortfolioStore } from '../../lib/store/portfolio';
import { useMultipleStockHistory, useNews } from '../../lib/hooks/useStock';
import { buildCorrelationMatrix } from '../../lib/utils/math';
import { NewsArticle } from '../../lib/types';

export default function AnalysisScreen() {
  const { items } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  
  const uniqueSymbols = useMemo(() => Array.from(new Set(items.map(item => item.symbol))), [items]);
  
  const historyQueries = useMultipleStockHistory(uniqueSymbols, '1Y');
  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useNews();

  const onRefresh = () => {
    setRefreshing(true);
    historyQueries.forEach(query => query.refetch());
    refetchNews();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const historyMap = useMemo(() => {
    const map: Record<string, any> = {};
    uniqueSymbols.forEach((symbol, index) => {
      if (historyQueries[index].data) {
        map[symbol] = historyQueries[index].data;
      }
    });
    return map;
  }, [uniqueSymbols, historyQueries]);

  const pricesMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    Object.keys(historyMap).forEach(symbol => {
      const sorted = [...historyMap[symbol]].sort((a, b) => a.date.localeCompare(b.date));
      map[symbol] = sorted.map(h => h.close);
    });
    return map;
  }, [historyMap]);

  const correlationMatrix = useMemo(() => {
    if (uniqueSymbols.length < 2) return [];
    return buildCorrelationMatrix(uniqueSymbols, pricesMap);
  }, [uniqueSymbols, pricesMap]);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Data</Text>
        <Text style={styles.emptySubtitle}>Add stocks to your portfolio to unlock analysis.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Correlation Matrix</Text>
        {correlationMatrix.length > 0 ? (
          <View style={styles.matrixContainer}>
            <View style={styles.matrixRow}>
              <Text style={styles.matrixCellHeader}></Text>
              {uniqueSymbols.map(sym => <Text key={sym} style={styles.matrixCellHeader}>{sym}</Text>)}
            </View>
            {correlationMatrix.map((row, i) => (
              <View key={i} style={styles.matrixRow}>
                <Text style={styles.matrixCellHeader}>{uniqueSymbols[i]}</Text>
                {row.map((val, j) => {
                  const color = val > 0.7 ? '#FFEBEE' : val < 0 ? '#E8F5E9' : '#F5F5F5';
                  return (
                    <View key={j} style={[styles.matrixCell, { backgroundColor: color }]}>
                      <Text style={styles.matrixCellText}>{val.toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholderText}>Add at least 2 stocks to see correlation.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market News</Text>
        {newsLoading ? (
          <Text style={styles.placeholderText}>Loading news...</Text>
        ) : newsData && newsData.length > 0 ? (
          newsData.slice(0, 5).map((article: NewsArticle) => (
            <TouchableOpacity 
              key={article.id} 
              style={styles.newsCard}
              onPress={() => Linking.openURL(article.url)}
            >
              <Text style={styles.newsSource}>{article.source}</Text>
              <Text style={styles.newsHeadline}>{article.headline}</Text>
              <Text style={styles.newsSummary} numberOfLines={2}>{article.summary}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.placeholderText}>No news available.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  section: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  placeholderText: { color: '#8E8E93', fontStyle: 'italic', textAlign: 'center', padding: 16 },
  matrixContainer: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, overflow: 'hidden' },
  matrixRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  matrixCellHeader: { flex: 1, padding: 8, fontWeight: '600', backgroundColor: '#FAFAFA', textAlign: 'center', fontSize: 12 },
  matrixCell: { flex: 1, padding: 8, justifyContent: 'center', alignItems: 'center' },
  matrixCellText: { fontSize: 12 },
  newsCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  newsSource: { fontSize: 12, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  newsHeadline: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  newsSummary: { fontSize: 14, color: '#666', lineHeight: 20 },
});
