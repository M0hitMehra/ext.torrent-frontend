/**
 * TVNavigationRail.js
 * YouTube TV style left-side navigation rail for Android TV.
 * Supports programmatic state-driven TV remote focus as well as native D-pad focus.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { playTVFocusFeedback, playTVSelectFeedback } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';

export const NAV_ITEMS = [
  { id: 'Search',   icon: 'search',   label: 'Search' },
  { id: 'Home',     icon: 'home',     label: 'Home' },
  { id: 'Browse',   icon: 'explore',  label: 'Browse' },
  { id: 'Settings', icon: 'settings', label: 'Settings' },
];

export function TVNavigationRail({ currentRoute, onNavigate, focusedItem = null }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  if (!Platform.isTV) return null;

  return (
    <View style={[styles.railContainer, { backgroundColor: theme.surface, borderRightColor: 'rgba(255,255,255,0.08)' }]}>
      {/* App Logo Emblem */}
      <View style={[styles.logoBadge, { backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.1)' }]}>
        <MaterialIcons name="local-movies" size={28} color="#FF5722" />
      </View>

      {/* Nav Rail Buttons */}
      <View style={styles.buttonsGroup}>
        {NAV_ITEMS.map((item) => (
          <RailButton
            key={item.id}
            item={item}
            isActive={currentRoute === item.id}
            isFocused={focusedItem === item.id}
            onPress={() => {
              playTVSelectFeedback();
              onNavigate(item.id);
            }}
          />
        ))}
      </View>

      {/* Bottom TV Pointer Legend */}
      <View style={[styles.bottomPill, { backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.1)' }]}>
        <View style={styles.activeDot} />
        <Text style={styles.bottomPillText}>▲▼ REMOTE</Text>
      </View>
    </View>
  );
}

function RailButton({ item, isActive, isFocused, onPress }) {
  const [internalFocused, setInternalFocused] = useState(false);
  const focused = isFocused || internalFocused;
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const accentColor = (settings.focusColor && settings.focusColor !== '#FFFFFF') ? settings.focusColor : '#FF5722';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      focusable
      onFocus={() => {
        setInternalFocused(true);
        playTVFocusFeedback();
      }}
      onBlur={() => {
        setInternalFocused(false);
      }}
      onPress={onPress}
      style={[
        styles.railBtn,
        {
          backgroundColor: isActive ? 'rgba(255, 87, 34, 0.22)' : theme.card,
          borderColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.1)',
          borderTopColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.1)',
          borderBottomColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.1)',
          borderLeftColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.1)',
          borderRightColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.1)',
          borderWidth: isActive ? 2 : 1,
        },
        focused && {
          backgroundColor: accentColor,
          borderColor: '#FFFFFF',
          borderTopColor: '#FFFFFF',
          borderBottomColor: '#FFFFFF',
          borderLeftColor: '#FFFFFF',
          borderRightColor: '#FFFFFF',
          borderWidth: 3.5,
          transform: [{ scale: 1.15 }],
          elevation: 24,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 20,
          zIndex: 999,
        },
      ]}
    >
      {/* Active Tab Vertical Indicator bar */}
      {isActive && !focused && (
        <View style={[styles.activeTabIndicator, { backgroundColor: accentColor }]} />
      )}

      <MaterialIcons
        name={item.icon}
        size={focused ? 26 : 24}
        color={focused ? '#FFFFFF' : isActive ? accentColor : theme.textMuted}
      />
      <Text
        style={[
          styles.railBtnLabel,
          {
            color: focused ? '#FFFFFF' : isActive ? '#FFFFFF' : theme.textMuted,
            fontWeight: focused ? '900' : isActive ? '800' : '600',
          },
        ]}
      >
        {item.label}
      </Text>

      {/* Pointer indicator beacon on focus */}
      {focused && (
        <View style={styles.pointerBeacon}>
          <Text style={styles.beaconArrow}>◀</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  railContainer: {
    width: 104,
    backgroundColor: '#111521',
    alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#171C29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonsGroup: {
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  railBtn: {
    width: 82,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#171C29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    left: 4,
    top: 20,
    bottom: 20,
    width: 4,
    borderRadius: 2,
  },
  railBtnLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  pointerBeacon: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 10,
  },
  beaconArrow: {
    color: '#FF5722',
    fontSize: 10,
    fontWeight: '900',
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#171C29',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  bottomPillText: {
    color: '#8E95A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
