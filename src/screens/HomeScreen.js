/**
 * HomeScreen.js
 * Neumorphic dark dashboard with trending, latest, and category explorer.
 * TV D-pad focus compatible with YouTube-TV keyboard.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform,
  TouchableOpacity, StatusBar, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES, NEU_STYLES } from '../constants';
import { getTrending, getLatest } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { TVKeyboard } from '../components/TVKeyboard';
import { LoadingSpinner, ErrorView, SectionHeader } from '../components/Common';
import { useFetch } from '../hooks';

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ─── NEUMORPHIC TOP BAR ─── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="local-movies" size={24} color={COLORS.primaryGlow} />
          </View>
          <View>
            <Text style={styles.appTitle}>ExtTorrent</Text>
            <Text style={styles.appSub}>Stream & Explore</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBarBtn}
          activeOpacity={0.8}
          onPress={() => isTV ? setKeyboardVisible(true) : navigation.navigate('Search', {})}
        >
          <MaterialIcons name="search" size={20} color={COLORS.primaryGlow} />
          <Text style={styles.searchBtnText}>Search movies, series...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Categories Section */}
        <SectionHeader title="Browse Categories" icon="grid-view" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
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
            renderItem={({ item }) => (
              <TorrentCard torrent={item} onPress={handleTorrentPress} />
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

      {/* TV On-Screen Keyboard */}
      <TVKeyboard
        visible={keyboardVisible}
        onClose={() => setKeyboardVisible(false)}
        onSearch={handleSearch}
      />
    </View>
  );
}

function CategoryChip({ cat, selected, onPress, onLongPress }) {
  const [focused, setFocused] = useState(false);
  return (
    <TouchableOpacity
      style={[
        styles.catChip,
        selected && styles.catChipSelected,
        focused && styles.catChipFocused,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={cat.icon}
        size={15}
        color={selected ? '#fff' : focused ? COLORS.primaryGlow : COLORS.textSub}
      />
      <Text style={[styles.catLabel, selected && styles.catLabelSelected]}>
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 14,
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  searchBtnText: { color: COLORS.textMuted, fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 50 },
  catRow: { marginBottom: 18, marginHorizontal: -4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
    borderColor: COLORS.tvFocus,
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  catLabel: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  catLabelSelected: { color: '#fff' },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
