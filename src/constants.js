// API base URL — your deployed backend on Render
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

export const TORR_SERVER_BASE = 'https://torrserver.me';

// Neumorphism Theme Colors (Dark Mode Obsidian/Slate with High-Contrast TV Focus)
export const COLORS = {
  bg:            '#0F1015',
  surface:       '#161821',
  surfaceElevated: '#1D202C',
  card:          '#1C1F2B',
  cardHighlight: '#2B3042', // Top-left light reflection (soft bevel)
  cardShadow:    '#08090C', // Bottom-right dark drop shadow
  input:         '#13141B',
  inputBorder:   '#242838',
  primary:       '#6C5CE7',
  primaryDark:   '#5042CC',
  primaryGlow:   '#A29BFE',
  secondary:     '#00D2D3',
  accent:        '#FF5252',
  text:          '#FFFFFF',
  textSub:       '#AAB0C5',
  textMuted:     '#666B85',
  seeder:        '#00E676',
  leecher:       '#FF5252',
  border:        '#232736',
  tvFocus:       '#FFFFFF', // YouTube TV style pure white high-contrast focus ring
  tvFocusBorder: '#FFFFFF',
  tvFocusGlow:   '#6C5CE7',
  tvPointer:     '#00F0FF', // Cyan beacon indicator
  gold:          '#FFD700',
};

// Neumorphic Shadow Presets
export const NEU_STYLES = {
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 7 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: '#262A3C',
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 20,
    elevation: 18,
  },
  button: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 14,
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
};

export const SORT_OPTIONS = [
  { label: 'Seeders',  value: 'seeders',  order: 'desc' },
  { label: 'Newest',   value: 'time',     order: 'desc' },
  { label: 'Size ↑',   value: 'size',     order: 'asc'  },
  { label: 'Size ↓',   value: 'size',     order: 'desc' },
];
