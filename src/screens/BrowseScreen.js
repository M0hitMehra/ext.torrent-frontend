/**
 * BrowseScreen.js
 * Netflix-style Category Explorer with Segmented Controls and TV Remote Support.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../constants';
import { browseTorrents, getLatest, getTrending } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { TVNavigationRail, NAV_ITEMS } from '../components/TVNavigationRail';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/Common';
import { playTVFocusFeedback, playTVSelectFeedback, useTVRemote } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';

const isTV = Platform.isTV;
const TABS = ['Trending', 'Browse', 'Latest'];
const SORT_OPTIONS = [
  { label: '🔥 Top Seeders', value: 'seeders', order: 'desc' },
  { label: '⚡ Newest First', value: 'time', order: 'desc' },
  { label: '📦 Largest Size', value: 'size', order: 'desc' },
];

export default function BrowseScreen({ route, navigation }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  const initialCat = route.params?.category || 'all';
  const initialTab = route.params?.tab === 'latest' ? 2 : route.params?.tab === 'trending' ? 0 : 1;

  const [tab, setTab] = useState(initialTab);
  const [category, setCategory] = useState(initialCat);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // TV Remote Navigation State
  // area: 'RAIL' | 'TABS' | 'CATEGORIES' | 'GRID'
  const [tvFocus, setTvFocus] = useState({
    area: 'GRID',
    railIndex: 2, // Browse
    tabIndex: initialTab,
    catIndex: 0,
    cardIndex: 0,
  });

  const fetchData = useCallback(async (currentTab, currentCat, p, currentSort, append = false) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (currentTab === 0) {
        res = await getTrending(currentCat, p);
      } else if (currentTab === 2) {
        res = await getLatest(p);
      } else {
        res = await browseTorrents({ category: currentCat, page: p, sort: currentSort.value, order: currentSort.order });
      }
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
  }, []);

  useEffect(() => {
    fetchData(tab, category, 1, sort, false);
  }, [tab, category, sort, fetchData]);

  const loadMore = () => {
    if (!loading && page < totalPages) {
      fetchData(tab, category, page + 1, sort, true);
    }
  };

  const numCols = isTV ? 4 : 2;

  // TV Remote Key Handler
  useTVRemote((eventType) => {
    if (tvFocus.area === 'RAIL') {
      if (eventType === 'up') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, railIndex: Math.max(0, f.railIndex - 1) }));
      } else if (eventType === 'down') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, railIndex: Math.min(NAV_ITEMS.length - 1, f.railIndex + 1) }));
      } else if (eventType === 'right') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'GRID' }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        const routeName = NAV_ITEMS[tvFocus.railIndex]?.id;
        if (routeName && routeName !== 'Browse') {
          navigation.navigate(routeName);
        }
      }
    } else if (tvFocus.area === 'TABS') {
      if (eventType === 'left') {
        if (tvFocus.tabIndex > 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, tabIndex: f.tabIndex - 1 }));
        } else {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 2 }));
        }
      } else if (eventType === 'right') {
        if (tvFocus.tabIndex < TABS.length - 1) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, tabIndex: f.tabIndex + 1 }));
        }
      } else if (eventType === 'down') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'CATEGORIES' }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        setTab(tvFocus.tabIndex);
        setData([]);
        setPage(1);
      }
    } else if (tvFocus.area === 'CATEGORIES') {
      if (eventType === 'left') {
        if (tvFocus.catIndex > 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, catIndex: f.catIndex - 1 }));
        } else {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 2 }));
        }
      } else if (eventType === 'right') {
        if (tvFocus.catIndex < CATEGORIES.length - 1) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, catIndex: f.catIndex + 1 }));
        }
      } else if (eventType === 'up') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'TABS' }));
      } else if (eventType === 'down') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'GRID', cardIndex: 0 }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        setCategory(CATEGORIES[tvFocus.catIndex].slug);
        setData([]);
        setPage(1);
      }
    } else if (tvFocus.area === 'GRID') {
      if (eventType === 'left') {
        if (tvFocus.cardIndex % numCols === 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 2 }));
        } else if (tvFocus.cardIndex > 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex - 1 }));
        }
      } else if (eventType === 'right') {
        if (tvFocus.cardIndex < data.length - 1) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex + 1 }));
        }
      } else if (eventType === 'up') {
        if (tvFocus.cardIndex >= numCols) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex - numCols }));
        } else {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'CATEGORIES' }));
        }
      } else if (eventType === 'down') {
        if (tvFocus.cardIndex + numCols < data.length) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex + numCols }));
        }
      } else if (eventType === 'select') {
        const item = data[tvFocus.cardIndex];
        if (item) {
          playTVSelectFeedback();
          navigation.navigate('TorrentDetail', { torrent: item });
        }
      }
    }
  });

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.bg }]}>
      {/* ─── YOUTUBE TV LEFT NAVIGATION RAIL ─── */}
      <TVNavigationRail
        currentRoute="Browse"
        focusedItem={tvFocus.area === 'RAIL' ? NAV_ITEMS[tvFocus.railIndex]?.id : null}
        onNavigate={(target) => navigation.navigate(target)}
      />

      <View style={[styles.mainContent, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Explore Torrents</Text>
        </View>

        {/* Segmented Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
          {TABS.map((t, i) => (
            <TabSegmentBtn
              key={t}
              label={t}
              isActive={tab === i}
              isFocused={tvFocus.area === 'TABS' && tvFocus.tabIndex === i}
              onPress={() => { setTab(i); setData([]); setPage(1); }}
            />
          ))}
        </View>

        {/* Category Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {CATEGORIES.map((cat, idx) => (
            <BrowseCatChip
              key={cat.slug}
              cat={cat}
              isSelected={category === cat.slug}
              isFocused={tvFocus.area === 'CATEGORIES' && tvFocus.catIndex === idx}
              onPress={() => { setCategory(cat.slug); setData([]); setPage(1); }}
            />
          ))}
        </ScrollView>

        {/* Sort Options (Browse tab only) */}
        {tab === 1 && (
          <View style={[styles.sortRow, { backgroundColor: theme.bg }]}>
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
            key={isTV ? 'b-tv' : 'b-mob'}
            numColumns={numCols}
            data={data}
            keyExtractor={(item, i) => item.id || String(i)}
            renderItem={({ item, index }) => (
              <TorrentCard
                torrent={item}
                onPress={(t) => navigation.navigate('TorrentDetail', { torrent: t })}
                isFocused={tvFocus.area === 'GRID' && tvFocus.cardIndex === index}
                style={{ flex: 1, maxWidth: isTV ? '25%' : '50%', marginBottom: 14 }}
              />
            )}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 4 }}
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

function TabSegmentBtn({ label, isActive, isFocused, onPress }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <TouchableOpacity
      style={[
        styles.tabBtn,
        { backgroundColor: isActive ? '#FF5722' : 'transparent' },
        isFocused && styles.tabBtnFocused,
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.tabText,
          { color: (isActive || isFocused) ? '#FFFFFF' : theme.textMuted },
          (isActive || isFocused) && { fontWeight: '900' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BrowseCatChip({ cat, isSelected, isFocused, onPress }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <TouchableOpacity
      style={[
        styles.catChip,
        { backgroundColor: isSelected ? '#FF5722' : theme.card, borderColor: isSelected ? '#FF5722' : theme.border },
        isFocused && styles.catChipFocused,
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
    >
      <Text
        style={[
          styles.catText,
          { color: (isSelected || isFocused) ? '#FFFFFF' : theme.textSub },
          (isSelected || isFocused) && { fontWeight: '900' },
        ]}
      >
        {cat.name}
      </Text>
    </TouchableOpacity>
  );
}

function BrowseSortChip({ opt, isActive, onPress }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <TouchableOpacity
      style={[
        styles.sortChip,
        { backgroundColor: isActive ? '#FF5722' : theme.card, borderColor: theme.border },
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
    >
      <Text style={[styles.sortText, { color: isActive ? '#FFFFFF' : theme.textSub }]}>
        {opt.label}
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
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnFocused: {
    borderColor: '#FFFFFF',
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: '#FF5722',
    transform: [{ scale: 1.05 }],
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  catRow: { paddingHorizontal: 16, paddingVertical: 12 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  catChipFocused: {
    borderColor: '#FFFFFF',
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: '#FF5722',
    transform: [{ scale: 1.1 }],
  },
  catText: { fontSize: 12, fontWeight: '700' },
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
    borderWidth: 1,
  },
  sortText: { fontSize: 11, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 60 },
});
