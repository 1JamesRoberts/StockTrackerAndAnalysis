import React, { useState, createElement } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddPortfolioItemModalProps {
  visible: boolean;
  symbol: string;
  name: string;
  onClose: () => void;
  onAdd: (shares: number, buyPrice: number, buyDate: string) => void;
}

export function AddPortfolioItemModal({ visible, symbol, name, onClose, onAdd }: AddPortfolioItemModalProps) {
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDateDisplay = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const handleAdd = () => {
    const parsedShares = parseFloat(shares);
    const parsedPrice = parseFloat(buyPrice);
    const dateString = buyDate.toISOString().split('T')[0];

    if (isNaN(parsedShares) || isNaN(parsedPrice) || !dateString) {
      if (Platform.OS === 'web') {
        window.alert('Please enter valid details');
      } else {
        alert('Please enter valid details');
      }
      return;
    }

    onAdd(parsedShares, parsedPrice, dateString);
    setShares('');
    setBuyPrice('');
    setBuyDate(new Date());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add {symbol} to Portfolio</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.companyName}>{name}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shares</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              keyboardType="numeric"
              value={shares}
              onChangeText={setShares}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Buy Price ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150.50"
              keyboardType="numeric"
              value={buyPrice}
              onChangeText={setBuyPrice}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Buy Date</Text>
            {Platform.OS === 'web' ? (
              createElement('input', {
                type: 'date',
                value: buyDate.toISOString().split('T')[0],
                onChange: (e: any) => {
                  if (e.target.value) setBuyDate(new Date(e.target.value));
                },
                style: { 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid #E5E5EA', 
                  fontSize: '16px', 
                  backgroundColor: '#F9F9F9', 
                  fontFamily: 'inherit', 
                  width: '100%', 
                  boxSizing: 'border-box',
                  color: '#1A1A1A',
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
                    {formatDateDisplay(buyDate)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={buyDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (date) setBuyDate(date);
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Position</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeText: {
    fontSize: 24,
    color: '#666666',
  },
  companyName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  dateSelector: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
