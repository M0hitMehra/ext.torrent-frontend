/**
 * SearchScreen.js
 * High-contrast Neumorphic search screen with persistent search history,
 * category filters, sort chips, and TV D-pad keyboard integration.
 * Fully optimized for Android TV remote with visible pointer indicators and audio feedback.
 */

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
import { TVNavigationRail } from '../components/TVNavigationRail';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/Common';
import { getSearchHistory, addSearchQuery, removeSearchQuery, clearSearchHistory } from '../utils/history';
import { useTVFocus, playTVSelectFeedback } from '../hooks';

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
    <View style={styles.outerContainer}>
      {/* ─── YOUTUBE TV LEFT NAVIGATION RAIL ─── */}
      <TVNavigationRail
        currentRoute="Search"
        onNavigate={(target) => navigation.navigate(target)}
      />

      <View style={styles.mainContent}>
        {/* ─── NEUMORPHIC SEARCH BAR ─── */}
        <View style={styles.searchBar}>
          {!isTV && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}

          {isTV ? (
            <TVSearchInput
              query={query}
              onPress={() => setKeyboardVisible(true)}
            />
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

          <SearchActionSubmitButton onPress={() => handleSearchSubmit(query)} />
        </View>

        {/* ─── SORT OPTIONS (When searched) ─── */}
        {hasSearched && (
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((opt) => (
              <SortChip
                key={opt.value + opt.order}
                opt={opt}
                isActive={sort.value === opt.value && sort.order === opt.order}
                onPress={() => { setSort(opt); doSearch(query, 1, opt); setResults([]); }}
              />
            ))}
          </View>
        )}

        {/* ─── SEARCH HISTORY (When idle before searching) ─── */}
        {!hasSearched && history.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <MaterialIcons name="history" size={20} color={COLORS.primaryGlow} />
                <Text style={styles.historyTitle}>Recent Searches</Text>
              </View>
              <TouchableOpacity
                onPress={handleClearAllHistory}
                style={styles.clearAllBtn}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.historyChipsWrap}>
              {history.map((item, idx) => (
                <HistoryChip
                  key={idx}
                  item={item}
                  onSelect={() => handleSelectHistory(item)}
                  onRemove={() => handleRemoveHistoryItem(item)}
                />
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
            renderItem={({ item, index }) => (
              <TorrentCard
                torrent={item}
                onPress={handleTorrentPress}
                hasPreferredFocus={index === 0 && isTV}
              />
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
      </View>

      {/* TV On-Screen Keyboard */}
      <TVKeyboard
        visible={keyboardVisible}
        onClose={() => setKeyboardVisible(false)}
        onSearch={handleSearchSubmit}
      />
    </View>
  );
}

function TVSearchInput({ query, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      hasTVPreferredFocus={isTV}
      accessibilityRole="button"
      accessibilityLabel={query ? `Search query ${query}. Press OK to edit.` : 'Search titles. Press OK to open the TV keyboard.'}
      style={[styles.tvInput, focused && styles.tvInputFocused]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name="search"
        size={22}
        color={focused ? '#FFFFFF' : COLORS.primaryGlow}
      />
      <Text style={[styles.tvInputText, query && styles.tvInputTextFilled, focused && styles.tvInputTextFocused]}>
        {query || 'Press OK to type with TV Remote...'}
      </Text>
      {focused && (
        <View style={styles.tvInputBeacon}>
          <Text style={styles.tvInputBeaconText}>KEYBOARD</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SearchActionSubmitButton({ onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[styles.searchActionBtn, focused && styles.searchActionBtnFocused]}
    >
      <MaterialIcons name="arrow-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

function SortChip({ opt, isActive, onPress }) {
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

function HistoryChip({ item, onSelect, onRemove }) {
  const { focused, onFocus, onBlur } = useTVFocus();

  return (
    <TouchableOpacity
      style={[styles.historyChip, focused && styles.historyChipFocused]}
      onPress={() => {
        playTVSelectFeedback();
        onSelect();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons name="search" size={14} color={focused ? '#FFFFFF' : COLORS.primaryGlow} />
      <Text style={[styles.historyChipText, focused && styles.historyChipTextFocused]}>
        {item}
      </Text>
      <TouchableOpacity
        onPress={() => {
          playTVSelectFeedback();
          onRemove();
        }}
        style={styles.historyRemoveBtn}
      >
        <MaterialIcons name="close" size={14} color={focused ? '#FFFFFF' : COLORS.textMuted} />
      </TouchableOpacity>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1.5,
    borderColor: COLORS.cardHighlight,
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
    gap: 10,
    backgroundColor: COLORS.input,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tvInputFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.03 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 12,
  },
  tvInputText: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
  tvInputTextFilled: { color: COLORS.text },
  tvInputTextFocused: { color: '#FFFFFF', fontWeight: '800' },
  tvInputBeacon: {
    backgroundColor: COLORS.tvPointer,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tvInputBeaconText: { color: '#000000', fontSize: 9, fontWeight: '900' },
  searchActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  searchActionBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.1 }],
    shadowColor: COLORS.primaryGlow,
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 12,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
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

  // History Section
  historySection: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1.5,
    borderColor: COLORS.cardHighlight,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  clearAllBtn: { padding: 4 },
  clearAllText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  historyChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  historyChipFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.08 }],
    shadowColor: COLORS.primaryGlow,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  historyChipText: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  historyChipTextFocused: { color: '#FFFFFF' },
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
  promptTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  promptText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  listContent: { padding: 16, paddingBottom: 60 },
  resultCount: { color: COLORS.textMuted, fontSize: 12, marginBottom: 12, fontWeight: '700' },
});
