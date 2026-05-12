import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { usePortfolioStore } from '../lib/store/portfolio';
import { useRouter, Stack } from 'expo-router';
import { TransactionRecord } from '../lib/types';
import { useState } from 'react';
import { EditTransactionModal } from '../components/EditTransactionModal';

export default function TransactionsScreen() {
  const { transactions, deleteTransaction } = usePortfolioStore();
  const router = useRouter();
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);

  // Sort transactions by date descending, then id (or just reverse array to keep it simple, assuming chronological adds)
  const sortedTransactions = [...transactions].sort((a, b) => {
    // If same date, sort by ID to maintain stable order
    if (a.date === b.date) {
      return b.id.localeCompare(a.id);
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totalRealizedGain = transactions.reduce((acc, t) => acc + (t.realizedGain || 0), 0);

  const renderHeader = () => {
    if (transactions.length === 0) return null;
    
    const isPositive = totalRealizedGain >= 0;
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Realized Profit/Loss</Text>
        <Text style={[styles.summaryValue, isPositive ? styles.gainPositive : styles.gainNegative]}>
          {isPositive ? '+' : ''}${totalRealizedGain.toFixed(2)}
        </Text>
      </View>
    );
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this transaction record? This will not affect your current portfolio holdings.');
      if (confirmed) deleteTransaction(id);
    } else {
      Alert.alert(
        'Delete Transaction',
        'Are you sure you want to delete this transaction record? This will not affect your current portfolio holdings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) }
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: TransactionRecord }) => {
    const isBuy = item.type === 'BUY';
    const totalValue = item.shares * item.price;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadgeContainer}>
            <View style={[styles.typeBadge, isBuy ? styles.badgeBuy : styles.badgeSell]}>
              <Text style={[styles.typeText, isBuy ? styles.textBuy : styles.textSell]}>
                {item.type}
              </Text>
            </View>
            <Text style={styles.date}>{item.date}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.symbol}>{item.symbol}</Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Shares</Text>
            <Text style={styles.detailValue}>{item.shares}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>${item.price.toFixed(2)}</Text>
          </View>
          <View style={[styles.detailItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>${totalValue.toFixed(2)}</Text>
          </View>
        </View>

        {!isBuy && item.realizedGain !== undefined && (
          <View style={styles.gainRow}>
            <Text style={styles.gainLabel}>Realized Gain/Loss:</Text>
            <Text style={[styles.gainValue, item.realizedGain >= 0 ? styles.gainPositive : styles.gainNegative]}>
              {item.realizedGain >= 0 ? '+' : ''}${item.realizedGain.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => setSelectedTransaction(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerTitle: 'Transaction Ledger',
          headerShown: true,
        }} 
      />

      {sortedTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptySubtitle}>Your trade history will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <EditTransactionModal 
        visible={!!selectedTransaction}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
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
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeBuy: {
    backgroundColor: '#E8F5E9',
  },
  badgeSell: {
    backgroundColor: '#FFEBEE',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textBuy: {
    color: '#34C759',
  },
  textSell: {
    color: '#FF3B30',
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  gainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  gainLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  gainValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  gainPositive: {
    color: '#34C759',
  },
  gainNegative: {
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
