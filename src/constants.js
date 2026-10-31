// API base URL — your deployed backend
export const API_BASE_URL = 'https://ext-torrent-backend.onrender.com';

export const CATEGORIES = [
  { slug: 'all',      label: 'All',       icon: 'apps' },
  { slug: 'movies',   label: 'Movies',    icon: 'movie' },
  { slug: 'tv',       label: 'TV Shows',  icon: 'live-tv' },
  { slug: 'music',    label: 'Music',     icon: 'music-note' },
  { slug: 'games',    label: 'Games',     icon: 'sports-esports' },
  { slug: 'software', label: 'Software',  icon: 'computer' },
  { slug: 'anime',    label: 'Anime',     icon: 'auto-awesome' },
  { slug: 'books',    label: 'Books',     icon: 'menu-book' },
  { slug: 'other',    label: 'Other',     icon: 'category' },
];

// TorrServer base URL for torrent streaming (embedded proxy)
// When user taps a torrent, we stream it via this endpoint
export const TORR_SERVER_BASE = 'https://torrserver.me'; // Public demo server
// For production you can self-host TorrServer: https://github.com/YouROK/TorrServer

export const COLORS = {
  bg:          '#0A0A0F',
  surface:     '#13131A',
  card:        '#1C1C26',
  primary:     '#6C63FF',
  primaryDark: '#4B44CC',
  accent:      '#FF6B6B',
  text:        '#FFFFFF',
  textSub:     '#9999BB',
  textMuted:   '#555577',
  seeder:      '#4CAF50',
  leecher:     '#FF5252',
  border:      '#2A2A3E',
  tvFocus:     '#6C63FF',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
};

export const SORT_OPTIONS = [
  { label: 'Newest',   value: 'time',     order: 'desc' },
  { label: 'Seeders',  value: 'seeders',  order: 'desc' },
  { label: 'Size ↑',   value: 'size',     order: 'asc'  },
  { label: 'Size ↓',   value: 'size',     order: 'desc' },
];
