/**
 * SearchScreen.js
 * Neumorphic search screen with persistent search history,
 * category filters, sort chips, and TV D-pad keyboard integration.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  Platform, TouchableOpacity, Keyboard, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SORT_OPTIONS, NEU_STYLES } from '../constants';
import { searchTorrents } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { TVKeyboard } from '../components/TVKeyboard';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/Common';
import { getSearchHistory, addSearchQuery, removeSearchQuery, clearSearchHistory } from '../utils/history';

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
  const [history, setHistory] = useState([]);

  const inputRef = useRef(null);

  // Load search history on mount
  useEffect(() => {
    getSearchHistory().then(setHistory);
  }, []);

  const doSearch = useCallback(async (q, p = 1, s = sort) => {
    if (!q || !q.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    // Save to persistent search history
    addSearchQuery(q.trim()).then(setHistory);

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
  }, [initialQuery, doSearch]);

  const handleSearchSubmit = useCallback((q) => {
    setQuery(q);
    setPage(1);
    setResults([]);
    doSearch(q, 1);
    Keyboard.dismiss();
  }, [doSearch]);

  const handleSelectHistory = useCallback((item) => {
    setQuery(item);
    handleSearchSubmit(item);
  }, [handleSearchSubmit]);

  const handleRemoveHistoryItem = useCallback(async (item) => {
    const updated = await removeSearchQuery(item);
    setHistory(updated);
  }, []);

  const handleClearAllHistory = useCallback(async () => {
    await clearSearchHistory();
    setHistory([]);
  }, []);

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
      {/* ─── NEUMORPHIC SEARCH BAR ─── */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        {isTV ? (
          <TouchableOpacity
            style={styles.tvInput}
            onPress={() => setKeyboardVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="search" size={20} color={COLORS.primaryGlow} />
            <Text style={[styles.tvInputText, query && styles.tvInputTextFilled]}>
              {query || 'Search movies, shows, anime...'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputWrap}>
            <MaterialIcons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search movies, shows, anime..."
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="search"
              onSubmitEditing={() => handleSearchSubmit(query)}
              autoFocus={!initialQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }} style={styles.clearBtn}>
                <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity onPress={() => handleSearchSubmit(query)} style={styles.searchActionBtn}>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ─── SORT OPTIONS (When searched) ─── */}
      {hasSearched && (
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value + opt.order}
              style={[styles.sortChip, sort.value === opt.value && sort.order === opt.order && styles.sortChipActive]}
              onPress={() => { setSort(opt); doSearch(query, 1, opt); setResults([]); }}
            >
              <Text style={[styles.sortText, sort.value === opt.value && sort.order === opt.order && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ─── SEARCH HISTORY (When idle before searching) ─── */}
      {!hasSearched && history.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View style={styles.historyTitleRow}>
              <MaterialIcons name="history" size={18} color={COLORS.primaryGlow} />
              <Text style={styles.historyTitle}>Recent Searches</Text>
            </View>
            <TouchableOpacity onPress={handleClearAllHistory}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyChipsWrap}>
            {history.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.historyChip}
                onPress={() => handleSelectHistory(item)}
              >
                <Text style={styles.historyChipText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveHistoryItem(item)}
                  style={styles.historyRemoveBtn}
                >
                  <MaterialIcons name="close" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ─── RESULTS LIST ─── */}
      {!hasSearched && history.length === 0 ? (
        <View style={styles.prompt}>
          <View style={styles.promptIconCircle}>
            <MaterialIcons name="travel-explore" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.promptTitle}>Discover Millions of Torrents</Text>
          <Text style={styles.promptText}>Search any movie, TV series, anime, game, software, or music</Text>
        </View>
      ) : loading && page === 1 ? (
        <LoadingSpinner message={`Searching "${query}"...`} />
      ) : error ? (
        <ErrorView message={error} onRetry={() => doSearch(query)} />
      ) : results.length === 0 && hasSearched ? (
        <EmptyView message={`No results for "${query}". Try another title.`} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={({ item }) => (
            <TorrentCard torrent={item} onPress={handleTorrentPress} />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading ? <LoadingSpinner message="Loading more..." /> : null}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              Found {results.length} torrents for "{query}"
            </Text>
          }
        />
      )}

      {/* TV On-Screen Keyboard */}
      <TVKeyboard
        visible={keyboardVisible}
        onClose={() => setKeyboardVisible(false)}
        onSearch={handleSearchSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
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
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  searchIcon: { marginRight: 6 },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  clearBtn: { padding: 4 },
  tvInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  tvInputText: { color: COLORS.textMuted, fontSize: 14 },
  tvInputTextFilled: { color: COLORS.text },
  searchActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
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
    borderRadius: 10,
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
  sortText: { color: COLORS.textSub, fontSize: 11, fontWeight: '700' },
  sortTextActive: { color: '#fff' },

  // History Section
  historySection: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  clearAllText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  historyChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  historyChipText: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },
  historyRemoveBtn: { padding: 2 },

  prompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 36,
  },
  promptIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    marginBottom: 8,
  },
  promptTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  promptText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  listContent: { padding: 16, paddingBottom: 50 },
  resultCount: { color: COLORS.textMuted, fontSize: 12, marginBottom: 12, fontWeight: '600' },
});
