/**
 * SearchScreen.js
 * High-contrast Neumorphic search screen with persistent search history,
 * category filters, sort chips, and TV D-pad keyboard integration.
 * Fully optimized for Android TV remote with visible pointer indicators and audio feedback.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  Platform, Keyboard,
} from 'react-native';
import { FocusableOpacity } from '../components/FocusableOpacity';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SORT_OPTIONS } from '../constants';
import { searchTorrents } from '../api/torrentApi';
import { TorrentCard } from '../components/TorrentCard';
import { TVKeyboard } from '../components/TVKeyboard';
import { TVNavigationRail, NAV_ITEMS } from '../components/TVNavigationRail';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/Common';
import { getSearchHistory, addSearchQuery, removeSearchQuery, clearSearchHistory } from '../utils/history';
import { useTVFocus, playTVFocusFeedback, playTVSelectFeedback, useTVRemote } from '../hooks';
import { useFocusEffect } from '@react-navigation/native';
import { getTheme, useAppSettings } from '../utils/settings';

const isTV = Platform.isTV;

export default function SearchScreen({ navigation, route }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // TV Remote Navigation State
  // area: 'RAIL' | 'INPUT' | 'RESULTS'
  const [tvFocus, setTvFocus] = useState({
    area: 'INPUT',
    railIndex: 0, // Search
    cardIndex: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState([]);

  const inputRef = useRef(null);

  // Load search history on mount
  useFocusEffect(useCallback(() => {
    getSearchHistory().then(setHistory);
  }, []));

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

  const numCols = isTV ? 4 : 2;

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
        setTvFocus(f => ({ ...f, area: 'INPUT' }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        const routeName = NAV_ITEMS[tvFocus.railIndex]?.id;
        if (routeName && routeName !== 'Search') {
          navigation.navigate(routeName);
        }
      }
    } else if (tvFocus.area === 'INPUT') {
      if (eventType === 'left') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 0 }));
      } else if (eventType === 'down') {
        if (results.length > 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'RESULTS', cardIndex: 0 }));
        }
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        setKeyboardVisible(true);
      }
    } else if (tvFocus.area === 'RESULTS') {
      if (eventType === 'left') {
        if (tvFocus.cardIndex % numCols === 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 0 }));
        } else if (tvFocus.cardIndex > 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex - 1 }));
        }
      } else if (eventType === 'right') {
        if (tvFocus.cardIndex < results.length - 1) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex + 1 }));
        }
      } else if (eventType === 'up') {
        if (tvFocus.cardIndex >= numCols) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex - numCols }));
        } else {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, area: 'INPUT' }));
        }
      } else if (eventType === 'down') {
        if (tvFocus.cardIndex + numCols < results.length) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, cardIndex: f.cardIndex + numCols }));
        }
      } else if (eventType === 'select') {
        const item = results[tvFocus.cardIndex];
        if (item) {
          playTVSelectFeedback();
          handleTorrentPress(item);
        }
      }
    }
  }, !keyboardVisible);

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.bg }]}>
      {/* ─── YOUTUBE TV LEFT NAVIGATION RAIL ─── */}
      <TVNavigationRail
        currentRoute="Search"
        focusedItem={tvFocus.area === 'RAIL' ? NAV_ITEMS[tvFocus.railIndex]?.id : null}
        onNavigate={(target) => navigation.navigate(target)}
      />

      <View style={[styles.mainContent, { backgroundColor: theme.bg }]}>
        {/* ─── NEUMORPHIC SEARCH BAR ─── */}
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {!isTV && (
            <FocusableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
            </FocusableOpacity>
          )}

          {isTV ? (
            <TVSearchInput
              query={query}
              isFocused={tvFocus.area === 'INPUT'}
              onPress={() => setKeyboardVisible(true)}
            />
          ) : (
            <View style={[styles.inputWrap, { backgroundColor: theme.input, borderColor: theme.border }]}>
              <MaterialIcons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                value={query}
                onChangeText={setQuery}
                placeholder="Search movies, shows, anime..."
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="search"
                onSubmitEditing={() => handleSearchSubmit(query)}
                autoFocus={!initialQuery}
              />
              {query.length > 0 && (
                <FocusableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }} style={styles.clearBtn}>
                  <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
                </FocusableOpacity>
              )}
            </View>
          )}

          <SearchActionSubmitButton onPress={() => handleSearchSubmit(query)} />
        </View>

        {/* ─── SORT OPTIONS (When searched) ─── */}
        {hasSearched && (
          <View style={[styles.sortRow, { backgroundColor: theme.surface }]}>
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
          <View style={[styles.historySection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <MaterialIcons name="history" size={20} color={COLORS.primaryGlow} />
                <Text style={styles.historyTitle}>Recent Searches</Text>
              </View>
              <ClearHistoryButton onPress={handleClearAllHistory} />
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
            <Text style={[styles.promptTitle, { color: theme.text }]}>Discover Torrents</Text>
            <Text style={[styles.promptText, { color: theme.textSub }]}>Search movies, TV series, anime, games, software, or music</Text>
          </View>
        ) : loading && page === 1 ? (
          <LoadingSpinner message={`Searching "${query}"...`} />
        ) : error ? (
          <ErrorView message={error} onRetry={() => doSearch(query)} />
        ) : results.length === 0 && hasSearched ? (
          <EmptyView message={`No results for "${query}". Try another title.`} />
        ) : (
          <FlatList
            key={isTV ? 's-tv' : 's-mob'}
            numColumns={isTV ? 4 : 2}
            data={results}
            keyExtractor={(item, i) => item.id || String(i)}
            renderItem={({ item, index }) => (
              <TorrentCard
                torrent={item}
                onPress={handleTorrentPress}
                isFocused={tvFocus.area === 'RESULTS' && tvFocus.cardIndex === index}
                style={{ flex: 1, maxWidth: isTV ? '25%' : '50%', marginBottom: 14 }}
              />
            )}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 4 }}
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

function TVSearchInput({ query, isFocused = false, onPress }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={query ? `Search query ${query}. Press OK to edit.` : 'Search titles. Press OK to open the TV keyboard.'}
      style={[
        styles.tvInput,
        { backgroundColor: theme.input, borderColor: theme.border },
        isFocused && styles.tvInputFocused,
      ]}
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name="search"
        size={22}
        color={isFocused ? '#FFFFFF' : '#FF5722'}
      />
      <Text style={[styles.tvInputText, { color: query ? theme.text : theme.textMuted }, query && styles.tvInputTextFilled, isFocused && styles.tvInputTextFocused]}>
        {query || 'Press OK to type with TV Remote...'}
      </Text>
      {isFocused && (
        <View style={styles.tvInputBeacon}>
          <Text style={styles.tvInputBeaconText}>KEYBOARD</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SearchActionSubmitButton({ onPress }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();

  return (
    <FocusableOpacity
      onPress={() => {
        playTVSelectFeedback();
        onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[styles.searchActionBtn, focused && styles.searchActionBtnFocused, focused && focusStyle]}
    >
      <MaterialIcons name="arrow-forward" size={20} color="#fff" />
    </FocusableOpacity>
  );
}

function SortChip({ opt, isActive, onPress }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <FocusableOpacity
      style={[
        styles.sortChip,
        { backgroundColor: isActive ? COLORS.primary : theme.card, borderColor: theme.border },
        isActive && styles.sortChipActive,
        focused && styles.sortChipFocused,
        focused && focusStyle,
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
          { color: isActive || focused ? '#fff' : theme.textSub },
          isActive && styles.sortTextActive,
          focused && styles.sortTextFocused,
        ]}
      >
        {opt.label}
      </Text>
    </FocusableOpacity>
  );
}

function HistoryChip({ item, onSelect, onRemove }) {
  const { focused, onFocus, onBlur, focusStyle } = useTVFocus();
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <FocusableOpacity
      style={[styles.historyChip, { backgroundColor: theme.card, borderColor: theme.border }, focused && styles.historyChipFocused, focused && focusStyle]}
      onPress={() => {
        playTVSelectFeedback();
        onSelect();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons name="search" size={14} color={focused ? '#FFFFFF' : COLORS.primaryGlow} />
      <Text style={[styles.historyChipText, { color: theme.textSub }, focused && styles.historyChipTextFocused]}>
        {item}
      </Text>
      <HistoryRemoveButton onPress={onRemove} />
    </FocusableOpacity>
  );
}

function HistoryRemoveButton({ onPress }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <FocusableOpacity onPress={() => { playTVSelectFeedback(); onPress(); }} onFocus={onFocus} onBlur={onBlur} style={[styles.historyRemoveBtn, focused && focusStyle]} accessibilityLabel="Remove search from history">
      <MaterialIcons name="close" size={14} color={focused ? '#FFFFFF' : COLORS.textMuted} />
    </FocusableOpacity>
  );
}

function ClearHistoryButton({ onPress }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <FocusableOpacity onPress={() => { playTVSelectFeedback(); onPress(); }} onFocus={onFocus} onBlur={onBlur} style={[styles.clearAllBtn, focused && focusStyle]} accessibilityRole="button">
      <Text style={styles.clearAllText}>Clear All</Text>
    </FocusableOpacity>
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
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: '#FF5722',
    transform: [{ scale: 1.03 }],
    shadowColor: '#FF5722',
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
