/**
 * HomeScreen.js
 * High-contrast Neumorphic TV & Mobile dashboard.
 * Features:
 *  - YouTube TV style left-side navigation rail (TV only)
 *  - High-visibility focus highlights with audio-haptic feedback
 *  - Categorized browsing & trending torrents
 *  - TV on-screen keyboard integration
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform,
  TouchableOpacity, StatusBar, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../constants';
import { getTrending, getLatest } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { TVKeyboard } from '../components/TVKeyboard';
import { TVNavigationRail } from '../components/TVNavigationRail';
import { LoadingSpinner, ErrorView, SectionHeader } from '../components/Common';
import { useFetch, useTVFocus, playTVSelectFeedback } from '../hooks';

const isTV = Platform.isTV;

export default function HomeScreen({ navigation }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const {
    data: trendingData,
    loading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useFetch(() => getTrending(selectedCategory), [selectedCategory]);

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

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ─── YOUTUBE TV LEFT NAVIGATION RAIL ─── */}
      <TVNavigationRail
        currentRoute="Home"
        onNavigate={(route) => navigation.navigate(route)}
      />

      {/* ─── MAIN CONTENT AREA ─── */}
      <View style={styles.mainContent}>
        {/* ─── NEUMORPHIC TOP BAR ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="local-movies" size={24} color={COLORS.primaryGlow} />
            </View>
            <View>
              <Text style={styles.appTitle}>ExtTorrent</Text>
              <Text style={styles.appSub}>Neumorphic TV & Mobile</Text>
            </View>
          </View>

          {/* Focusable Search Trigger Button */}
          <SearchTriggerButton
            onPress={() => isTV ? setKeyboardVisible(true) : navigation.navigate('Search', {})}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Categories Section */}
          <SectionHeader title="Browse Categories" icon="grid-view" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {CATEGORIES.map((cat, idx) => (
              <CategoryChip
                key={cat.slug}
                cat={cat}
                selected={selectedCategory === cat.slug}
                onPress={() => setSelectedCategory(cat.slug)}
                onLongPress={() => handleCategoryPress(cat.slug)}
              />
            ))}
          </ScrollView>

          {/* Trending Torrents */}
          <SectionHeader
            title="🔥 Trending Now"
            icon="trending-up"
            onSeeAll={() => navigation.navigate('Browse', { category: selectedCategory, tab: 'trending' })}
          />
          {trendingLoading ? (
            <LoadingSpinner message="Fetching trending torrents..." />
          ) : trendingError ? (
            <ErrorView message={trendingError} onRetry={refetchTrending} />
          ) : (
            <FlatList
              data={trendingData?.torrents?.slice(0, 10) || []}
              keyExtractor={(item, i) => item.id || String(i)}
              renderItem={({ item, index }) => (
                <TorrentCard
                  torrent={item}
                  onPress={handleTorrentPress}
                  hasPreferredFocus={index === 0 && isTV}
                />
              )}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Loading torrents from indexer...</Text>
                </View>
              }
            />
          )}

          {/* Latest Releases */}
          <SectionHeader
            title="⚡ Latest Uploads"
            icon="new-releases"
            onSeeAll={() => navigation.navigate('Browse', { tab: 'latest' })}
          />
          {latestLoading ? (
            <LoadingSpinner message="Loading latest torrents..." />
          ) : (
            <FlatList
              data={latestData?.torrents?.slice(0, 8) || []}
              keyExtractor={(item, i) => item.id || String(i)}
              renderItem={({ item }) => (
                <TorrentCard torrent={item} onPress={handleTorrentPress} />
              )}
              scrollEnabled={false}
            />
          )}
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
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      style={[styles.searchBarBtn, focused && styles.searchBarBtnFocused]}
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
        color={focused ? '#FFFFFF' : COLORS.primaryGlow}
      />
      <Text style={[styles.searchBtnText, focused && styles.searchBtnTextFocused]}>
        {focused ? 'PRESS OK TO TYPE' : 'Search movies, series...'}
      </Text>
      {focused && (
        <View style={styles.searchPointerBeacon}>
          <Text style={styles.searchPointerText}>SELECT</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CategoryChip({ cat, selected, onPress, onLongPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      style={[
        styles.catChip,
        selected && styles.catChipSelected,
        focused && styles.catChipFocused,
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onLongPress={onLongPress}
      onFocus={onFocus}
      onBlur={onBlur}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={cat.icon}
        size={16}
        color={selected || focused ? '#FFFFFF' : COLORS.textSub}
      />
      <Text
        style={[
          styles.catLabel,
          selected && styles.catLabelSelected,
          focused && styles.catLabelFocused,
        ]}
      >
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1.5,
    borderColor: COLORS.cardHighlight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  appTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  appSub: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', marginTop: 1 },
  searchBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 14,
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  searchBarBtnFocused: {
    backgroundColor: COLORS.primary,
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.04 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 12,
  },
  searchBtnText: { color: COLORS.textMuted, fontSize: 13, flex: 1 },
  searchBtnTextFocused: { color: '#FFFFFF', fontWeight: '800' },
  searchPointerBeacon: {
    backgroundColor: COLORS.tvPointer,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  searchPointerText: { color: '#000000', fontSize: 9, fontWeight: '900' },
  scroll: { padding: 18, paddingBottom: 60 },
  catRow: { marginBottom: 18, marginHorizontal: -4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  catChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  catChipFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.surfaceElevated,
    transform: [{ scale: 1.1 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 12,
  },
  catLabel: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  catLabelSelected: { color: '#fff' },
  catLabelFocused: { color: '#FFFFFF', fontWeight: '900' },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
