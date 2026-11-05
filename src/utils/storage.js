/**
 * storage.js
 * Comprehensive AsyncStorage manager for ExtTorrent React Native App (Mobile & Android TV).
 * Manages:
 *  1. Search History
 *  2. Watch History (streamed movies, series with timestamp and poster)
 *  3. Watchlist ("My List" bookmarked torrents)
 *  4. Storage Summary and Master "Clear All Data"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SEARCH_HISTORY: '@ext_search_history_v1',
  WATCH_HISTORY: '@ext_watch_history_v1',
  WATCHLIST: '@ext_watchlist_v1',
};

const MAX_SEARCH_HISTORY = 20;
const MAX_WATCH_HISTORY = 50;

// Listeners set for real-time state updates across screens
const listeners = new Set();
function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(); } catch (_) {}
  });
}

export function subscribeToStorage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Search History
// ─────────────────────────────────────────────────────────────────────────────
export async function getSearchHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SEARCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addSearchQuery(query) {
  if (!query || !query.trim()) return [];
  const trimmed = query.trim();

  try {
    const current = await getSearchHistory();
    const filtered = current.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_SEARCH_HISTORY);
    await AsyncStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch (e) {
    return [];
  }
}

export async function removeSearchQuery(query) {
  try {
    const current = await getSearchHistory();
    const updated = current.filter(item => item.toLowerCase() !== query.toLowerCase());
    await AsyncStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch (e) {
    return [];
  }
}

export async function clearSearchHistory() {
  try {
    await AsyncStorage.removeItem(KEYS.SEARCH_HISTORY);
    notifyListeners();
    return [];
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Watch History
// ─────────────────────────────────────────────────────────────────────────────
export async function getWatchHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.WATCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addToWatchHistory(torrent, meta = {}) {
  if (!torrent || (!torrent.title && !meta?.title && !meta?.name)) return [];

  const id = String(torrent.id || torrent.infoHash || torrent.title);
  try {
    const current = await getWatchHistory();
    const filtered = current.filter(item => String(item.id || item.title) !== id);

    const entry = {
      id,
      title: meta?.title || meta?.name || torrent.title,
      rawTitle: torrent.title,
      category: torrent.category || meta?.type || 'movies',
      size: torrent.size || null,
      seeders: torrent.seeders || 0,
      magnet: torrent.magnet || null,
      poster: meta?.poster || meta?.backdrop || null,
      backdrop: meta?.backdrop || meta?.poster || null,
      year: meta?.year || null,
      rating: meta?.rating || null,
      director: meta?.director || null,
      watchedAt: Date.now(),
    };

    const updated = [entry, ...filtered].slice(0, MAX_WATCH_HISTORY);
    await AsyncStorage.setItem(KEYS.WATCH_HISTORY, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch (e) {
    return [];
  }
}

export async function removeFromWatchHistory(id) {
  try {
    const current = await getWatchHistory();
    const updated = current.filter(item => String(item.id || item.title) !== String(id));
    await AsyncStorage.setItem(KEYS.WATCH_HISTORY, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch (e) {
    return [];
  }
}

export async function clearWatchHistory() {
  try {
    await AsyncStorage.removeItem(KEYS.WATCH_HISTORY);
    notifyListeners();
    return [];
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Watchlist ("My List" / Bookmarks)
// ─────────────────────────────────────────────────────────────────────────────
export async function getWatchlist() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.WATCHLIST);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function isInWatchlist(idOrTitle) {
  if (!idOrTitle) return false;
  const list = await getWatchlist();
  const idStr = String(idOrTitle);
  return list.some(item => String(item.id) === idStr || String(item.title) === idStr || String(item.rawTitle) === idStr);
}

export async function addToWatchlist(torrent, meta = {}) {
  if (!torrent) return [];
  const id = String(torrent.id || torrent.infoHash || torrent.title);

  try {
    const list = await getWatchlist();
    if (list.some(item => String(item.id) === id)) return list;

    const entry = {
      id,
      title: meta?.title || meta?.name || torrent.title,
      rawTitle: torrent.title,
      category: torrent.category || meta?.type || 'movies',
      size: torrent.size || null,
      seeders: torrent.seeders || 0,
      magnet: torrent.magnet || null,
      poster: meta?.poster || meta?.backdrop || null,
      backdrop: meta?.backdrop || null,
      year: meta?.year || null,
      rating: meta?.rating || null,
      director: meta?.director || null,
      addedAt: Date.now(),
    };

    const updated = [entry, ...list];
    await AsyncStorage.setItem(KEYS.WATCHLIST, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch (e) {
    return [];
  }
}

export async function removeFromWatchlist(idOrTitle) {
  const idStr = String(idOrTitle);
  try {
    const list = await getWatchlist();
    const updated = list.filter(item => String(item.id) !== idStr && String(item.title) !== idStr && String(item.rawTitle) !== idStr);
    await AsyncStorage.setItem(KEYS.WATCHLIST, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch (e) {
    return [];
  }
}

export async function toggleWatchlist(torrent, meta = {}) {
  const id = String(torrent.id || torrent.infoHash || torrent.title);
  const alreadyIn = await isInWatchlist(id);
  if (alreadyIn) {
    await removeFromWatchlist(id);
    return false;
  } else {
    await addToWatchlist(torrent, meta);
    return true;
  }
}

export async function clearWatchlist() {
  try {
    await AsyncStorage.removeItem(KEYS.WATCHLIST);
    notifyListeners();
    return [];
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Storage Summary & Master Clear All Data
// ─────────────────────────────────────────────────────────────────────────────
export async function getStorageSummary() {
  const searches = await getSearchHistory();
  const watches = await getWatchHistory();
  const watchlist = await getWatchlist();

  return {
    searchCount: searches.length,
    watchCount: watches.length,
    watchlistCount: watchlist.length,
    totalItems: searches.length + watches.length + watchlist.length,
  };
}

export async function clearAllUserData() {
  try {
    await AsyncStorage.multiRemove([
      KEYS.SEARCH_HISTORY,
      KEYS.WATCH_HISTORY,
      KEYS.WATCHLIST,
    ]);
    notifyListeners();
    return true;
  } catch (e) {
    return false;
  }
}

export default {
  getSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
  getWatchHistory,
  addToWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
  getWatchlist,
  isInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
  clearWatchlist,
  getStorageSummary,
  clearAllUserData,
  subscribeToStorage,
};