import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  Platform, TouchableOpacity, Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SORT_OPTIONS } from '../constants';
import { searchTorrents } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { TVKeyboard } from '../components/TVKeyboard';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/Common';
import { useDebounce } from '../hooks';

const isTV = Platform.isTV;

export default function SearchScreen({ navigation, route }) {
  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);

  const doSearch = useCallback(async (q, p = 1, s = sort) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await searchTorrents({ q: q.trim(), page: p, sort: s.value, order: s.order });
      if (p === 1) {
        setResults(res.torrents || []);
      } else {
        setResults(prev => [...prev, ...(res.torrents || [])]);
      }
      setTotalPages(res.totalPages || 1);
      setPage(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, []);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    setPage(1);
    setResults([]);
    doSearch(q, 1);
    Keyboard.dismiss();
  }, [doSearch]);

  const loadMore = useCallback(() => {
    if (!loading && page < totalPages) {
      doSearch(query, page + 1);
    }
  }, [loading, page, totalPages, query, doSearch]);

  const handleTorrentPress = useCallback((torrent) => {
    navigation.navigate('TorrentDetail', { torrent });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {isTV ? (
          <TouchableOpacity
            style={styles.tvInput}
            onPress={() => setKeyboardVisible(true)}
          >
            <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
            <Text style={[styles.tvInputText, query && styles.tvInputTextFilled]}>
              {query || 'Type to search...'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search movies, shows, music..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(query)}
            autoFocus={!initialQuery}
          />
        )}

        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
            <MaterialIcons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={() => handleSearch(query)} style={styles.searchAction}>
          <MaterialIcons name="search" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      {hasSearched && (
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value + opt.order}
              style={[styles.sortChip, sort === opt && styles.sortChipActive]}
              onPress={() => { setSort(opt); doSearch(query, 1, opt); setResults([]); }}
            >
              <Text style={[styles.sortText, sort === opt && styles.sortTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      {!hasSearched ? (
        <View style={styles.prompt}>
          <MaterialIcons name="search" size={64} color={COLORS.border} />
          <Text style={styles.promptText}>Search any movie, TV show, music, game or software</Text>
        </View>
      ) : loading && page === 1 ? (
        <LoadingSpinner message={`Searching "${query}"...`} />
      ) : error ? (
        <ErrorView message={error} onRetry={() => doSearch(query)} />
      ) : results.length === 0 ? (
        <EmptyView message={`No results for "${query}". Try different keywords.`} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={({ item }) => (
            <TorrentCard torrent={item} onPress={handleTorrentPress} style={styles.cardPad} />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading ? <LoadingSpinner message="Loading more..." /> : null}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {results.length} results for "{query}"
            </Text>
          }
        />
      )}

      {/* TV Keyboard */}
      <TVKeyboard
        visible={keyboardVisible}
        onClose={() => setKeyboardVisible(false)}
        onSearch={handleSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tvInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tvInputText: { color: COLORS.textMuted, fontSize: 15 },
  tvInputTextFilled: { color: COLORS.text },
  searchAction: { padding: 4 },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortText: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },
  sortTextActive: { color: '#fff' },
  prompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  promptText: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: { padding: 16, paddingBottom: 40 },
  cardPad: { marginBottom: 10 },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
});
