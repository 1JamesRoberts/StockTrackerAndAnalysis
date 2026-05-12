import React, { useState, useEffect, createElement } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TransactionRecord } from '../lib/types';
import { usePortfolioStore } from '../lib/store/portfolio';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export function EditTransactionModal({ visible, transaction, onClose }: EditTransactionModalProps) {
  const { updateTransaction } = usePortfolioStore();
  
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gain, setGain] = useState('');

  const formatDateDisplay = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  useEffect(() => {
    if (transaction && visible) {
      setShares(transaction.shares.toString());
      setPrice(transaction.price.toString());
      setDate(new Date(transaction.date));
      setGain(transaction.realizedGain?.toString() || '');
    }
  }, [transaction, visible]);

  if (!transaction) return null;

  const handleSubmit = () => {
    const s = parseFloat(shares);
    const p = parseFloat(price);
    const dateString = date.toISOString().split('T')[0];
    const g = gain ? parseFloat(gain) : undefined;

    if (isNaN(s) || s <= 0 || isNaN(p) || p <= 0 || !dateString) {
      if (Platform.OS === 'web') {
        window.alert('Please enter valid numbers for shares and price, and a valid date.');
      } else {
        Alert.alert('Invalid Input', 'Please enter valid numbers for shares and price, and a valid date.');
      }
      return;
    }

    const updates: Partial<TransactionRecord> = {
      shares: s,
      price: p,
      date: dateString,
    };

    if (transaction.type === 'SELL' && g !== undefined) {
      updates.realizedGain = g;
    }

    updateTransaction(transaction.id, updates);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit {transaction.type}: {transaction.symbol}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shares</Text>
              <TextInput
                style={styles.input}
                value={shares}
                onChangeText={setShares}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              {Platform.OS === 'web' ? (
                createElement('input', {
                  type: 'date',
                  value: date.toISOString().split('T')[0],
                  onChange: (e: any) => {
                    if (e.target.value) setDate(new Date(e.target.value));
                  },
                  style: { 
                    padding: '16px', 
                    borderRadius: '12px', 
                    border: '1px solid #E5E5EA', 
                    fontSize: '16px', 
                    color: '#1C1C1E', 
                    backgroundColor: '#FAFAFA', 
                    fontFamily: 'inherit', 
                    width: '100%', 
                    boxSizing: 'border-box',
                    outline: 'none'
                  }
                })
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.dateSelector} 
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dateText}>
                      {formatDateDisplay(date)}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') setShowDatePicker(false);
                        if (selectedDate) setDate(selectedDate);
                      }}
                      maximumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>

            {transaction.type === 'SELL' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Realized Gain/Loss ($)</Text>
                <TextInput
                  style={styles.input}
                  value={gain}
                  onChangeText={setGain}
                  keyboardType="numeric"
                />
              </View>
            )}
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
            
            <Text style={styles.note}>
              Note: This only updates the ledger history. To update your active portfolio holdings, please use the Edit button on the main Dashboard.
            </Text>
          </View>
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
    fontSize: 18,
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
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
