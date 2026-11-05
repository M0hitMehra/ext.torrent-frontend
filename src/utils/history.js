/**
 * history.js
 * Backward-compatible forwarder to storage.js
 */
export {
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
} from './storage';

import storage from './storage';
export default storage;