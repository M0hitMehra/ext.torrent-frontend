/**
 * TorrentCard.js
 * Neumorphic dark-mode card for displaying torrent entries.
 * Adapts seamlessly to Phone (touch) and Android TV (D-pad focus).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, NEU_STYLES } from '../constants';
import { useTVFocus } from '../hooks';

const isTV = Platform.isTV;

export function TorrentCard({ torrent, onPress, style }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  if (!torrent) return null;

  const seeders = parseInt(torrent.seeders) || 0;
  const leechers = parseInt(torrent.leechers) || 0;
  const seedColor = seeders > 100 ? COLORS.seeder : seeders > 10 ? '#FFD54F' : COLORS.leecher;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(torrent)}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        styles.card,
        style,
        focused && styles.cardFocused,
      ]}
    >
      {/* Top Meta Bar */}
      <View style={styles.topBar}>
        <View style={styles.badgeCategory}>
          <MaterialIcons name="folder-open" size={11} color={COLORS.primaryGlow} />
          <Text style={styles.badgeCategoryText}>{torrent.category || 'General'}</Text>
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
      <Text style={styles.title} numberOfLines={isTV ? 2 : 3}>
        {torrent.title || 'Untitled Torrent'}
      </Text>

      {/* Neumorphic Metric Bar */}
      <View style={styles.metricsRow}>
        {/* Size */}
        <View style={styles.metricPill}>
          <MaterialIcons name="storage" size={13} color={COLORS.secondary} />
          <Text style={styles.metricText}>{torrent.size || 'N/A'}</Text>
        </View>

        {/* Seeders */}
        <View style={styles.metricPill}>
          <MaterialIcons name="arrow-upward" size={13} color={seedColor} />
          <Text style={[styles.metricText, { color: seedColor, fontWeight: '700' }]}>
            {seeders.toLocaleString()}
          </Text>
        </View>

        {/* Leechers */}
        <View style={styles.metricPill}>
          <MaterialIcons name="arrow-downward" size={13} color={COLORS.leecher} />
          <Text style={[styles.metricText, { color: COLORS.leecher }]}>
            {leechers.toLocaleString()}
          </Text>
        </View>

        {/* Age */}
        {torrent.age && (
          <View style={[styles.metricPill, styles.metricPillAge]}>
            <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
            <Text style={styles.metricTextMuted}>{torrent.age}</Text>
          </View>
        )}
      </View>

      {/* TV D-Pad Focus Prompt */}
      {isTV && focused && (
        <View style={styles.tvFocusPrompt}>
          <MaterialIcons name="play-circle-outline" size={15} color={COLORS.primary} />
          <Text style={styles.tvFocusPromptText}>Press OK to view & stream</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  cardFocused: {
    borderColor: COLORS.tvFocus,
    borderWidth: 2,
    backgroundColor: '#232635',
    transform: [{ scale: 1.025 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  badgeCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  badgeCategoryText: {
    color: COLORS.primaryGlow,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    lineHeight: 21,
    marginBottom: 14,
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
  tvFocusPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  tvFocusPromptText: {
    color: COLORS.primaryGlow,
    fontSize: 12,
    fontWeight: '700',
  },
});
