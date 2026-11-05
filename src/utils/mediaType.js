/**
 * mediaType.js
 * Accurate detection of streamable video media vs unplayable archive/game formats for TorrentApp.
 * Movies, TV Shows, Anime, and releases with video tags (1080p, 720p, Bluray, WEBRip)
 * are ALWAYS treated as streamable video.
 * Only genuine software, games, or explicit archives (.zip, .rar, .iso, .exe) are download-only.
 */

const ARCHIVE_EXTENSIONS = /\.(zip|rar|7z|tar|gz|bz2|iso|bin|cue|exe|msi|dmg|pkg|apk|cbr|cbz|epub|pdf)\b/i;
const UNPLAYABLE_CATEGORIES = ['games', 'software', 'apps', 'applications', 'books', 'ebooks', 'comics'];
const VIDEO_CATEGORIES = ['movies', 'movie', 'tv', 'tv shows', 'anime', 'animation', 'series'];
const VIDEO_TAGS_REGEX = /\b(1080p|720p|2160p|4k|8k|uhd|fhd|bluray|blu-ray|bdrip|brrip|webrip|web-dl|webdl|hdrip|dvdrip|hdtv|cam|x264|x265|hevc|h264|h265|s\d{1,2}e\d{1,2}|s\d{1,2}|season\s*\d{1,2})\b/i;

export function isPlayableTorrent(torrent) {
  if (!torrent) return false;

  const category = (torrent.category || '').toLowerCase().trim();
  const title = (torrent.title || '').toLowerCase().trim();

  // 1. Definite VIDEO CATEGORIES (Movies, TV Shows, Anime) are ALWAYS PLAYABLE
  const isVideoCategory = VIDEO_CATEGORIES.some(cat => category.includes(cat));
  const hasVideoTags = VIDEO_TAGS_REGEX.test(title);

  if ((isVideoCategory || hasVideoTags) && !ARCHIVE_EXTENSIONS.test(title)) {
    return true;
  }

  // 2. Explicit UNPLAYABLE categories (Games, Software, Books)
  if (UNPLAYABLE_CATEGORIES.some(cat => category.includes(cat))) {
    return false;
  }

  // 3. Check title extension for archives, disk images, installers
  if (ARCHIVE_EXTENSIONS.test(title)) {
    return false;
  }

  // 4. Check for game repacks / software crack keywords
  const gameCrackKeywords = /\b(repack|fitgirl|dodi|codex|plaza|skidrow|flt|rune|tenoke|crack|setup|installer|patch|keygen)\b/i;
  if (gameCrackKeywords.test(title) && !isVideoCategory) {
    return false;
  }

  // 5. Inspect file list only if files explicitly end with archive extensions
  if (Array.isArray(torrent.files) && torrent.files.length > 0) {
    const isAllArchives = torrent.files.every(f => {
      const fileName = typeof f === 'string' ? f : (f.name || '');
      return ARCHIVE_EXTENSIONS.test(fileName);
    });

    if (isAllArchives && !isVideoCategory && !hasVideoTags) {
      return false;
    }
  }

  return true;
}

export function getContentFormatLabel(torrent) {
  if (!torrent) return 'Download';

  const category = (torrent.category || '').toLowerCase();
  const title = (torrent.title || '').toLowerCase();

  if (category.includes('game') || title.includes('repack') || title.includes('fitgirl')) return 'Game Repack / Setup';
  if (category.includes('software') || title.endsWith('.exe') || title.endsWith('.dmg')) return 'Software App';
  if (category.includes('book') || title.endsWith('.pdf') || title.endsWith('.epub')) return 'Document / eBook';
  if (title.endsWith('.zip') || title.endsWith('.rar') || title.endsWith('.7z')) return 'Compressed Archive (ZIP/RAR)';
  if (title.endsWith('.iso')) return 'ISO Disk Image';

  return '1080p Streamable Video';
}

export default {
  isPlayableTorrent,
  getContentFormatLabel,
};