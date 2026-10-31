import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform,
  TouchableOpacity, TextInput, StatusBar, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES, SORT_OPTIONS } from '../constants';
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="local-movies" size={28} color={COLORS.primary} />
          <Text style={styles.appTitle}>ExtTorrent</Text>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => isTV ? setKeyboardVisible(true) : navigation.navigate('Search', {})}
          onFocus={() => {}}
        >
          <MaterialIcons name="search" size={22} color={COLORS.text} />
          <Text style={styles.searchBtnText}>Search torrents...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Categories */}
        <SectionHeader title="Categories" icon="category" />
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

        {/* Trending */}
        <SectionHeader
          title="🔥 Trending"
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
            ListEmptyComponent={<Text style={styles.empty}>No trending data yet. Backend may be waking up.</Text>}
          />
        )}

        {/* Latest */}
        <SectionHeader
          title="🆕 Latest"
          icon="new-releases"
          onSeeAll={() => navigation.navigate('Browse', { tab: 'latest' })}
        />
        {latestLoading ? (
          <LoadingSpinner message="Loading latest..." />
        ) : (
          <FlatList
            data={latestData?.torrents?.slice(0, 6) || []}
            keyExtractor={(item, i) => item.id || String(i)}
            renderItem={({ item }) => (
              <TorrentCard torrent={item} onPress={handleTorrentPress} />
            )}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.empty}>No data yet.</Text>}
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
      style={[styles.catChip, selected && styles.catChipSelected, focused && styles.catChipFocused]}
      onPress={onPress}
      onLongPress={onLongPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      activeOpacity={0.8}
    >
      <MaterialIcons name={cat.icon} size={16} color={selected ? '#fff' : COLORS.textSub} />
      <Text style={[styles.catLabel, selected && styles.catLabelSelected]}>{cat.label}</Text>
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
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  searchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBtnText: { color: COLORS.textMuted, fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 40 },
  catRow: { marginBottom: 20, marginHorizontal: -4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipFocused: { borderColor: COLORS.tvFocus, borderWidth: 2, transform: [{ scale: 1.06 }] },
  catLabel: { color: COLORS.textSub, fontSize: 13, fontWeight: '600' },
  catLabelSelected: { color: '#fff' },
  empty: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
