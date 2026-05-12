import React, { useState, useEffect, createElement } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PortfolioItem } from '../lib/types';
import { usePortfolioStore } from '../lib/store/portfolio';

interface ManagePositionModalProps {
  visible: boolean;
  item: PortfolioItem | null;
  currentPrice?: number;
  onClose: () => void;
}

export function ManagePositionModal({ visible, item, currentPrice, onClose }: ManagePositionModalProps) {
  const { updateStock, sellStock, removeStock } = usePortfolioStore();
  const [mode, setMode] = useState<'EDIT' | 'SELL'>('EDIT');

  // Edit State
  const [editShares, setEditShares] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // Sell State
  const [sellSharesAmount, setSellSharesAmount] = useState('');
  const [sellPriceAmount, setSellPriceAmount] = useState('');
  const [sellDate, setSellDate] = useState(new Date());
  const [showSellDatePicker, setShowSellDatePicker] = useState(false);

  const formatDateDisplay = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  useEffect(() => {
    if (item && visible) {
      setEditShares(item.shares.toString());
      setEditPrice(item.buyPrice.toString());
      setEditDate(new Date(item.buyDate));
      
      setSellSharesAmount(item.shares.toString());
      
      // Default to current market price if available, otherwise buy price
      const defaultSellPrice = currentPrice || item.buyPrice;
      setSellPriceAmount(defaultSellPrice.toString());
      
      setSellDate(new Date());
      setMode('EDIT');
    }
  }, [visible, item?.id]);

  if (!item) return null;

  const handleEditSubmit = () => {
    const s = parseFloat(editShares);
    const p = parseFloat(editPrice);
    const dateString = editDate.toISOString().split('T')[0];

    if (isNaN(s) || s <= 0 || isNaN(p) || p <= 0 || !dateString) {
      if (Platform.OS === 'web') {
        window.alert('Please enter valid numbers for shares and price, and a valid date.');
      } else {
        Alert.alert('Invalid Input', 'Please enter valid numbers for shares and price, and a valid date.');
      }
      return;
    }
    updateStock(item.id, { shares: s, buyPrice: p, buyDate: dateString });
    onClose();
  };

  const handleSellSubmit = () => {
    const s = parseFloat(sellSharesAmount);
    const p = parseFloat(sellPriceAmount);
    const dateString = sellDate.toISOString().split('T')[0];

    if (isNaN(s) || s <= 0 || isNaN(p) || p <= 0 || !dateString) {
      if (Platform.OS === 'web') {
        window.alert('Please enter valid numbers for shares and price, and a valid date.');
      } else {
        Alert.alert('Invalid Input', 'Please enter valid numbers for shares and price, and a valid date.');
      }
      return;
    }
    if (s > item.shares) {
      if (Platform.OS === 'web') {
        window.alert('You cannot sell more shares than you own.');
      } else {
        Alert.alert('Invalid Input', 'You cannot sell more shares than you own.');
      }
      return;
    }
    sellStock(item.id, s, p, dateString);
    onClose();
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this position? This will not delete the associated transactions.');
      if (confirmed) {
        removeStock(item.id);
        onClose();
      }
    } else {
      Alert.alert(
        'Delete Position',
        'Are you sure you want to delete this position? This will not delete the associated transactions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              removeStock(item.id);
              onClose();
            }
          }
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage {item.symbol}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, mode === 'EDIT' && styles.activeTab]}
              onPress={() => setMode('EDIT')}
            >
              <Text style={[styles.tabText, mode === 'EDIT' && styles.activeTabText]}>Edit Position</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, mode === 'SELL' && styles.activeTab]}
              onPress={() => setMode('SELL')}
            >
              <Text style={[styles.tabText, mode === 'SELL' && styles.activeTabText]}>Sell Shares</Text>
            </TouchableOpacity>
          </View>

          {mode === 'EDIT' ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shares Owned</Text>
                <TextInput
                  style={styles.input}
                  value={editShares}
                  onChangeText={setEditShares}
                  keyboardType="numeric"
                  placeholder="e.g. 10"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Average Cost ($)</Text>
                <TextInput
                  style={styles.input}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 150.50"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Purchase Date</Text>
                {Platform.OS === 'web' ? (
                  createElement('input', {
                    type: 'date',
                    value: editDate.toISOString().split('T')[0],
                    onChange: (e: any) => {
                      if (e.target.value) setEditDate(new Date(e.target.value));
                    },
                    style: { 
                      padding: '16px', 
                      borderRadius: '12px', 
                      border: '1px solid #E5E5EA', 
                      fontSize: '16px', 
                      backgroundColor: '#FAFAFA', 
                      fontFamily: 'inherit', 
                      width: '100%', 
                      boxSizing: 'border-box',
                      color: '#1C1C1E',
                      outline: 'none'
                    }
                  })
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.dateSelector} 
                      onPress={() => setShowEditDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dateText}>
                        {formatDateDisplay(editDate)}
                      </Text>
                    </TouchableOpacity>
                    {showEditDatePicker && (
                      <DateTimePicker
                        value={editDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        onChange={(event, date) => {
                          if (Platform.OS === 'android') setShowEditDatePicker(false);
                          if (date) setEditDate(date);
                        }}
                        maximumDate={new Date()}
                      />
                    )}
                  </>
                )}
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleEditSubmit}>
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shares to Sell (Max: {item.shares})</Text>
                <TextInput
                  style={styles.input}
                  value={sellSharesAmount}
                  onChangeText={setSellSharesAmount}
                  keyboardType="numeric"
                  placeholder="e.g. 5"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sell Price ($)</Text>
                <TextInput
                  style={styles.input}
                  value={sellPriceAmount}
                  onChangeText={setSellPriceAmount}
                  keyboardType="numeric"
                  placeholder="e.g. 160.00"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sell Date</Text>
                {Platform.OS === 'web' ? (
                  createElement('input', {
                    type: 'date',
                    value: sellDate.toISOString().split('T')[0],
                    onChange: (e: any) => {
                      if (e.target.value) setSellDate(new Date(e.target.value));
                    },
                    style: { 
                      padding: '16px', 
                      borderRadius: '12px', 
                      border: '1px solid #E5E5EA', 
                      fontSize: '16px', 
                      backgroundColor: '#FAFAFA', 
                      fontFamily: 'inherit', 
                      width: '100%', 
                      boxSizing: 'border-box',
                      color: '#1C1C1E',
                      outline: 'none'
                    }
                  })
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.dateSelector} 
                      onPress={() => setShowSellDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dateText}>
                        {formatDateDisplay(sellDate)}
                      </Text>
                    </TouchableOpacity>
                    {showSellDatePicker && (
                      <DateTimePicker
                        value={sellDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        onChange={(event, date) => {
                          if (Platform.OS === 'android') setShowSellDatePicker(false);
                          if (date) setSellDate(date);
                        }}
                        maximumDate={new Date()}
                      />
                    )}
                  </>
                )}
              </View>
              
              <TouchableOpacity style={styles.submitButton} onPress={handleSellSubmit}>
                <Text style={styles.submitButtonText}>Confirm Sale</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#8E8E93',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#1C1C1E',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FAFAFA',
  },
  dateSelector: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  dateText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
