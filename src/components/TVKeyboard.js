/**
 * TVKeyboard.js
 * High-contrast on-screen keyboard for TV remote control.
 * Styled after YouTube TV with audio-haptic feedback, autofocus, and luminous key states.
 * Fully navigable via TV Remote D-Pad (Up, Down, Left, Right, Select, Back).
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet,
  Modal, Platform, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { playTVFocusFeedback, playTVSelectFeedback, useTVRemote } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';

const isTV = Platform.isTV;

const TV_KEYBOARD_ROWS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['a','b','c','d','e','f','g','h','i','j'],
  ['k','l','m','n','o','p','q','r','s','t'],
  ['u','v','w','x','y','z','.','-','_','⌫'],
  ['SPACE', 'CLEAR', 'SEARCH'],
];

function TVKey({ label, onPress, isFocused }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const isWide = ['SPACE','CLEAR','SEARCH'].includes(label);
  const isSearch = label === 'SEARCH';
  const accentColor = (settings.focusColor && settings.focusColor !== '#FFFFFF') ? settings.focusColor : '#FF5722';

  const handlePress = () => {
    playTVSelectFeedback();
    onPress(label);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.key,
        {
          backgroundColor: isSearch ? accentColor : theme.card,
          borderColor: isSearch ? accentColor : 'rgba(255, 255, 255, 0.12)',
          borderTopColor: isSearch ? accentColor : 'rgba(255, 255, 255, 0.12)',
          borderBottomColor: isSearch ? accentColor : 'rgba(255, 255, 255, 0.12)',
          borderLeftColor: isSearch ? accentColor : 'rgba(255, 255, 255, 0.12)',
          borderRightColor: isSearch ? accentColor : 'rgba(255, 255, 255, 0.12)',
        },
        isWide && styles.keyWide,
        isSearch && styles.keySearch,
        isFocused && {
          backgroundColor: accentColor,
          borderColor: '#FFFFFF',
          borderTopColor: '#FFFFFF',
          borderBottomColor: '#FFFFFF',
          borderLeftColor: '#FFFFFF',
          borderRightColor: '#FFFFFF',
          borderWidth: 3.5,
          transform: [{ scale: 1.18 }],
          elevation: 20,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 18,
          zIndex: 99,
        },
      ]}
    >
      <Text
        style={[
          styles.keyText,
          { color: (isFocused || isSearch) ? '#FFFFFF' : theme.text },
          isFocused && { fontWeight: '900', color: '#FFFFFF' },
        ]}
      >
        {label === 'SPACE' ? '⎵ Space' : label === '⌫' ? '⌫ Back' : label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

export function TVKeyboard({ visible, onClose, onSearch }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const [text, setText] = useState('');
  const [focusedRow, setFocusedRow] = useState(1); // default on 'a'
  const [focusedCol, setFocusedCol] = useState(0);
  const accentColor = (settings.focusColor && settings.focusColor !== '#FFFFFF') ? settings.focusColor : '#FF5722';

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

  // Handle hardware TV remote keys inside the keyboard
  useTVRemote((eventType) => {
    if (!visible) return;

    if (eventType === 'up') {
      playTVFocusFeedback();
      setFocusedRow(r => Math.max(0, r - 1));
    } else if (eventType === 'down') {
      playTVFocusFeedback();
      setFocusedRow(r => {
        const nextR = Math.min(TV_KEYBOARD_ROWS.length - 1, r + 1);
        const maxCols = TV_KEYBOARD_ROWS[nextR].length - 1;
        setFocusedCol(c => Math.min(c, maxCols));
        return nextR;
      });
    } else if (eventType === 'left') {
      playTVFocusFeedback();
      setFocusedCol(c => Math.max(0, c - 1));
    } else if (eventType === 'right') {
      playTVFocusFeedback();
      const maxCols = TV_KEYBOARD_ROWS[focusedRow].length - 1;
      setFocusedCol(c => Math.min(maxCols, c + 1));
    } else if (eventType === 'select') {
      playTVSelectFeedback();
      const key = TV_KEYBOARD_ROWS[focusedRow]?.[focusedCol];
      if (key) handleKey(key);
    } else if (eventType === 'back') {
      onClose();
    }
  }, visible);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, settings.mode === 'light' && { backgroundColor: 'rgba(34,47,68,0.28)' }]}>
        <View style={[styles.keyboardContainer, { backgroundColor: theme.surface, borderColor: 'rgba(255,255,255,0.1)' }]}>
          {/* Display & Pointer Status */}
          <View style={styles.displayRow}>
            <View style={[styles.inputPill, { backgroundColor: theme.input, borderColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialIcons name="search" size={24} color={accentColor} />
              <Text style={[styles.displayText, { color: text ? theme.text : theme.textMuted }, !text && styles.displayTextPlaceholder]} numberOfLines={1}>
                {text || 'Type with TV Remote D-Pad...'}
              </Text>
              {text.length > 0 && (
                <TouchableOpacity onPress={() => setText('')} style={styles.clearMiniBtn}>
                  <MaterialIcons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.1)' },
              ]}
            >
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
                    isFocused={ri === focusedRow && ki === focusedCol}
                    onPress={handleKey}
                  />
                ))}
              </View>
            ))}
          </View>
          <Text style={[styles.keyboardHelp, { color: theme.textSub }]}>Use ↑ ↓ ← → to choose a key · Press OK to enter · Choose SEARCH when ready</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 10, 15, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboardContainer: {
    width: isTV ? '85%' : '100%',
    maxWidth: 780,
    backgroundColor: '#111521',
    borderRadius: 24,
    padding: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    marginBottom: 22,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0E121C',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  displayText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: isTV ? 22 : 16,
    fontWeight: '700',
  },
  displayTextPlaceholder: {
    color: '#666B85',
    fontWeight: '500',
  },
  clearMiniBtn: {
    padding: 6,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#171C29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keysWrap: {
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  key: {
    backgroundColor: '#171C29',
    borderRadius: 12,
    paddingVertical: isTV ? 12 : 9,
    paddingHorizontal: isTV ? 16 : 10,
    minWidth: isTV ? 54 : 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  keyWide: {
    paddingHorizontal: 24,
    flex: 1,
    maxWidth: 180,
  },
  keySearch: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  keyText: {
    fontSize: isTV ? 16 : 13,
    fontWeight: '700',
  },
  keyboardHelp: {
    fontSize: isTV ? 13 : 11,
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '600',
    color: '#8E95A5',
  },
});
