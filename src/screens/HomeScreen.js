/**
 * HomeScreen.js
 * Netflix-style Glassmorphic Cinema Dashboard for Mobile and Android TV.
 * Features:
 *  - High-res dynamic Hero Billboard with backdrop, badges, and quick actions
 *  - Netflix horizontal poster carousels for all categories
 *  - 100% Reliable TV Remote D-Pad Navigation and Glowing Focus Highlighting
 *  - Persistent Watchlist and Continue Watching shelves
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../constants';
import { getTrending, getLatest, browseTorrents } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { HeroBanner } from '../components/HeroBanner';
import { TVKeyboard } from '../components/TVKeyboard';
import { TVNavigationRail, NAV_ITEMS } from '../components/TVNavigationRail';
import { LoadingSpinner, ErrorView, SectionHeader } from '../components/Common';
import { useFetch, playTVFocusFeedback, playTVSelectFeedback, useTVRemote } from '../hooks';
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

  // TV Remote Navigation State
  // area: 'RAIL' | 'SEARCH' | 'CATEGORIES' | 'SHELVES'
  const [tvFocus, setTvFocus] = useState({
    area: 'SHELVES',
    railIndex: 1, // Home
    catIndex: 0,
    shelfIndex: 0,
    cardIndex: 0,
  });

  const mainScrollRef = useRef(null);
  const shelfRefs = useRef({});

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

  // Shelves definition
  const shelves = [
    { id: 'trending', title: 'Trending Now', data: trendingData?.torrents?.slice(0, 15) || [] },
    { id: 'movies',   title: '🎬 Top Movies', data: moviesData?.torrents?.slice(0, 15) || [] },
    { id: 'tv',       title: '📺 TV Series',  data: tvData?.torrents?.slice(0, 15) || [] },
    { id: 'latest',   title: '⚡ Fresh Uploads', data: latestData?.torrents?.slice(0, 15) || [] },
  ];

  const scrollToCard = useCallback((shelfIdx, cardIdx) => {
    try {
      shelfRefs.current[shelfIdx]?.scrollToIndex({ index: cardIdx, animated: true, viewPosition: 0.3 });
    } catch (_) {}
  }, []);

  const scrollToShelf = useCallback((shelfIdx) => {
    try {
      mainScrollRef.current?.scrollTo({ y: shelfIdx * 280, animated: true });
    } catch (_) {}
  }, []);

  // TV Remote Navigation Handler
  useTVRemote((eventType) => {
    if (keyboardVisible) return;

    if (tvFocus.area === 'RAIL') {
      if (eventType === 'up') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, railIndex: Math.max(0, f.railIndex - 1) }));
      } else if (eventType === 'down') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, railIndex: Math.min(NAV_ITEMS.length - 1, f.railIndex + 1) }));
      } else if (eventType === 'right') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'SHELVES' }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        const routeName = NAV_ITEMS[tvFocus.railIndex]?.id;
        if (routeName && routeName !== 'Home') {
          navigation.navigate(routeName);
        }
      }
    } else if (tvFocus.area === 'SEARCH') {
      if (eventType === 'left') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 0 }));
      } else if (eventType === 'down') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'CATEGORIES' }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        setKeyboardVisible(true);
      }
    } else if (tvFocus.area === 'CATEGORIES') {
      if (eventType === 'left') {
        if (tvFocus.catIndex > 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, catIndex: f.catIndex - 1 }));
        } else {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 1 }));
        }
      } else if (eventType === 'right') {
        if (tvFocus.catIndex < CATEGORIES.length - 1) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, catIndex: f.catIndex + 1 }));
        }
      } else if (eventType === 'up') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'SEARCH' }));
      } else if (eventType === 'down') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'SHELVES', shelfIndex: 0, cardIndex: 0 }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        setSelectedCategory(CATEGORIES[tvFocus.catIndex].slug);
      }
    } else if (tvFocus.area === 'SHELVES') {
      const activeShelf = shelves[tvFocus.shelfIndex];
      const count = activeShelf?.data?.length || 0;

      if (eventType === 'left') {
        if (tvFocus.cardIndex > 0) {
          playTVFocusFeedback();
          const nextCard = tvFocus.cardIndex - 1;
          setTvFocus(f => ({ ...f, cardIndex: nextCard }));
          scrollToCard(tvFocus.shelfIndex, nextCard);
        } else {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 1 }));
        }
      } else if (eventType === 'right') {
        if (tvFocus.cardIndex < count - 1) {
          playTVFocusFeedback();
          const nextCard = tvFocus.cardIndex + 1;
          setTvFocus(f => ({ ...f, cardIndex: nextCard }));
          scrollToCard(tvFocus.shelfIndex, nextCard);
        }
      } else if (eventType === 'up') {
        if (tvFocus.shelfIndex > 0) {
          playTVFocusFeedback();
          const nextShelf = tvFocus.shelfIndex - 1;
          setTvFocus(f => ({ ...f, shelfIndex: nextShelf, cardIndex: 0 }));
          scrollToShelf(nextShelf);
        } else {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'CATEGORIES' }));
        }
      } else if (eventType === 'down') {
        if (tvFocus.shelfIndex < shelves.length - 1) {
          playTVFocusFeedback();
          const nextShelf = tvFocus.shelfIndex + 1;
          setTvFocus(f => ({ ...f, shelfIndex: nextShelf, cardIndex: 0 }));
          scrollToShelf(nextShelf);
        }
      } else if (eventType === 'select') {
        const item = activeShelf?.data?.[tvFocus.cardIndex];
        if (item) {
          playTVSelectFeedback();
          handleTorrentPress(item);
        }
      }
    }
  }, !keyboardVisible);

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={settings.mode === 'light' ? 'dark-content' : 'light-content'} backgroundColor={theme.bg} />

      {/* ─── YOUTUBE TV LEFT NAVIGATION RAIL ─── */}
      <TVNavigationRail
        currentRoute="Home"
        focusedItem={tvFocus.area === 'RAIL' ? NAV_ITEMS[tvFocus.railIndex]?.id : null}
        onNavigate={(route) => navigation.navigate(route)}
      />

      {/* ─── MAIN CONTENT AREA ─── */}
      <View style={[styles.mainContent, { backgroundColor: theme.bg }]}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MaterialIcons name="local-movies" size={24} color="#FF5722" />
            </View>
            <View>
              <Text style={[styles.appTitle, { color: theme.text }]}>ExtTorrent</Text>
              <Text style={[styles.appSub, { color: theme.textMuted }]}>CINEMA GLASS · NETFLIX TV</Text>
            </View>
          </View>

          <SearchTriggerButton
            isFocused={tvFocus.area === 'SEARCH'}
            onPress={() => isTV ? setKeyboardVisible(true) : navigation.navigate('Search', {})}
          />
        </View>

        <ScrollView
          ref={mainScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Categories Row */}
          <View style={styles.sectionWrap}>
            <SectionHeader title="Categories" icon="grid-view" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map((cat, idx) => (
                <CategoryChip
                  key={cat.slug}
                  cat={cat}
                  selected={selectedCategory === cat.slug}
                  isFocused={tvFocus.area === 'CATEGORIES' && tvFocus.catIndex === idx}
                  onPress={() => setSelectedCategory(cat.slug)}
                  onLongPress={() => handleCategoryPress(cat.slug)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Shelves */}
          {shelves.map((shelf, shelfIdx) => (
            <View key={shelf.id} style={styles.sectionWrap}>
              <SectionHeader
                title={shelf.title}
                icon="movie"
                onSeeAll={() => navigation.navigate('Browse', { category: selectedCategory })}
              />
              {shelf.data.length === 0 ? (
                <LoadingSpinner message={`Loading ${shelf.title}...`} />
              ) : (
                <FlatList
                  ref={ref => { shelfRefs.current[shelfIdx] = ref; }}
                  data={shelf.data}
                  keyExtractor={(item, i) => item.id || String(i)}
                  renderItem={({ item, index }) => (
                    <TorrentCard
                      torrent={item}
                      onPress={handleTorrentPress}
                      isFocused={tvFocus.area === 'SHELVES' && tvFocus.shelfIndex === shelfIdx && tvFocus.cardIndex === index}
                    />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.shelfListContent}
                />
              )}
            </View>
          ))}
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

function SearchTriggerButton({ onPress, isFocused = false }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.searchBarBtn,
        { backgroundColor: theme.input, borderColor: theme.border },
        isFocused && styles.searchBarBtnFocused,
      ]}
      activeOpacity={0.8}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
    >
      <MaterialIcons
        name="search"
        size={20}
        color={isFocused ? '#FFFFFF' : '#FF5722'}
      />
      <Text style={[styles.searchBtnText, { color: isFocused ? '#FFFFFF' : theme.textMuted }, isFocused && styles.searchBtnTextFocused]}>
        {isFocused ? 'PRESS OK TO TYPE' : 'Search movies, series, 4K...'}
      </Text>
      {isFocused && (
        <View style={styles.searchPointerBeacon}>
          <Text style={styles.searchPointerText}>SELECT</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CategoryChip({ cat, selected, isFocused = false, onPress, onLongPress }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.catChip,
        {
          backgroundColor: selected ? '#FF5722' : theme.card,
          borderColor: selected ? '#FF5722' : theme.border,
        },
        isFocused && styles.catChipFocused,
      ]}
      activeOpacity={0.8}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onLongPress={onLongPress}
    >
      <MaterialIcons
        name={cat.icon}
        size={16}
        color={selected || isFocused ? '#FFFFFF' : theme.textSub}
      />
      <Text
        style={[
          styles.catText,
          { color: selected || isFocused ? '#FFFFFF' : theme.textSub },
          selected && styles.catTextSelected,
        ]}
      >
        {cat.name}
      </Text>
    </TouchableOpacity>
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
    fontWeight: '800',
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
    color: '#FF5722',
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
});
