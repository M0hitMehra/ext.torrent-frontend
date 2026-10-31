/**
 * history.js
 * Persistent search history manager using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ext_search_history_v1';
const MAX_HISTORY_ITEMS = 20;

export async function getSearchHistory() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load search history:', e.message);
    return [];
  }
}

export async function addSearchQuery(query) {
  if (!query || !query.trim()) return [];
  const trimmed = query.trim();

  try {
    const current = await getSearchHistory();
    // Remove if already exists (to move to front)
    const filtered = current.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save search history:', e.message);
    return [];
  }
}

export async function removeSearchQuery(query) {
  try {
    const current = await getSearchHistory();
    const updated = current.filter(item => item.toLowerCase() !== query.toLowerCase());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to delete search history item:', e.message);
    return [];
  }
}

export async function clearSearchHistory() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (e) {
    console.warn('Failed to clear search history:', e.message);
    return [];
  }
}
