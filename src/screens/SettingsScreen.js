import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { FocusableOpacity } from '../components/FocusableOpacity';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAppSettings, getTheme, FOCUS_COLORS } from '../utils/settings';
import { useTVFocus, playTVSelectFeedback } from '../hooks';
import { TVNavigationRail } from '../components/TVNavigationRail';
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

  return (
    <View style={[styles.outer, { backgroundColor: theme.bg }]}>
      <TVNavigationRail currentRoute="Settings" onNavigate={(route) => navigation.navigate(route)} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          {!isTV && (
            <FocusableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <MaterialIcons name="arrow-back" size={22} color={theme.text} />
            </FocusableOpacity>
          )}
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
            <MaterialIcons name="sd-storage" size={20} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Stored Data on this Device</Text>
          </View>
          <Text style={[styles.description, { color: theme.textSub }]}>
            Searches, watch history, and watchlist bookmarks are stored in your device's private storage.
          </Text>

          {/* Metrics summary chips */}
          <View style={styles.summaryChipsRow}>
            <View style={[styles.summaryChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <MaterialIcons name="search" size={16} color={COLORS.primary} />
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
              onPress={confirmClearSearches}
              theme={theme}
            />
            <DataActionRow
              icon="history-toggle-drop"
              label="Clear Watch History"
              subtitle={`${summary.watchCount} streamed titles`}
              disabled={summary.watchCount === 0}
              onPress={confirmClearWatchHistory}
              theme={theme}
            />
            <DataActionRow
              icon="bookmark-remove"
              label="Clear My Watchlist"
              subtitle={`${summary.watchlistCount} bookmarked items`}
              disabled={summary.watchlistCount === 0}
              onPress={confirmClearWatchlist}
              theme={theme}
            />
          </View>

          {/* Master Clear All Data Button */}
          <ClearAllDataButton onPress={confirmClearAll} theme={theme} />
        </View>

        {/* Section 2: Appearance & Theme */}
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.sectionHeading}>
            <MaterialIcons name="palette" size={20} color={COLORS.primary} />
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
              onPress={() => updateSettings({ mode: 'dark' })}
              theme={theme}
            />
            <SettingsOption
              label="Light glass"
              icon="light-mode"
              selected={settings.mode === 'light'}
              onPress={() => updateSettings({ mode: 'light', focusColor: settings.focusColor === '#FFFFFF' ? '#E85B43' : settings.focusColor })}
              theme={theme}
            />
          </View>
        </View>

        {/* Section 3: Remote Highlight Color */}
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.sectionHeading}>
            <MaterialIcons name="center-focus-strong" size={20} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Remote Highlight Color</Text>
          </View>
          <Text style={[styles.description, { color: theme.textSub }]}>
            Outlines focused tiles across search, keyboard, catalog and player choices.
          </Text>
          <View style={styles.swatches}>
            {FOCUS_COLORS.filter(color => settings.mode !== 'light' || color.value !== '#FFFFFF').map(color => (
              <ColorSwatch
                key={color.value}
                item={color}
                selected={settings.focusColor === color.value}
                onPress={() => updateSettings({ focusColor: color.value })}
              />
            ))}
          </View>
          <Text style={[styles.selectedColor, { color: theme.textMuted }]}>
            Current: {FOCUS_COLORS.find(c => c.value === settings.focusColor)?.name || 'Custom'}
          </Text>
        </View>

        <Text style={[styles.footer, { color: theme.textMuted }]}>
          ExtTorrent · All data is stored locally on this device
        </Text>
      </ScrollView>
    </View>
  );
}

function DataActionRow({ icon, label, subtitle, disabled, onPress, theme }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <FocusableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        styles.actionRowBtn,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        disabled && { opacity: 0.4 },
        focused && focusStyle,
      ]}
    >
      <MaterialIcons name={icon} size={20} color={COLORS.primary} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.actionRowTitle, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.actionRowSub, { color: theme.textMuted }]}>{subtitle}</Text>
      </View>
      <MaterialIcons name="delete-outline" size={18} color="#D94848" />
    </FocusableOpacity>
  );
}

function ClearAllDataButton({ onPress, theme }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <FocusableOpacity
      accessibilityRole="button"
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[styles.clearButton, { borderColor: '#D9484860', backgroundColor: '#D9484815' }, focused && focusStyle]}
    >
      <MaterialIcons name="delete-forever" size={22} color="#D94848" />
      <Text style={styles.clearText}>CLEAR ALL DATA (MASTER RESET)</Text>
      <MaterialIcons name="chevron-right" size={20} color="#D94848" />
    </FocusableOpacity>
  );
}

function SettingsOption({ label, icon, selected, onPress, theme }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <FocusableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hasTVPreferredFocus={isTV && selected}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        styles.modeOption,
        { backgroundColor: selected ? `${COLORS.primary}20` : theme.surfaceElevated, borderColor: selected ? COLORS.primary : theme.border },
        focused && focusStyle,
      ]}
    >
      <MaterialIcons name={icon} size={22} color={selected ? COLORS.primary : theme.textSub} />
      <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
      {selected && <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />}
    </FocusableOpacity>
  );
}

function ColorSwatch({ item, selected, onPress }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <FocusableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${item.name} remote highlight`}
      accessibilityState={{ selected }}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[styles.swatchButton, selected && styles.swatchSelected, focused && focusStyle]}
    >
      <View style={[styles.swatch, { backgroundColor: item.value }]} />
      <Text style={styles.swatchLabel}>{item.name}</Text>
    </FocusableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, flexDirection: 'row' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, padding: isTV ? 30 : 18, paddingBottom: 44, maxWidth: 1000, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { padding: 8, marginRight: 12 },
  headingGroup: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(21, 150, 106, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(21, 150, 106, 0.4)',
    borderRadius: 10,
    marginBottom: 16,
  },
  feedbackText: { color: '#15966A', fontWeight: '700', fontSize: 13 },
  panel: { padding: 18, borderRadius: 14, borderWidth: 1, marginBottom: 18, elevation: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  summaryChipsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryChip: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryChipCount: { fontSize: 16, fontWeight: '900', marginTop: 2 },
  summaryChipLabel: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  granularButtonsCol: { gap: 8, marginBottom: 14 },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionRowTitle: { fontSize: 13, fontWeight: '700' },
  actionRowSub: { fontSize: 11, marginTop: 1 },
  optionRow: { flexDirection: 'row', gap: 12 },
  modeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchButton: { alignItems: 'center', padding: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent' },
  swatchSelected: { borderColor: COLORS.primary },
  swatch: { width: 32, height: 32, borderRadius: 16, marginBottom: 4 },
  swatchLabel: { fontSize: 11, fontWeight: '600', color: '#AAB0C5' },
  selectedColor: { fontSize: 12, marginTop: 10 },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  clearText: { color: '#D94848', fontSize: 13, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 12 },
});