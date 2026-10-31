import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // Render free tier may be slow on cold start
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error normalization
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err?.response?.data?.error ||
      err?.message ||
      'Network error. Please try again.';
    return Promise.reject(new Error(message));
  }
);

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function searchTorrents({ q, page = 1, sort = 'time', order = 'desc' }) {
  return api.get('/api/search', { params: { q, page, sort, order } });
}

export async function browseTorrents({ category = 'all', page = 1, sort = 'time', order = 'desc' }) {
  return api.get('/api/browse', { params: { category, page, sort, order } });
}

export async function getTrending(category = 'all') {
  return api.get('/api/trending', { params: { category } });
}

export async function getLatest(page = 1) {
  return api.get('/api/latest', { params: { page } });
}

export async function getTorrentDetail(id) {
  return api.get(`/api/torrent/${id}`);
}

export async function getMagnet(id) {
  return api.get(`/api/magnet/${id}`);
}

export async function getCategories() {
  return api.get('/api/categories');
}
