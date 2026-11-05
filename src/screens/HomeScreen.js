/**
 * HomeScreen.js
 * Netflix-style Glassmorphic Cinema Dashboard for Mobile and Android TV.
 * Features:
 *  - High-res dynamic Hero Billboard with backdrop, badges, and quick actions
 *  - Netflix horizontal poster carousels for all categories
 *  - High-visibility TV Remote Highlighting with audio-haptic feedback
 *  - Persistent Watchlist and Continue Watching shelves
 *  - D-pad focus indicators on all tiles
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { FocusableOpacity } from '../components/FocusableOpacity';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../constants';
import { getTrending, getLatest, browseTorrents } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { HeroBanner } from '../components/HeroBanner';
import { TVKeyboard } from '../components/TVKeyboard';
import { TVNavigationRail } from '../components/TVNavigationRail';
import { LoadingSpinner, ErrorView, SectionHeader } from '../components/Common';
import { useFetch, useTVFocus, playTVSelectFeedback } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';
import { getWatchlist, getWatchHistory, subscribeToStorage } from '../utils/storage';

const isTV = Platform.isTV;

export default function HomeScreen({ navigation }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [watchlist, setWatchlist] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);

  const reloadUserData = useCallback(() => {
    getWatchlist().then(setWatchlist);
    getWatchHistory().then(setWatchHistory);
  }, []);

  useEffect(() => {
    reloadUserData();
    const unsub = subscribeToStorage(reloadUserData);
    return () => unsub();
  }, [reloadUserData]);

  // Catalog shelves fetchers
  const {
    data: trendingData,
    loading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useFetch(() => getTrending(selectedCategory), [selectedCategory]);

  const {
    data: moviesData,
    loading: moviesLoading,
  } = useFetch(() => browseTorrents({ category: 'movies', sort: 'seeders', order: 'desc' }), []);

  const {
    data: tvData,
    loading: tvLoading,
  } = useFetch(() => browseTorrents({ category: 'tv', sort: 'seeders', order: 'desc' }), []);

  const {
    data: latestData,
    loading: latestLoading,
  } = useFetch(() => getLatest(1), []);

  const handleTorrentPress = useCallback((torrent) => {
    navigation.navigate('TorrentDetail', { torrent });
  }, [navigation]);

  const handleSearch = useCallback((query) => {
    navigation.navigate('Search', { initialQuery: query });
  }, [navigation]);

  const handleCategoryPress = useCallback((slug) => {
    navigation.navigate('Browse', { category: slug });
  }, [navigation]);

  const heroItem = trendingData?.torrents?.[0] || moviesData?.torrents?.[0] || null;

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={settings.mode === 'light' ? 'dark-content' : 'light-content'} backgroundColor={theme.bg} />

      {/* ─── YOUTUBE TV LEFT NAVIGATION RAIL (TV only) ─── */}
      <TVNavigationRail
        currentRoute="Home"
        onNavigate={(route) => navigation.navigate(route)}
      />

      {/* ─── MAIN CONTENT AREA ─── */}
      <View style={[styles.mainContent, { backgroundColor: theme.bg }]}>
        {/* ─── TOP BAR WITH SEARCH ─── */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MaterialIcons name="local-movies" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={[styles.appTitle, { color: theme.text }]}>ExtTorrent</Text>
              <Text style={[styles.appSub, { color: theme.textMuted }]}>CINEMA GLASS · NETFLIX TV</Text>
            </View>
          </View>

          <SearchTriggerButton
            onPress={() => isTV ? setKeyboardVisible(true) : navigation.navigate('Search', {})}
          />
        </View>

        <ScrollView
          showsVerticalVerticalIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ─── NETFLIX BILLBOARD HERO BANNER ─── */}
          {heroItem && (
            <HeroBanner
              torrent={heroItem}
              onStream={handleTorrentPress}
              onDetails={handleTorrentPress}
            />
          )}

          {/* ─── CATEGORY CHIPS SHELF ─── */}
          <View style={styles.sectionWrap}>
            <SectionHeader title="Categories" icon="grid-view" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat.slug}
                  cat={cat}
                  selected={selectedCategory === cat.slug}
                  onPress={() => setSelectedCategory(cat.slug)}
                  onLongPress={() => handleCategoryPress(cat.slug)}
                />
              ))}
            </ScrollView>
          </View>

          {/* ─── SHELF 1: MY WATCHLIST (When populated) ─── */}
          {watchlist.length > 0 && (
            <View style={styles.sectionWrap}>
              <SectionHeader
                title="⭐ My Watchlist"
                icon="bookmark"
                onSeeAll={() => {}}
              />
              <FlatList
                data={watchlist}
                keyExtractor={(item, i) => String(item.id || i)}
                renderItem={({ item }) => (
                  <TorrentCard torrent={item} onPress={handleTorrentPress} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfListContent}
              />
            </View>
          )}

          {/* ─── SHELF 2: CONTINUE WATCHING (When populated) ─── */}
          {watchHistory.length > 0 && (
            <View style={styles.sectionWrap}>
              <SectionHeader
                title="🕒 Continue Watching"
                icon="history"
                onSeeAll={() => {}}
              />
              <FlatList
                data={watchHistory}
                keyExtractor={(item, i) => String(item.id || i)}
                renderItem={({ item }) => (
                  <TorrentCard torrent={item} onPress={handleTorrentPress} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfListContent}
              />
            </View>
          )}

          {/* ─── SHELF 3: TRENDING NOW ─── */}
          <View style={styles.sectionWrap}>
            <SectionHeader
              title="🔥 Trending Now"
              icon="trending-up"
              onSeeAll={() => navigation.navigate('Browse', { category: selectedCategory, tab: 'trending' })}
            />
            {trendingLoading ? (
              <LoadingSpinner message="Loading trending releases..." />
            ) : trendingError ? (
              <ErrorView message={trendingError} onRetry={refetchTrending} />
            ) : (
              <FlatList
                data={trendingData?.torrents?.slice(0, 15) || []}
                keyExtractor={(item, i) => item.id || String(i)}
                renderItem={({ item, index }) => (
                  <TorrentCard
                    torrent={item}
                    onPress={handleTorrentPress}
                    hasPreferredFocus={isTV && index === 0}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfListContent}
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                      Loading verified torrents...
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          {/* ─── SHELF 4: POPULAR MOVIES ─── */}
          <View style={styles.sectionWrap}>
            <SectionHeader
              title="🎬 Top Movies (1080p / 4K)"
              icon="movie"
              onSeeAll={() => navigation.navigate('Browse', { category: 'movies', tab: 'seeders' })}
            />
            {moviesLoading ? (
              <LoadingSpinner message="Loading movies..." />
            ) : (
              <FlatList
                data={moviesData?.torrents?.slice(0, 15) || []}
                keyExtractor={(item, i) => item.id || String(i)}
                renderItem={({ item }) => (
                  <TorrentCard torrent={item} onPress={handleTorrentPress} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfListContent}
              />
            )}
          </View>

          {/* ─── SHELF 5: POPULAR TV SERIES ─── */}
          <View style={styles.sectionWrap}>
            <SectionHeader
              title="📺 Binge-Worthy TV Shows"
              icon="tv"
              onSeeAll={() => navigation.navigate('Browse', { category: 'tv', tab: 'seeders' })}
            />
            {tvLoading ? (
              <LoadingSpinner message="Loading TV series..." />
            ) : (
              <FlatList
                data={tvData?.torrents?.slice(0, 15) || []}
                keyExtractor={(item, i) => item.id || String(i)}
                renderItem={({ item }) => (
                  <TorrentCard torrent={item} onPress={handleTorrentPress} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfListContent}
              />
            )}
          </View>

          {/* ─── SHELF 6: LATEST RELEASES ─── */}
          <View style={styles.sectionWrap}>
            <SectionHeader
              title="⚡ Fresh Verified Uploads"
              icon="new-releases"
              onSeeAll={() => navigation.navigate('Browse', { tab: 'latest' })}
            />
            {latestLoading ? (
              <LoadingSpinner message="Loading latest torrents..." />
            ) : (
              <FlatList
                data={latestData?.torrents?.slice(0, 15) || []}
                keyExtractor={(item, i) => item.id || String(i)}
                renderItem={({ item }) => (
                  <TorrentCard torrent={item} onPress={handleTorrentPress} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfListContent}
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* TV On-Screen Keyboard */}
      <TVKeyboard
        visible={keyboardVisible}
        onClose={() => setKeyboardVisible(false)}
        onSearch={handleSearch}
      />
    </View>
  );
}

function SearchTriggerButton({ onPress }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <FocusableOpacity
      hasTVPreferredFocus={false}
      accessibilityRole="button"
      accessibilityLabel="Search titles. Press OK to open search."
      style={[
        styles.searchBarBtn,
        { backgroundColor: theme.input, borderColor: theme.border },
        focused && styles.searchBarBtnFocused,
        focused && focusStyle,
      ]}
      activeOpacity={0.8}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons
        name="search"
        size={20}
        color={focused ? '#FFFFFF' : COLORS.primary}
      />
      <Text style={[styles.searchBtnText, { color: focused ? '#fff' : theme.textMuted }, focused && styles.searchBtnTextFocused]}>
        {focused ? 'PRESS OK TO TYPE' : 'Search movies, series, 4K...'}
      </Text>
      {focused && (
        <View style={styles.searchPointerBeacon}>
          <Text style={styles.searchPointerText}>SELECT</Text>
        </View>
      )}
    </FocusableOpacity>
  );
}

function CategoryChip({ cat, selected, onPress, onLongPress }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <FocusableOpacity
      hasTVPreferredFocus={false}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.catChip,
        {
          backgroundColor: selected ? COLORS.primary : theme.card,
          borderColor: selected ? COLORS.primary : theme.border,
        },
        focused && styles.catChipFocused,
        focused && focusStyle,
      ]}
      activeOpacity={0.8}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onLongPress={onLongPress}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons
        name={cat.icon}
        size={16}
        color={selected || focused ? '#FFFFFF' : theme.textSub}
      />
      <Text
        style={[
          styles.catText,
          { color: selected || focused ? '#FFFFFF' : theme.textSub },
          selected && styles.catTextSelected,
        ]}
      >
        {cat.name}
      </Text>
    </FocusableOpacity>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTV ? 28 : 16,
    paddingTop: Platform.OS === 'android' ? 42 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  searchBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    minWidth: isTV ? 280 : 160,
  },
  searchBarBtnFocused: {
    borderColor: '#FFFFFF',
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: '#FF5722',
    transform: [{ scale: 1.05 }],
  },
  searchBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchBtnTextFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  searchPointerBeacon: {
    marginLeft: 'auto',
    backgroundColor: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  searchPointerText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  scroll: {
    paddingBottom: 50,
    paddingTop: 16,
    paddingHorizontal: isTV ? 28 : 16,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  catRow: {
    paddingVertical: 6,
    gap: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
  },
  catChipFocused: {
    borderColor: '#FFFFFF',
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: '#FF5722',
    transform: [{ scale: 1.10 }],
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catTextSelected: {
    fontWeight: '800',
  },
  shelfListContent: {
    paddingVertical: 8,
    paddingRight: 20,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});