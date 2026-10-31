/**
 * TVKeyboard.js
 * High-contrast Neumorphic on-screen keyboard for TV remote control.
 * Styled after YouTube TV with audio-haptic feedback, autofocus, and luminous key states.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus, playTVSelectFeedback } from '../hooks';

const isTV = Platform.isTV;

const TV_KEYBOARD_ROWS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['a','b','c','d','e','f','g','h','i','j'],
  ['k','l','m','n','o','p','q','r','s','t'],
  ['u','v','w','x','y','z','.','-','_','⌫'],
  ['SPACE', 'CLEAR', 'SEARCH'],
];

function TVKey({ label, onPress, isFirst }) {
  const { focused, onFocus, onBlur } = useTVFocus();
  const isWide = ['SPACE','CLEAR','SEARCH'].includes(label);
  const isSearch = label === 'SEARCH';

  const handlePress = () => {
    playTVSelectFeedback();
    onPress(label);
  };

  return (
    <TouchableOpacity
      hasTVPreferredFocus={isFirst}
      style={[
        styles.key,
        isWide && styles.keyWide,
        isSearch && styles.keySearch,
        focused && styles.keyFocused,
      ]}
      onPress={handlePress}
      onFocus={onFocus}
      onBlur={onBlur}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.keyText,
          isSearch && styles.keySearchText,
          focused && styles.keyTextFocused,
        ]}
      >
        {label === 'SPACE' ? '⎵ Space' : label === '⌫' ? '⌫ Back' : label.toUpperCase()}
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
      if (text.trim()) {
        onSearch(text.trim());
        onClose();
        setText('');
      }
    } else {
      setText(t => t + key);
    }
  }, [text, onSearch, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.keyboardContainer}>
          {/* Display & Pointer Status */}
          <View style={styles.displayRow}>
            <View style={styles.inputPill}>
              <MaterialIcons name="search" size={22} color={COLORS.primaryGlow} />
              <Text style={[styles.displayText, !text && styles.displayTextPlaceholder]} numberOfLines={1}>
                {text || 'Type with TV Remote D-Pad...'}
              </Text>
              {text.length > 0 && (
                <TouchableOpacity onPress={() => setText('')} style={styles.clearMiniBtn}>
                  <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Keyboard Keys */}
          <View style={styles.keysWrap}>
            {TV_KEYBOARD_ROWS.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((key, ki) => (
                  <TVKey
                    key={key}
                    label={key}
                    isFirst={ri === 0 && ki === 0}
                    onPress={handleKey}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 10, 15, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboardContainer: {
    width: isTV ? '80%' : '100%',
    maxWidth: 720,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.input,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  displayText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: isTV ? 20 : 16,
    fontWeight: '700',
  },
  displayTextPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  clearMiniBtn: {
    padding: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardHighlight,
  },
  keysWrap: {
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  key: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: isTV ? 12 : 9,
    paddingHorizontal: isTV ? 16 : 10,
    minWidth: isTV ? 52 : 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  keyWide: {
    paddingHorizontal: 22,
    flex: 1,
    maxWidth: 160,
  },
  keySearch: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryGlow,
  },
  keyFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.15 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 16,
  },
  keyText: {
    color: COLORS.text,
    fontSize: isTV ? 15 : 13,
    fontWeight: '700',
  },
  keyTextFocused: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  keySearchText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
