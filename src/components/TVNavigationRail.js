/**
 * TVNavigationRail.js
 * YouTube TV style left-side navigation rail for Android TV.
 * Allows quick D-pad remote switching between Home, Search, and Browse,
 * complete with high-contrast Neumorphic focus states and audio-haptic feedback.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus, playTVSelectFeedback } from '../hooks';

const NAV_ITEMS = [
  { id: 'Search', icon: 'search',        label: 'Search' },
  { id: 'Home',   icon: 'home',          label: 'Home' },
  { id: 'Browse', icon: 'explore',       label: 'Browse' },
];

export function TVNavigationRail({ currentRoute, onNavigate }) {
  if (!Platform.isTV) return null;

  return (
    <View style={styles.railContainer}>
      {/* App Logo Emblem */}
      <View style={styles.logoBadge}>
        <MaterialIcons name="local-movies" size={26} color={COLORS.primaryGlow} />
      </View>

      {/* Nav Rail Buttons */}
      <View style={styles.buttonsGroup}>
        {NAV_ITEMS.map((item) => (
          <RailButton
            key={item.id}
            item={item}
            isActive={currentRoute === item.id}
            onPress={() => {
              playTVSelectFeedback();
              onNavigate(item.id);
            }}
          />
        ))}
      </View>

      {/* Bottom TV Pointer Legend */}
      <View style={styles.bottomPill}>
        <View style={styles.activeDot} />
        <Text style={styles.bottomPillText}>↑↓ MOVE · OK OPEN</Text>
      </View>
    </View>
  );
}

function RailButton({ item, isActive, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.railBtn,
        isActive && styles.railBtnActive,
        focused && styles.railBtnFocused,
      ]}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons
        name={item.icon}
        size={24}
        color={focused ? '#FFFFFF' : isActive ? COLORS.primaryGlow : COLORS.textMuted}
      />
      <Text
        style={[
          styles.railBtnLabel,
          isActive && styles.railBtnLabelActive,
          focused && styles.railBtnLabelFocused,
        ]}
      >
        {item.label}
      </Text>

      {/* Pointer indicator beacon on focus */}
      {focused && (
        <View style={styles.pointerBeacon}>
          <View style={styles.beaconDot} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  railContainer: {
    width: 104,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    paddingVertical: 20,
    borderRightWidth: 1.5,
    borderRightColor: COLORS.cardHighlight,
    justifyContent: 'space-between',
    zIndex: 999,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonsGroup: {
    gap: 16,
    alignItems: 'center',
    width: '100%',
  },
  railBtn: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    gap: 3,
  },
  railBtnActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.primary + '88',
  },
  railBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.12 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 18,
    elevation: 16,
  },
  railBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  railBtnLabelActive: {
    color: COLORS.primaryGlow,
  },
  railBtnLabelFocused: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  pointerBeacon: {
    position: 'absolute',
    right: -7,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.tvPointer,
    shadowColor: COLORS.tvPointer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  beaconDot: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.input,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.seeder,
  },
  bottomPillText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
