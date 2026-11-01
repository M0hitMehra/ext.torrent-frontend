import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAppSettings, getTheme, FOCUS_COLORS } from '../utils/settings';
import { useTVFocus, playTVSelectFeedback } from '../hooks';
import { TVNavigationRail } from '../components/TVNavigationRail';

const isTV = Platform.isTV;

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, clearAppData } = useAppSettings();
  const theme = getTheme(settings.mode);
  const [cleared, setCleared] = useState(false);

  const confirmClear = () => Alert.alert(
    'Clear app data?',
    'This removes saved search words and app preferences from this device. Your backend account and torrent catalog are not affected.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear data', style: 'destructive', onPress: async () => {
        try { await clearAppData(); setCleared(true); }
        catch (_) { Alert.alert('Could not clear data', 'Please try again.'); }
      } },
    ]
  );

  return (
    <View style={[styles.outer, { backgroundColor: theme.bg }]}>
      <TVNavigationRail currentRoute="Settings" onNavigate={(route) => navigation.navigate(route)} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          {!isTV && <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><MaterialIcons name="arrow-back" size={22} color={theme.text} /></TouchableOpacity>}
          <View style={styles.headingGroup}>
            <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Personalize the screen and remote focus</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.sectionHeading}>
            <MaterialIcons name="palette" size={20} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          </View>
          <Text style={[styles.description, { color: theme.textSub }]}>Choose a dark cinema look or a bright frosted glass look.</Text>
          <View style={styles.optionRow}>
            <SettingsOption label="Dark cinema" icon="dark-mode" selected={settings.mode === 'dark'} onPress={() => updateSettings({ mode: 'dark' })} theme={theme} />
            <SettingsOption label="Light glass" icon="light-mode" selected={settings.mode === 'light'} onPress={() => updateSettings({ mode: 'light', focusColor: settings.focusColor === '#FFFFFF' ? '#E85B43' : settings.focusColor })} theme={theme} />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.sectionHeading}>
            <MaterialIcons name="center-focus-strong" size={20} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Remote highlight color</Text>
          </View>
          <Text style={[styles.description, { color: theme.textSub }]}>The selected color outlines focused tiles across search, keyboard, catalog and player choices.</Text>
          <View style={styles.swatches}>
            {FOCUS_COLORS.map(color => (
              <ColorSwatch key={color.value} item={color} selected={settings.focusColor === color.value} onPress={() => updateSettings({ focusColor: color.value })} />
            ))}
          </View>
          <Text style={[styles.selectedColor, { color: theme.textMuted }]}>Current: {FOCUS_COLORS.find(c => c.value === settings.focusColor)?.name || 'Custom'}</Text>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.sectionHeading}>
            <MaterialIcons name="cleaning-services" size={20} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Stored data</Text>
          </View>
          <Text style={[styles.description, { color: theme.textSub }]}>Remove search history and preferences saved on this device.</Text>
          <ClearDataButton onPress={confirmClear} theme={theme} />
          {cleared && <Text style={[styles.success, { color: '#15966A' }]}>Saved searches and preferences cleared.</Text>}
        </View>

        <Text style={[styles.footer, { color: theme.textMuted }]}>ExtTorrent · Settings are stored on this device</Text>
      </ScrollView>
    </View>
  );
}

function SettingsOption({ label, icon, selected, onPress, theme }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hasTVPreferredFocus={isTV && selected}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[styles.modeOption, { backgroundColor: selected ? `${COLORS.primary}20` : theme.surfaceElevated, borderColor: selected ? COLORS.primary : theme.border }, focused && focusStyle]}
    >
      <MaterialIcons name={icon} size={22} color={selected ? COLORS.primary : theme.textSub} />
      <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
      {selected && <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />}
    </TouchableOpacity>
  );
}

function ColorSwatch({ item, selected, onPress }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
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
    </TouchableOpacity>
  );
}

function ClearDataButton({ onPress, theme }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[styles.clearButton, { borderColor: theme.border }, focused && focusStyle]}
    >
      <MaterialIcons name="delete-outline" size={20} color="#D94848" />
      <Text style={styles.clearText}>Clear all saved app data</Text>
      <MaterialIcons name="chevron-right" size={20} color="#D94848" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, flexDirection: 'row' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, padding: isTV ? 30 : 18, paddingBottom: 44, maxWidth: 1000, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20, marginBottom: 18, borderBottomWidth: 1 },
  back: { padding: 10, marginRight: 8 },
  headingGroup: { gap: 4 },
  title: { fontSize: isTV ? 32 : 26, fontWeight: '900' },
  subtitle: { fontSize: isTV ? 15 : 13 },
  panel: { padding: isTV ? 22 : 18, borderRadius: 20, borderWidth: 1, marginBottom: 16, shadowOffset: { width: 4, height: 7 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionTitle: { fontSize: isTV ? 19 : 17, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  optionRow: { flexDirection: 'row', gap: 12 },
  modeOption: { flex: 1, minHeight: 62, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '800' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchButton: { alignItems: 'center', justifyContent: 'center', gap: 7, width: 86, minHeight: 76, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}14` },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(80,90,110,0.3)' },
  swatchLabel: { color: '#647086', fontSize: 11, fontWeight: '700' },
  selectedColor: { marginTop: 10, fontSize: 12 },
  clearButton: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(217,72,72,0.07)' },
  clearText: { flex: 1, color: '#C53D3D', fontSize: 14, fontWeight: '800' },
  success: { marginTop: 12, fontSize: 13, fontWeight: '700' },
  footer: { textAlign: 'center', paddingVertical: 14, fontSize: 12 },
});
