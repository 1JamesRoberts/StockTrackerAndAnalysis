import React, { createElement, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerInputProps {
  label: string;
  date: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
}

export function DatePickerInput({ label, date, onChange, maxDate = new Date() }: DatePickerInputProps) {
  const [show, setShow] = useState(false);

  const formatDateDisplay = (d: Date) => {
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'web' ? (
        createElement('input', {
          type: 'date',
          value: date.toISOString().split('T')[0],
          onChange: (e: any) => {
            if (e.target.value) onChange(new Date(e.target.value));
          },
          style: {
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #E5E5EA',
            fontSize: '16px',
            backgroundColor: '#FAFAFA',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
            onPress={() => setShow(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
          </TouchableOpacity>
          {show && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') setShow(false);
                if (selectedDate) onChange(selectedDate);
              }}
              maximumDate={maxDate}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
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
});
