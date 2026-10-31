import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES, SORT_OPTIONS } from '../constants';
import { browseTorrents, getTrending, getLatest } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { LoadingSpinner, ErrorView, EmptyView, SectionHeader } from '../components/Common';

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
  }, []);

  useEffect(() => { fetchData(tab, category, 1, sort, false); }, [tab, category, sort]);

  const loadMore = () => {
    if (!loading && page < totalPages) fetchData(tab, category, page + 1, sort, true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === i && styles.tabActive]}
            onPress={() => { setTab(i); setData([]); setPage(1); }}
          >
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.catChip, category === cat.slug && styles.catChipSelected]}
            onPress={() => { setCategory(cat.slug); setData([]); setPage(1); }}
          >
            <Text style={[styles.catText, category === cat.slug && styles.catTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort (Browse tab only) */}
      {tab === 0 && (
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value + opt.order}
              style={[styles.sortChip, sort === opt && styles.sortChipActive]}
              onPress={() => setSort(opt)}
            >
              <Text style={[styles.sortText, sort === opt && styles.sortTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List */}
      {loading && data.length === 0 ? (
        <LoadingSpinner message="Loading..." />
      ) : error ? (
        <ErrorView message={error} onRetry={() => fetchData()} />
      ) : data.length === 0 ? (
        <EmptyView message="No torrents found." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={({ item }) => (
            <TorrentCard
              torrent={item}
              onPress={(t) => navigation.navigate('TorrentDetail', { torrent: t })}
              style={styles.cardPad}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading ? <LoadingSpinner message="Loading more..." /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  back: { padding: 4 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: { borderColor: COLORS.primary },
  tabText: { color: COLORS.textSub, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  catRow: { paddingHorizontal: 12, paddingVertical: 10 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },
  catTextSelected: { color: '#fff' },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortText: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },
  sortTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 40 },
  cardPad: { marginBottom: 10 },
});
