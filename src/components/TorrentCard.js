import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TVFocusGuideView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus } from '../hooks';

const isTV = Platform.isTV;

export function TorrentCard({ torrent, onPress, style }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  const seedColor = torrent.seeders > 100 ? COLORS.seeder :
                    torrent.seeders > 10  ? '#FFC107' : COLORS.leecher;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(torrent)}
      onFocus={onFocus}
      onBlur={onBlur}
      hasTVPreferredFocus={false}
      style={[
        styles.card,
        style,
        isTV && focused && styles.cardFocused,
      ]}
    >
      {/* Category Badge */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{torrent.category || 'Unknown'}</Text>
        </View>
        {torrent.seeders > 500 && (
          <View style={[styles.badge, styles.hotBadge]}>
            <Text style={styles.badgeText}>🔥 HOT</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={isTV ? 2 : 3}>
        {torrent.title || 'Unknown Torrent'}
      </Text>

      {/* Meta row */}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <MaterialIcons name="storage" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{torrent.size || 'N/A'}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="arrow-upward" size={12} color={seedColor} />
          <Text style={[styles.metaText, { color: seedColor }]}>{torrent.seeders}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="arrow-downward" size={12} color={COLORS.leecher} />
          <Text style={[styles.metaText, { color: COLORS.leecher }]}>{torrent.leechers}</Text>
        </View>
        {torrent.age && (
          <View style={styles.metaItem}>
            <MaterialIcons name="access-time" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{torrent.age}</Text>
          </View>
        )}
      </View>

      {/* Play hint */}
      {isTV && focused && (
        <View style={styles.tvPlayHint}>
          <MaterialIcons name="play-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.tvPlayHintText}>Press OK to open</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardFocused: {
    borderColor: COLORS.tvFocus,
    borderWidth: 2,
    backgroundColor: '#1E1E30',
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.primary + '33',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotBadge: {
    backgroundColor: COLORS.accent + '33',
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: Platform.isTV ? 16 : 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 10,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  tvPlayHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  tvPlayHintText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
