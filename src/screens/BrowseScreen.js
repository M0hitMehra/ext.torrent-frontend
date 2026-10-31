/**
 * BrowseScreen.js
 * High-contrast Neumorphic category and tab browser (Browse / Trending / Latest).
 * Fully integrated with YouTube TV style left-side navigation rail and remote focus states.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES, SORT_OPTIONS } from '../constants';
import { browseTorrents, getTrending, getLatest } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { TVNavigationRail } from '../components/TVNavigationRail';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/Common';
import { useTVFocus, playTVSelectFeedback } from '../hooks';

const isTV = Platform.isTV;
const TABS = ['Browse', 'Trending', 'Latest'];

export default function BrowseScreen({ navigation, route }) {
  const initCategory = route.params?.category || 'all';
  const initTab = route.params?.tab === 'trending' ? 1 : route.params?.tab === 'latest' ? 2 : 0;

  const [category, setCategory] = useState(initCategory);
  const [tab, setTab] = useState(initTab);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (t = tab, cat = category, p = 1, s = sort, append = false) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (t === 0) res = await browseTorrents({ category: cat, page: p, sort: s.value, order: s.order });
      else if (t === 1) res = await getTrending(cat);
      else res = await getLatest(p);

      const items = res.torrents || [];
      if (append) setData(prev => [...prev, ...items]);
      else setData(items);
      setTotalPages(res.totalPages || 1);
      setPage(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, category, sort]);

  useEffect(() => {
    fetchData(tab, category, 1, sort, false);
  }, [tab, category, sort, fetchData]);

  const loadMore = () => {
    if (!loading && page < totalPages) {
      fetchData(tab, category, page + 1, sort, true);
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* ─── YOUTUBE TV LEFT NAVIGATION RAIL ─── */}
      <TVNavigationRail
        currentRoute="Browse"
        onNavigate={(target) => navigation.navigate(target)}
      />

      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          {!isTV && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Explore Torrents</Text>
        </View>

        {/* Neumorphic Segmented Tab Switcher */}
        <View style={styles.tabContainer}>
          {TABS.map((t, i) => (
            <TabSegmentBtn
              key={t}
              label={t}
              isActive={tab === i}
              onPress={() => { setTab(i); setData([]); setPage(1); }}
            />
          ))}
        </View>

        {/* Category Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <BrowseCatChip
              key={cat.slug}
              cat={cat}
              isSelected={category === cat.slug}
              onPress={() => { setCategory(cat.slug); setData([]); setPage(1); }}
            />
          ))}
        </ScrollView>

        {/* Sort Options (Browse tab only) */}
        {tab === 0 && (
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((opt) => (
              <BrowseSortChip
                key={opt.value + opt.order}
                opt={opt}
                isActive={sort.value === opt.value && sort.order === opt.order}
                onPress={() => setSort(opt)}
              />
            ))}
          </View>
        )}

        {/* Torrent List */}
        {loading && data.length === 0 ? (
          <LoadingSpinner message="Loading catalog..." />
        ) : error ? (
          <ErrorView message={error} onRetry={() => fetchData(tab, category, 1, sort, false)} />
        ) : data.length === 0 ? (
          <EmptyView message="No torrents found in this category." />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, i) => item.id || String(i)}
            renderItem={({ item, index }) => (
              <TorrentCard
                torrent={item}
                onPress={(t) => navigation.navigate('TorrentDetail', { torrent: t })}
                hasPreferredFocus={index === 0 && isTV}
              />
            )}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loading ? <LoadingSpinner message="Loading more..." /> : null}
          />
        )}
      </View>
    </View>
  );
}

function TabSegmentBtn({ label, isActive, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      style={[
        styles.tabBtn,
        isActive && styles.tabBtnActive,
        focused && styles.tabBtnFocused,
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.tabText,
          isActive && styles.tabTextActive,
          focused && styles.tabTextFocused,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BrowseCatChip({ cat, isSelected, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      style={[
        styles.catChip,
        isSelected && styles.catChipSelected,
        focused && styles.catChipFocused,
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <Text
        style={[
          styles.catText,
          isSelected && styles.catTextSelected,
          focused && styles.catTextFocused,
        ]}
      >
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
}

function BrowseSortChip({ opt, isActive, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      style={[
        styles.sortChip,
        isActive && styles.sortChipActive,
        focused && styles.sortChipFocused,
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <Text
        style={[
          styles.sortText,
          isActive && styles.sortTextActive,
          focused && styles.sortTextFocused,
        ]}
      >
        {opt.label}
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1.5,
    borderColor: COLORS.cardHighlight,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.input,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  tabBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primaryGlow,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: COLORS.primaryGlow },
  tabTextFocused: { color: '#FFFFFF', fontWeight: '900' },
  catRow: { paddingHorizontal: 16, paddingVertical: 12 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  catChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.surfaceElevated,
    transform: [{ scale: 1.1 }],
    shadowColor: COLORS.primaryGlow,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  catText: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  catTextSelected: { color: '#fff' },
  catTextFocused: { color: '#FFFFFF', fontWeight: '900' },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.surfaceElevated,
    transform: [{ scale: 1.08 }],
  },
  sortText: { color: COLORS.textSub, fontSize: 11, fontWeight: '700' },
  sortTextActive: { color: '#fff' },
  sortTextFocused: { color: '#FFFFFF', fontWeight: '900' },
  listContent: { padding: 16, paddingBottom: 60 },
});
