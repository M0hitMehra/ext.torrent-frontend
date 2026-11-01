import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@ext_app_settings_v1';
const DEFAULT_SETTINGS = { mode: 'dark', focusColor: '#FFFFFF' };
const SettingsContext = createContext(null);

export const FOCUS_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Coral', value: '#FF6B55' },
  { name: 'Cyan', value: '#36D9FF' },
  { name: 'Violet', value: '#A78BFA' },
  { name: 'Amber', value: '#FFC857' },
  { name: 'Lime', value: '#A3E635' },
];

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then(raw => { if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const updateSettings = useCallback(async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, [settings]);

  const clearAppData = useCallback(async () => {
    await AsyncStorage.clear();
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(() => ({ settings, ready, updateSettings, clearAppData }), [settings, ready, updateSettings, clearAppData]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useAppSettings must be used within SettingsProvider');
  return context;
}

export function getTheme(mode) {
  if (mode === 'light') {
    return {
      bg: '#E9EEF5', surface: 'rgba(255,255,255,0.78)', surfaceElevated: '#F8FAFD',
      card: 'rgba(255,255,255,0.82)', input: 'rgba(255,255,255,0.9)',
      border: 'rgba(113,129,153,0.22)', cardHighlight: 'rgba(255,255,255,0.96)',
      cardShadow: 'rgba(69,86,112,0.16)', text: '#172033', textSub: '#536176',
      textMuted: '#718096', glass: true,
    };
  }
  return {
    bg: '#090B11', surface: '#111521', surfaceElevated: '#1A2030',
    card: '#171C29', input: '#0E121C', border: '#232736',
    cardHighlight: '#2B3447', cardShadow: '#05070B', text: '#FFFFFF',
    textSub: '#AAB0C5', textMuted: '#666B85', glass: false,
  };
}

