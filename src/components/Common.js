/**
 * Common.js
 * Neumorphic UI helpers (SectionHeader, LoadingSpinner, ErrorView, EmptyView).
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FocusableOpacity } from './FocusableOpacity';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus, playTVSelectFeedback } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <View style={styles.center}>
      <View style={styles.loaderCircle}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <View style={[styles.loaderCircle, styles.errorCircle]}>
        <MaterialIcons name="error-outline" size={36} color={COLORS.accent} />
      </View>
      <Text style={styles.errorTitle}>Connection Problem</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <FocusableOpacity style={styles.retryBtn} onPress={onRetry}>
          <MaterialIcons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryText}>Try Again</Text>
        </FocusableOpacity>
      )}
    </View>
  );
}

export function EmptyView({ message = 'No results found', icon = 'search-off' }) {
  return (
    <View style={styles.center}>
      <View style={styles.loaderCircle}>
        <MaterialIcons name={icon} size={36} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function SectionHeader({ title, icon, onSeeAll }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        {icon && <MaterialIcons name={icon} size={18} color={COLORS.primaryGlow} />}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {onSeeAll && (
        <FocusableOpacity
          onPress={() => { playTVSelectFeedback(); onSeeAll(); }}
          onFocus={onFocus}
          onBlur={onBlur}
          style={[styles.seeAll, focused && styles.seeAllFocused, focused && focusStyle]}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <MaterialIcons name="chevron-right" size={16} color={COLORS.primaryGlow} />
        </FocusableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loaderCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  errorCircle: {
    borderColor: COLORS.accent + '44',
  },
  message: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '600',
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  errorMessage: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 4,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  seeAllFocused: { backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#FFFFFF', transform: [{ scale: 1.06 }] },
  seeAllText: {
    color: COLORS.primaryGlow,
    fontSize: 12,
    fontWeight: '700',
  },
});
