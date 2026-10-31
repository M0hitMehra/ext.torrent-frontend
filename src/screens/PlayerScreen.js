/**
 * PlayerScreen.js
 * In-app torrent video streaming screen.
 *
 * Strategy:
 *   1. We use WebTorrent-compatible streaming via a public TorrServer API endpoint.
 *      TorrServer accepts a magnet link and returns an HTTP video stream URL.
 *   2. Feed that URL to react-native-video (ExoPlayer on Android).
 *
 * TorrServer public API: https://torrserver.me
 * Or self-hosted: https://github.com/YouROK/TorrServer
 *
 * API flow:
 *   POST /torrents  → add torrent by magnet
 *   GET  /stream?link=MAGNET&index=0  → streaming URL
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Dimensions, Alert,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS } from '../constants';

const { width: W, height: H } = Dimensions.get('window');
const isTV = Platform.isTV;

// Public TorrServer instances (fallback chain)
const TORR_SERVERS = [
  'https://torrserver.me',
];

export default function PlayerScreen({ navigation, route }) {
  const { torrent, magnet } = route.params;
  const [status, setStatus] = useState('loading'); // loading | buffering | playing | error
  const [errorMsg, setErrorMsg] = useState('');
  const [streamUrl, setStreamUrl] = useState(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimer = useRef(null);

  useEffect(() => {
    initStream();
    return () => clearTimeout(controlsTimer.current);
  }, []);

  async function initStream() {
    setStatus('loading');
    // Build TorrServer stream URL directly from magnet
    // TorrServer stream endpoint: /stream?link=<encoded_magnet>&index=0&play
    for (const server of TORR_SERVERS) {
      try {
        const url = `${server}/stream?link=${encodeURIComponent(magnet)}&index=0&play`;
        // Verify server reachable
        const res = await fetch(`${server}/echo`, { method: 'GET' });
        if (res.ok) {
          setStreamUrl(url);
          setStatus('buffering');
          return;
        }
      } catch (_) {}
    }
    // Fallback: try direct WebView-based player with magnet
    setStreamUrl(buildWebPlayerUrl(magnet));
    setStatus('buffering');
  }

  function buildWebPlayerUrl(magnet) {
    // Use a public web-based torrent player as final fallback
    return `https://webtor.io/#action=load&magnet=${encodeURIComponent(magnet)}`;
  }

  const hideControls = useCallback(() => {
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  const toggleControls = () => {
    setControlsVisible(v => {
      if (!v) hideControls();
      return !v;
    });
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // If we use WebView fallback (web-based player)
  const useWebFallback = streamUrl?.startsWith('https://webtor.io') || !streamUrl;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {status === 'loading' ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Connecting to torrent swarm...</Text>
          <Text style={styles.loadingSubText}>{torrent?.title}</Text>
        </View>
      ) : useWebFallback ? (
        // WebView fallback — web-based torrent player
        <WebView
          source={{ uri: streamUrl || buildWebPlayerUrl(magnet) }}
          style={styles.webview}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoadStart={() => setStatus('buffering')}
          onLoad={() => setStatus('playing')}
          onError={() => {
            setStatus('error');
            setErrorMsg('Failed to load player. Check your connection.');
          }}
        />
      ) : (
        // Native video player via react-native-video
        <NativePlayer
          streamUrl={streamUrl}
          paused={paused}
          onProgress={({ currentTime, seekableDuration }) => {
            setProgress(currentTime);
            setDuration(seekableDuration);
            setStatus('playing');
          }}
          onBuffer={({ isBuffering }) => isBuffering && setStatus('buffering')}
          onError={(e) => { setStatus('error'); setErrorMsg(e.error?.errorString || 'Playback error.'); }}
          onPress={toggleControls}
        />
      )}

      {/* Status overlay */}
      {status === 'buffering' && (
        <View style={styles.bufferOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.bufferText}>Buffering...</Text>
        </View>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <View style={styles.errorOverlay}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.accent} />
          <Text style={styles.errorTitle}>Playback Error</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={initStream}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.webPlayerBtn} onPress={() => {
            setStreamUrl(buildWebPlayerUrl(magnet));
            setStatus('buffering');
          }}>
            <Text style={styles.webPlayerText}>Open Web Player</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controls overlay */}
      {controlsVisible && status === 'playing' && !useWebFallback && (
        <TouchableOpacity style={styles.controls} onPress={toggleControls} activeOpacity={1}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.videoTitle} numberOfLines={1}>{torrent?.title}</Text>
          <TouchableOpacity onPress={() => setPaused(p => !p)} style={styles.playPause}>
            <MaterialIcons name={paused ? 'play-arrow' : 'pause'} size={48} color="#fff" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${duration ? (progress / duration) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.timeText}>{formatTime(progress)} / {formatTime(duration)}</Text>
        </TouchableOpacity>
      )}

      {/* Back button always visible for non-playing states or TV */}
      {(status !== 'playing' || isTV) && (
        <TouchableOpacity
          style={styles.floatingBack}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Lazy-import native video to avoid crash if not installed
let Video = null;
function NativePlayer({ streamUrl, paused, onProgress, onBuffer, onError, onPress }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      Video = require('react-native-video').default;
      setReady(true);
    } catch (e) {
      // react-native-video not available, signal error
      onError({ error: { errorString: 'Native video module not available.' } });
    }
  }, []);

  if (!ready || !Video) return <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />;

  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={1}>
      <Video
        source={{ uri: streamUrl }}
        style={StyleSheet.absoluteFill}
        paused={paused}
        resizeMode="contain"
        onProgress={onProgress}
        onBuffer={onBuffer}
        onError={onError}
        controls={false}
        progressUpdateInterval={500}
        bufferConfig={{
          minBufferMs: 5000,
          maxBufferMs: 30000,
          bufferForPlaybackMs: 2000,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: 14,
    padding: 32,
  },
  loadingText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  loadingSubText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 10,
  },
  bufferText: { color: '#fff', fontSize: 14 },
  errorOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: 12,
    padding: 32,
  },
  errorTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  errorMsg: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  webPlayerBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  webPlayerText: { color: COLORS.primary, fontWeight: '600' },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    justifyContent: 'space-between',
  },
  backBtn: { alignSelf: 'flex-start', padding: 8 },
  videoTitle: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  playPause: { alignSelf: 'center' },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  progressFill: { height: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'right', marginRight: 8 },
  floatingBack: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
});
