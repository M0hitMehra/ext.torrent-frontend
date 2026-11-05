/**
 * HeroBanner.js
 * Netflix-style Cinema Billboard for ExtTorrent App.
 * Displays dynamic high-res backdrop, ratings, and TV remote-focusable primary actions.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { FocusableOpacity } from './FocusableOpacity';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus, playTVSelectFeedback } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';
import { fetchMediaMetadata } from '../api/metaApi';
import { isInWatchlist, toggleWatchlist } from '../utils/storage';

const isTV = Platform.isTV;

export function HeroBanner({ torrent, onStream, onDetails }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const [meta, setMeta] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);

  const identifier = torrent?.id || torrent?.infoHash || torrent?.title;

  useEffect(() => {
    let active = true;
    if (torrent?.title) {
      fetchMediaMetadata(torrent.title).then((d) => {
        if (active && d) setMeta(d);
      });
    }
    return () => { active = false; };
  }, [torrent?.title]);

  useEffect(() => {
    if (identifier) {
      isInWatchlist(identifier).then(setInWatchlist);
    }
  }, [identifier]);

  if (!torrent) return null;

  const backdropUrl = meta?.backdrop || meta?.poster || null;
  const title = meta?.title || meta?.name || torrent.title;
  const rating = meta?.rating || null;
  const year = meta?.year || null;
  const overview = meta?.overview || meta?.description || torrent.description || '';

  const handleToggleWatchlist = async () => {
    const isNow = await toggleWatchlist(torrent, meta || {});
    setInWatchlist(isNow);
  };

  return (
    <View style={[styles.heroContainer, { borderColor: theme.border }]}>
      {/* Backdrop Image with Dark Vignette */}
      {backdropUrl ? (
        <Image
          source={{ uri: backdropUrl }}
          style={styles.backdropImg}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholderBackdrop, { backgroundColor: theme.surfaceElevated }]}>
          <MaterialIcons name="movie" size={60} color={theme.textMuted} />
        </View>
      )}

      {/* Glassmorphic Gradient Overlay */}
      <View style={styles.vignetteOverlay} />

      {/* Content Overlay */}
      <View style={styles.heroContent}>
        {/* Badges Row */}
        <View style={styles.badgesRow}>
          <View style={styles.trendingBadge}>
            <MaterialIcons name="local-fire-department" size={13} color="#FFFFFF" />
            <Text style={styles.trendingText}>#1 IN TRENDING TODAY</Text>
          </View>
          {year && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{year}</Text>
            </View>
          )}
          {rating && (
            <View style={styles.ratingPill}>
              <MaterialIcons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingPillText}>{rating} / 10</Text>
            </View>
          )}
        </View>

        {/* Big Title */}
        <Text style={styles.heroTitle} numberOfLines={isTV ? 2 : 2}>
          {title}
        </Text>

        {/* Synopsis */}
        {overview ? (
          <Text style={styles.heroOverview} numberOfLines={isTV ? 3 : 2}>
            {overview}
          </Text>
        ) : null}

        {/* Primary Action Buttons (Focusable for TV remote) */}
        <View style={styles.actionsRow}>
          <HeroPlayButton
            onPress={() => onStream(torrent)}
            label="STREAM NOW"
          />

          <HeroInfoButton
            onPress={() => onDetails(torrent)}
            label="DETAILS"
            theme={theme}
          />

          <HeroWatchlistButton
            inWatchlist={inWatchlist}
            onPress={handleToggleWatchlist}
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
}

function HeroPlayButton({ onPress, label }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const focusColor = settings.focusColor || COLORS.primary;

  return (
    <FocusableOpacity
      accessibilityRole="button"
      hasTVPreferredFocus={isTV}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        styles.playBtn,
        focused && {
          borderWidth: 3.5,
          borderColor: focusColor,
          transform: [{ scale: 1.08 }],
          shadowColor: focusColor,
          shadowOpacity: 1,
          shadowRadius: 18,
          elevation: 16,
        },
        focused && focusStyle,
      ]}
    >
      <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
      <Text style={styles.playBtnText}>{label}</Text>
    </FocusableOpacity>
  );
}

function HeroInfoButton({ onPress, label, theme }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const focusColor = settings.focusColor || COLORS.primary;

  return (
    <FocusableOpacity
      accessibilityRole="button"
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        styles.infoBtn,
        { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' },
        focused && {
          borderWidth: 3.5,
          borderColor: focusColor,
          transform: [{ scale: 1.08 }],
          shadowColor: focusColor,
          shadowOpacity: 1,
          shadowRadius: 18,
          elevation: 16,
        },
        focused && focusStyle,
      ]}
    >
      <MaterialIcons name="info-outline" size={18} color="#FFFFFF" />
      <Text style={styles.infoBtnText}>{label}</Text>
    </FocusableOpacity>
  );
}

function HeroWatchlistButton({ inWatchlist, onPress, theme }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const focusColor = settings.focusColor || COLORS.primary;

  return (
    <FocusableOpacity
      accessibilityRole="button"
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        styles.watchlistBtn,
        {
          backgroundColor: inWatchlist ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.1)',
          borderColor: inWatchlist ? '#F59E0B' : 'rgba(255, 255, 255, 0.2)',
        },
        focused && {
          borderWidth: 3.5,
          borderColor: focusColor,
          transform: [{ scale: 1.08 }],
          shadowColor: focusColor,
          shadowOpacity: 1,
          shadowRadius: 18,
          elevation: 16,
        },
        focused && focusStyle,
      ]}
    >
      <MaterialIcons
        name={inWatchlist ? "bookmark" : "bookmark-border"}
        size={18}
        color={inWatchlist ? "#F59E0B" : "#FFFFFF"}
      />
    </FocusableOpacity>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    height: isTV ? 380 : 300,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
    borderWidth: 1.5,
    backgroundColor: '#0A0D14',
  },
  backdropImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  placeholderBackdrop: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 7, 13, 0.65)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: isTV ? 28 : 18,
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E50914',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  trendingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  metaPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 13, 20, 0.8)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  ratingPillText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: isTV ? 32 : 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: isTV ? 38 : 28,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroOverview: {
    fontSize: isTV ? 13 : 11,
    color: '#D1D5DB',
    lineHeight: isTV ? 18 : 16,
    maxWidth: isTV ? 680 : 420,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: isTV ? 12 : 9,
    paddingHorizontal: isTV ? 22 : 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: isTV ? 13 : 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: isTV ? 12 : 9,
    paddingHorizontal: isTV ? 18 : 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBtnText: {
    color: '#FFFFFF',
    fontSize: isTV ? 13 : 11,
    fontWeight: '800',
  },
  watchlistBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTV ? 12 : 9,
    paddingHorizontal: isTV ? 14 : 11,
    borderRadius: 12,
    borderWidth: 1,
  },
});

export default HeroBanner;