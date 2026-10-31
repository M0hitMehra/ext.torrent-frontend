import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Platform, Animated, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const { width: W } = Dimensions.get('window');
const isTV = Platform.isTV;

// TV-style on-screen keyboard (YouTube TV style)
const TV_KEYBOARD_ROWS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['a','b','c','d','e','f','g','h','i','j'],
  ['k','l','m','n','o','p','q','r','s','t'],
  ['u','v','w','x','y','z','.','-','_','⌫'],
  ['SPACE', 'CLEAR', 'SEARCH'],
];

function TVKey({ label, onPress }) {
  const [focused, setFocused] = useState(false);
  const isWide = ['SPACE','CLEAR','SEARCH'].includes(label);
  return (
    <TouchableOpacity
      style={[styles.key, isWide && styles.keyWide, focused && styles.keyFocused]}
      onPress={() => onPress(label)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      activeOpacity={0.7}
    >
      <Text style={[styles.keyText, label === 'SEARCH' && styles.keySearch]}>
        {label === 'SPACE' ? '⎵ Space' : label === '⌫' ? '⌫' : label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

export function TVKeyboard({ visible, onClose, onSearch }) {
  const [text, setText] = useState('');

  const handleKey = useCallback((key) => {
    if (key === '⌫') {
      setText(t => t.slice(0, -1));
    } else if (key === 'SPACE') {
      setText(t => t + ' ');
    } else if (key === 'CLEAR') {
      setText('');
    } else if (key === 'SEARCH') {
      if (text.trim()) { onSearch(text.trim()); onClose(); setText(''); }
    } else {
      setText(t => t + key);
    }
  }, [text, onSearch, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.keyboard}>
          {/* Display */}
          <View style={styles.display}>
            <Text style={styles.displayText} numberOfLines={1}>
              {text || 'Start typing...'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Keys */}
          {TV_KEYBOARD_ROWS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((key) => (
                <TVKey key={key} label={key} onPress={handleKey} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  keyboard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  displayText: {
    flex: 1,
    color: COLORS.text,
    fontSize: isTV ? 22 : 18,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
  },
  key: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: isTV ? 12 : 9,
    paddingHorizontal: isTV ? 14 : 10,
    minWidth: isTV ? 52 : 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keyWide: {
    paddingHorizontal: 20,
    flex: 1,
    maxWidth: 160,
  },
  keyFocused: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.08 }],
  },
  keyText: {
    color: COLORS.text,
    fontSize: isTV ? 15 : 13,
    fontWeight: '600',
  },
  keySearch: {
    color: '#fff',
    fontWeight: '800',
  },
});
