import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAppSettings, getTheme, FOCUS_COLORS } from '../utils/settings';
import { playTVFocusFeedback, playTVSelectFeedback, useTVRemote } from '../hooks';
import { TVNavigationRail, NAV_ITEMS } from '../components/TVNavigationRail';
import {
  getStorageSummary,
  clearSearchHistory,
  clearWatchHistory,
  clearWatchlist,
  clearAllUserData,
} from '../utils/storage';

const isTV = Platform.isTV;

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, clearAppData } = useAppSettings();
  const theme = getTheme(settings.mode);
  const [summary, setSummary] = useState({ searchCount: 0, watchCount: 0, watchlistCount: 0, totalItems: 0 });
  const [feedback, setFeedback] = useState(null);

  // TV Remote Navigation State
  // area: 'RAIL' | 'CONTENT'
  const [tvFocus, setTvFocus] = useState({
    area: 'CONTENT',
    railIndex: 3, // Settings
    actionIndex: 0,
  });

  const refreshSummary = async () => {
    try {
      const s = await getStorageSummary();
      setSummary(s);
    } catch (_) {}
  };

  useEffect(() => {
    refreshSummary();
  }, []);

  const showFeedback = (msg) => {
    setFeedback(msg);
    refreshSummary();
    setTimeout(() => setFeedback(null), 3000);
  };

  const confirmClearSearches = () => Alert.alert(
    'Clear Search History?',
    'This will remove all recent search keywords from this device.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear Searches', style: 'destructive', onPress: async () => {
        await clearSearchHistory();
        showFeedback('Search history cleared.');
      }},
    ]
  );

  const confirmClearWatchHistory = () => Alert.alert(
    'Clear Watch History?',
    'This will remove all streamed movie and show playback records.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear History', style: 'destructive', onPress: async () => {
        await clearWatchHistory();
        showFeedback('Watch history cleared.');
      }},
    ]
  );

  const confirmClearWatchlist = () => Alert.alert(
    'Clear Watchlist?',
    'This will remove all bookmarked movies and shows from your Watchlist.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear Watchlist', style: 'destructive', onPress: async () => {
        await clearWatchlist();
        showFeedback('Watchlist cleared.');
      }},
    ]
  );

  const confirmClearAll = () => Alert.alert(
    'Clear ALL App Data?',
    'This will remove all saved searches, watch history, watchlist bookmarks, and reset your theme settings on this device.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Clear Everything', style: 'destructive', onPress: async () => {
        try {
          await clearAllUserData();
          await clearAppData();
          showFeedback('All app data and history successfully wiped.');
        } catch (_) {
          Alert.alert('Notice', 'Could not clear data. Please try again.');
        }
      }},
    ]
  );

  const actions = [
    () => confirmClearSearches(),
    () => confirmClearWatchHistory(),
    () => confirmClearWatchlist(),
    () => confirmClearAll(),
    () => updateSettings({ mode: 'dark' }),
    () => updateSettings({ mode: 'light' }),
  ];

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
        setTvFocus(f => ({ ...f, area: 'CONTENT' }));
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        const routeName = NAV_ITEMS[tvFocus.railIndex]?.id;
        if (routeName && routeName !== 'Settings') {
          navigation.navigate(routeName);
        }
      }
    } else if (tvFocus.area === 'CONTENT') {
      if (eventType === 'left') {
        playTVFocusFeedback();
        setTvFocus(f => ({ ...f, area: 'RAIL', railIndex: 3 }));
      } else if (eventType === 'up') {
        if (tvFocus.actionIndex > 0) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, actionIndex: f.actionIndex - 1 }));
        }
      } else if (eventType === 'down') {
        if (tvFocus.actionIndex < actions.length - 1) {
          playTVFocusFeedback();
          setTvFocus(f => ({ ...f, actionIndex: f.actionIndex + 1 }));
        }
      } else if (eventType === 'select') {
        playTVSelectFeedback();
        actions[tvFocus.actionIndex]?.();
      }
    }
  });

  return (
    <View style={[styles.outer, { backgroundColor: theme.bg }]}>
      <TVNavigationRail
        currentRoute="Settings"
        focusedItem={tvFocus.area === 'RAIL' ? NAV_ITEMS[tvFocus.railIndex]?.id : null}
        onNavigate={(route) => navigation.navigate(route)}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headingGroup}>
            <Text style={[styles.title, { color: theme.text }]}>Settings & Local Storage</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Manage device storage, history, watchlist, and remote focus
            </Text>
          </View>
        </View>

        {feedback && (
          <View style={styles.feedbackBanner}>
            <MaterialIcons name="check-circle" size={18} color="#15966A" />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* Section 1: Stored Data Management */}
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.sectionHeading}>
            <MaterialIcons name="sd-storage" size={20} color="#FF5722" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Stored Data on this Device</Text>
          </View>
          <Text style={[styles.description, { color: theme.textSub }]}>
            Searches, watch history, and watchlist bookmarks are stored in your device's private storage.
          </Text>

          {/* Metrics summary chips */}
          <View style={styles.summaryChipsRow}>
            <View style={[styles.summaryChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <MaterialIcons name="search" size={16} color="#FF5722" />
              <Text style={[styles.summaryChipCount, { color: theme.text }]}>{summary.searchCount}</Text>
              <Text style={[styles.summaryChipLabel, { color: theme.textMuted }]}>Searches</Text>
            </View>

            <View style={[styles.summaryChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <MaterialIcons name="history" size={16} color="#EC4899" />
              <Text style={[styles.summaryChipCount, { color: theme.text }]}>{summary.watchCount}</Text>
              <Text style={[styles.summaryChipLabel, { color: theme.textMuted }]}>Watched</Text>
            </View>

            <View style={[styles.summaryChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <MaterialIcons name="bookmark" size={16} color="#F59E0B" />
              <Text style={[styles.summaryChipCount, { color: theme.text }]}>{summary.watchlistCount}</Text>
              <Text style={[styles.summaryChipLabel, { color: theme.textMuted }]}>Watchlist</Text>
            </View>
          </View>

          {/* Granular clear buttons */}
          <View style={styles.granularButtonsCol}>
            <DataActionRow
              icon="search-off"
              label="Clear Search History"
              subtitle={`${summary.searchCount} items saved`}
              disabled={summary.searchCount === 0}
              isFocused={tvFocus.area === 'CONTENT' && tvFocus.actionIndex === 0}
              onPress={confirmClearSearches}
              theme={theme}
            />
            <DataActionRow
              icon="history-toggle-drop"
              label="Clear Watch History"
              subtitle={`${summary.watchCount} streamed titles`}
              disabled={summary.watchCount === 0}
              isFocused={tvFocus.area === 'CONTENT' && tvFocus.actionIndex === 1}
              onPress={confirmClearWatchHistory}
              theme={theme}
            />
            <DataActionRow
              icon="bookmark-remove"
              label="Clear My Watchlist"
              subtitle={`${summary.watchlistCount} bookmarked items`}
              disabled={summary.watchlistCount === 0}
              isFocused={tvFocus.area === 'CONTENT' && tvFocus.actionIndex === 2}
              onPress={confirmClearWatchlist}
              theme={theme}
            />
          </View>

          {/* Master Clear All Data Button */}
          <ClearAllDataButton
            isFocused={tvFocus.area === 'CONTENT' && tvFocus.actionIndex === 3}
            onPress={confirmClearAll}
            theme={theme}
          />
        </View>

        {/* Section 2: Appearance & Theme */}
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.sectionHeading}>
            <MaterialIcons name="palette" size={20} color="#FF5722" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          </View>
          <Text style={[styles.description, { color: theme.textSub }]}>
            Choose a dark cinema look or a bright frosted glass look.
          </Text>
          <View style={styles.optionRow}>
            <SettingsOption
              label="Dark cinema"
              icon="dark-mode"
              selected={settings.mode === 'dark'}
              isFocused={tvFocus.area === 'CONTENT' && tvFocus.actionIndex === 4}
              onPress={() => updateSettings({ mode: 'dark' })}
              theme={theme}
            />
            <SettingsOption
              label="Light frost"
              icon="light-mode"
              selected={settings.mode === 'light'}
              isFocused={tvFocus.area === 'CONTENT' && tvFocus.actionIndex === 5}
              onPress={() => updateSettings({ mode: 'light' })}
              theme={theme}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DataActionRow({ icon, label, subtitle, disabled, isFocused, onPress, theme }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      style={[
        styles.actionRowBtn,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        disabled && { opacity: 0.4 },
        isFocused && styles.focusedRow,
      ]}
    >
      <MaterialIcons name={icon} size={20} color="#FF5722" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.actionRowTitle, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.actionRowSub, { color: theme.textMuted }]}>{subtitle}</Text>
      </View>
      <MaterialIcons name="delete-outline" size={18} color="#D94848" />
    </TouchableOpacity>
  );
}

function ClearAllDataButton({ onPress, isFocused, theme }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      style={[
        styles.clearButton,
        { borderColor: '#D9484860', backgroundColor: '#D9484815' },
        isFocused && styles.focusedRow,
      ]}
    >
      <MaterialIcons name="delete-forever" size={22} color="#D94848" />
      <Text style={styles.clearText}>CLEAR ALL DATA (MASTER RESET)</Text>
      <MaterialIcons name="chevron-right" size={20} color="#D94848" />
    </TouchableOpacity>
  );
}

function SettingsOption({ label, icon, selected, isFocused, onPress, theme }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      style={[
        styles.modeOption,
        { backgroundColor: selected ? 'rgba(255, 87, 34, 0.2)' : theme.surfaceElevated, borderColor: selected ? '#FF5722' : theme.border },
        isFocused && styles.focusedRow,
      ]}
    >
      <MaterialIcons name={icon} size={22} color={selected ? '#FF5722' : theme.textSub} />
      <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
      {selected && <MaterialIcons name="check-circle" size={18} color="#FF5722" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, flexDirection: 'row' },
  scroll: { flex: 1 },
  content: { padding: isTV ? 28 : 16, paddingBottom: 60 },
  header: { paddingBottom: 16, marginBottom: 20, borderBottomWidth: 1 },
  headingGroup: { gap: 4 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13 },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B98120',
    borderColor: '#10B98160',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  feedbackText: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  panel: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  description: { fontSize: 12, marginBottom: 14, lineHeight: 18 },
  summaryChipsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  summaryChipCount: { fontSize: 16, fontWeight: '800' },
  summaryChipLabel: { fontSize: 10, fontWeight: '600' },
  granularButtonsCol: { gap: 8, marginBottom: 14 },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionRowTitle: { fontSize: 13, fontWeight: '700' },
  actionRowSub: { fontSize: 10, marginTop: 2 },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  clearText: { color: '#D94848', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', gap: 12 },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
  focusedRow: {
    borderColor: '#FFFFFF',
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    borderWidth: 3.5,
    transform: [{ scale: 1.05 }],
    elevation: 16,
    shadowColor: '#FF5722',
    shadowOpacity: 1,
    shadowRadius: 16,
  },
});
