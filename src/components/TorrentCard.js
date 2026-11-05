/**
 * TorrentCard.js
 * Netflix-style Glassmorphic Poster Card with High-Impact TV Remote Highlighting.
 * Features:
 *  - High-res movie/show poster image via fetchMediaMetadata
 *  - Aspect ratio 2:3 cinematic poster dimensions
 *  - Floating TV remote pointer badge on focus (▶ PRESS OK TO STREAM)
 *  - Glowing neon focus border with dynamic accent color
 *  - Tactile audio-haptic feedback on focus and selection
 *  - Seeders, size, and rating badges
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FocusableOpacity } from './FocusableOpacity';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus, playTVSelectFeedback } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';
import { fetchMediaMetadata } from '../api/metaApi';

const isTV = Platform.isTV;

export function TorrentCard({ torrent, onPress, style, hasPreferredFocus = false }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const focusColor = settings.focusColor || COLORS.primary;

  const [metadata, setMetadata] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (torrent?.title) {
      fetchMediaMetadata(torrent.title).then((meta) => {
        if (active && meta) setMetadata(meta);
      });
    }
    return () => { active = false; };
  }, [torrent?.title]);

  if (!torrent) return null;

  const posterUrl = metadata?.poster || metadata?.backdrop || null;
  const displayTitle = metadata?.title || metadata?.name || torrent.title || 'Untitled';
  const seeders = parseInt(torrent.seeders) || 0;
  const rating = metadata?.rating || null;
  const year = metadata?.year || torrent.year || null;

  const handlePress = () => {
    playTVSelectFeedback();
    onPress(torrent);
  };

  return (
    <FocusableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      onFocus={(e) => {
        playTVSelectFeedback();
        onFocus(e);
      }}
      onBlur={onBlur}
      hasTVPreferredFocus={hasPreferredFocus}
      style={[
        styles.cardContainer,
        style,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderTopColor: theme.border,
          borderBottomColor: theme.border,
          borderLeftColor: theme.border,
          borderRightColor: theme.border,
        },
        focused && [
          styles.cardFocused,
          {
            borderColor: '#FFFFFF',
            borderTopColor: '#FFFFFF',
            borderBottomColor: '#FFFFFF',
            borderLeftColor: '#FFFFFF',
            borderRightColor: '#FFFFFF',
            shadowColor: focusColor,
            transform: [{ scale: isTV ? 1.10 : 1.04 }],
          },
        ],
      ]}
    >
      {/* ─── TV REMOTE FOCUS POINTER BEACON (Appears on D-pad Focus) ─── */}
      {focused && (
        <View style={[styles.tvFocusBeacon, { backgroundColor: focusColor }]}>
          <MaterialIcons name="play-arrow" size={13} color="#000000" />
          <Text style={styles.tvFocusBeaconText}>PLAY (OK)</Text>
        </View>
      )}

      {/* ─── POSTER IMAGE CONTAINER ─── */}
      <View style={[styles.posterWrap, { backgroundColor: theme.surfaceElevated }]}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.posterImg}
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <View style={styles.placeholderWrap}>
            <MaterialIcons name="movie" size={36} color={theme.textMuted} />
            <Text style={[styles.placeholderCat, { color: theme.textMuted }]} numberOfLines={1}>
              {torrent.category || 'Release'}
            </Text>
          </View>
        )}

        {/* Top-Right IMDb Rating Pill */}
        {rating && (
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}

        {/* Top-Left Category / Quality Tag */}
        <View style={styles.formatBadge}>
          <Text style={styles.formatText}>
            {seeders > 300 ? '🔥 HOT' : '1080P'}
          </Text>
        </View>
      </View>

      {/* ─── CARD BODY & METADATA ─── */}
      <View style={styles.bodyWrap}>
        <Text
          style={[styles.cardTitle, { color: theme.text }, focused && { color: '#FFFFFF', fontWeight: '900' }]}
          numberOfLines={2}
        >
          {displayTitle}
        </Text>

        {/* Sub-row: Year + Category */}
        <View style={styles.subMetaRow}>
          {year && <Text style={[styles.subMetaText, { color: theme.textMuted }]}>{year}</Text>}
          {year && <Text style={[styles.subMetaDot, { color: theme.textMuted }]}>•</Text>}
          <Text style={[styles.subMetaText, { color: theme.textMuted }]} numberOfLines={1}>
            {torrent.category || 'Movie'}
          </Text>
        </View>

        {/* Metrics Row: Seeders + Size */}
        <View style={styles.metricsRow}>
          <View style={styles.seederPill}>
            <MaterialIcons name="arrow-upward" size={11} color="#10B981" />
            <Text style={styles.seederText}>{seeders.toLocaleString()}</Text>
          </View>
          {torrent.size && (
            <View style={[styles.sizePill, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.sizeText, { color: theme.textSub }]}>{torrent.size}</Text>
            </View>
          )}
        </View>
      </View>
    </FocusableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: isTV ? 172 : 142,
    marginRight: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  cardFocused: {
    borderWidth: 3.5,
    elevation: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 20,
    zIndex: 99,
  },
  tvFocusBeacon: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  tvFocusBeaconText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  posterWrap: {
    width: '100%',
    height: isTV ? 230 : 190,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderCat: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(10, 13, 20, 0.85)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  formatBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  formatText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  bodyWrap: {
    padding: 10,
    gap: 4,
  },
  cardTitle: {
    fontSize: isTV ? 13 : 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  subMetaText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  subMetaDot: {
    fontSize: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 6,
  },
  seederPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seederText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  sizePill: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  sizeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});

export default TorrentCard;