/**
 * metaApi.js
 * Fetches movie/show posters, IMDb ratings, genres, and trailers
 * using free open metadata APIs (Cinemeta / TVMaze) with zero API keys required.
 * Gracefully returns null if not available so the UI can hide elements.
 */

import axios from 'axios';

const metaCache = new Map();

/**
 * Cleans release title (strips codec, resolution, group tags, brackets)
 */
export function cleanMediaTitle(raw) {
  if (!raw) return '';
  let s = raw;
  // Remove brackets and parentheses
  s = s.replace(/\[[^\]]*\]/g, ' ').replace(/\([^\)]*\)/g, ' ');
  // Remove technical tags
  s = s.replace(/\b(2160p|1080p|720p|480p|4k|uhd|bluray|bdrip|brrip|web-dl|webrip|web|hdtv|h264|x264|h265|hevc|x265|dvdrip|aac5?\.?1?|ddp5?\.?1?|ac3|yify|proper|repack|complete|remux|multi|dual|audio|extended|imax)\b/gi, ' ');
  // Remove season/episode identifiers
  s = s.replace(/\b(s\d{1,2}e\d{1,2}|s\d{1,2}|season\s*\d+|episode\s*\d+)\b/gi, ' ');
  // Replace dots, underscores, dashes with spaces
  s = s.replace(/[._\-]/g, ' ');
  // Remove year if at the end
  s = s.replace(/\b(19\d\d|20\d\d)\b/g, ' ');
  return s.trim().replace(/\s+/g, ' ');
}

/**
 * Fetches poster and metadata for a given torrent title.
 * Returns { poster, backdrop, name, year, rating, genres, description, trailerUrl } or null
 */
export async function fetchMediaMetadata(rawTitle) {
  if (!rawTitle) return null;
  const cleaned = cleanMediaTitle(rawTitle);
  if (!cleaned || cleaned.length < 2) return null;

  const cacheKey = cleaned.toLowerCase();
  if (metaCache.has(cacheKey)) {
    return metaCache.get(cacheKey);
  }

  try {
    // 1. Try Cinemeta Movie
    const movieUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(cleaned)}.json`;
    const movieRes = await axios.get(movieUrl, { timeout: 3500 });
    const movie = movieRes.data?.metas?.[0];

    if (movie && movie.poster) {
      const data = {
        name: movie.name || cleaned,
        poster: movie.poster,
        backdrop: movie.background || null,
        year: movie.releaseInfo || movie.year || null,
        rating: movie.imdbRating || null,
        genres: movie.genres || [],
        description: movie.description || null,
        trailerUrl: movie.trailerInfo?.ytId
          ? `https://www.youtube.com/watch?v=${movie.trailerInfo.ytId}`
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.name + ' trailer')}`,
      };
      metaCache.set(cacheKey, data);
      return data;
    }

    // 2. Try Cinemeta Series
    const seriesUrl = `https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURIComponent(cleaned)}.json`;
    const seriesRes = await axios.get(seriesUrl, { timeout: 3500 });
    const series = seriesRes.data?.metas?.[0];

    if (series && series.poster) {
      const data = {
        name: series.name || cleaned,
        poster: series.poster,
        backdrop: series.background || null,
        year: series.releaseInfo || series.year || null,
        rating: series.imdbRating || null,
        genres: series.genres || [],
        description: series.description || null,
        trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(series.name + ' trailer')}`,
      };
      metaCache.set(cacheKey, data);
      return data;
    }

    // 3. Fallback to TVMaze
    const tvUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleaned)}`;
    const tvRes = await axios.get(tvUrl, { timeout: 3500 });
    const show = tvRes.data?.[0]?.show;

    if (show && show.image?.original) {
      const data = {
        name: show.name,
        poster: show.image.original,
        backdrop: null,
        year: show.premiered ? show.premiered.slice(0, 4) : null,
        rating: show.rating?.average ? String(show.rating.average) : null,
        genres: show.genres || [],
        description: show.summary ? show.summary.replace(/<[^>]+>/g, '') : null,
        trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(show.name + ' trailer')}`,
      };
      metaCache.set(cacheKey, data);
      return data;
    }
  } catch (_) {
    // Fail silently, return null
  }

  metaCache.set(cacheKey, null);
  return null;
}
