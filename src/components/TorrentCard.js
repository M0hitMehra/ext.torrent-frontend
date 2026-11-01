/**
 * TorrentCard.js
 * High-contrast Neumorphic card for torrent entries.
 * Engineered for TV remote navigation with YouTube TV–style focus pointer,
 * instant tactile feedback, and glowing high-visibility borders.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus, playTVSelectFeedback } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';

const isTV = Platform.isTV;

export function TorrentCard({ torrent, onPress, style, hasPreferredFocus = false }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  if (!torrent) return null;

  const seeders = parseInt(torrent.seeders) || 0;
  const leechers = parseInt(torrent.leechers) || 0;
  const seedColor = seeders > 100 ? COLORS.seeder : seeders > 10 ? '#FFD54F' : COLORS.leecher;

  const handlePress = () => {
    playTVSelectFeedback();
    onPress(torrent);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      onFocus={onFocus}
      onBlur={onBlur}
      hasTVPreferredFocus={hasPreferredFocus}
      style={[
        styles.card,
        style,
        focused && styles.cardFocused,
        { backgroundColor: theme.card, borderTopColor: theme.cardHighlight, borderLeftColor: theme.cardHighlight, borderBottomColor: theme.cardShadow, borderRightColor: theme.cardShadow },
        focused && focusStyle,
      ]}
    >
      {/* ─── YOUTUBE TV STYLE POINTER BANNER (When focused) ─── */}
      {isTV && focused && (
        <View style={styles.tvPointerBanner}>
          <View style={styles.pulseBeacon} />
          <Text style={styles.tvPointerText}>POINTER HERE • PRESS OK TO STREAM</Text>
          <MaterialIcons name="play-circle-filled" size={16} color="#FFFFFF" />
        </View>
      )}

      {/* Top Meta Bar */}
      <View style={styles.topBar}>
        <View style={[styles.badgeCategory, focused && styles.badgeCategoryFocused]}>
          <MaterialIcons
            name="folder-open"
            size={12}
            color={focused ? '#FFFFFF' : COLORS.primaryGlow}
          />
          <Text style={[styles.badgeCategoryText, focused && styles.badgeCategoryTextFocused]}>
            {torrent.category || 'General'}
          </Text>
        </View>

        {seeders > 300 && (
          <View style={styles.badgeHot}>
            <Text style={styles.badgeHotText}>🔥 POPULAR</Text>
          </View>
        )}

        {torrent.source && (
          <View style={styles.badgeSource}>
            <Text style={styles.badgeSourceText}>{torrent.source.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Torrent Title */}
      <Text
        style={[styles.title, { color: theme.text }, focused && styles.titleFocused]}
        numberOfLines={isTV ? 2 : 3}
      >
        {torrent.title || 'Untitled Torrent'}
      </Text>

      {/* Neumorphic Metric Bar */}
      <View style={styles.metricsRow}>
        {/* Size */}
        <View style={[styles.metricPill, focused && styles.metricPillFocused]}>
          <MaterialIcons name="storage" size={13} color={COLORS.secondary} />
          <Text style={styles.metricText}>{torrent.size || 'N/A'}</Text>
        </View>

        {/* Seeders */}
        <View style={[styles.metricPill, focused && styles.metricPillFocused]}>
          <MaterialIcons name="arrow-upward" size={13} color={seedColor} />
          <Text style={[styles.metricText, { color: seedColor, fontWeight: '800' }]}>
            {seeders.toLocaleString()}
          </Text>
        </View>

        {/* Leechers */}
        <View style={[styles.metricPill, focused && styles.metricPillFocused]}>
          <MaterialIcons name="arrow-downward" size={13} color={COLORS.leecher} />
          <Text style={[styles.metricText, { color: COLORS.leecher, fontWeight: '700' }]}>
            {leechers.toLocaleString()}
          </Text>
        </View>

        {/* Age */}
        {torrent.age && (
          <View style={[styles.metricPill, styles.metricPillAge, focused && styles.metricPillFocused]}>
            <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
            <Text style={styles.metricTextMuted}>{torrent.age}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: '#282D40',
    transform: [{ scale: isTV ? 1.06 : 1.02 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 20,
  },
  tvPointerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  pulseBeacon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.tvPointer,
  },
  tvPointerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  badgeCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '25',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  badgeCategoryFocused: {
    backgroundColor: COLORS.primary,
    borderColor: '#FFFFFF',
  },
  badgeCategoryText: {
    color: COLORS.primaryGlow,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgeCategoryTextFocused: {
    color: '#FFFFFF',
  },
  badgeHot: {
    backgroundColor: '#FF5252' + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5252' + '44',
  },
  badgeHotText: {
    color: '#FF7B7B',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeSource: {
    backgroundColor: COLORS.cardShadow,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  badgeSourceText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: isTV ? 16 : 14,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 14,
  },
  titleFocused: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.input,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  metricPillFocused: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.cardHighlight,
  },
  metricPillAge: {
    marginLeft: 'auto',
  },
  metricText: {
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '600',
  },
  metricTextMuted: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
