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

// Neumorphism Theme Colors (Dark Mode Obsidian/Slate)
export const COLORS = {
  bg:            '#121319',
  surface:       '#1A1C24',
  card:          '#1E212B',
  cardHighlight: '#2A2E3C', // Top-left light reflection
  cardShadow:    '#0B0C10', // Bottom-right dark drop shadow
  input:         '#15171E',
  inputBorder:   '#282B37',
  primary:       '#7C6CFF',
  primaryDark:   '#5B4AFF',
  primaryGlow:   '#A295FF',
  secondary:     '#00E5FF',
  accent:        '#FF5252',
  text:          '#FFFFFF',
  textSub:       '#A4A8BF',
  textMuted:     '#666B85',
  seeder:        '#00E676',
  leecher:       '#FF5252',
  border:        '#282B38',
  tvFocus:       '#7C6CFF',
  gold:          '#FFD700',
};

// Neumorphic Shadow Presets
export const NEU_STYLES = {
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  cardFocused: {
    borderColor: COLORS.tvFocus,
    borderWidth: 2,
    backgroundColor: '#242735',
    transform: [{ scale: 1.03 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 12,
  },
  button: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
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
