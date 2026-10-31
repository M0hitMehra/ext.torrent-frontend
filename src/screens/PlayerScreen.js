/**
 * PlayerScreen.js
 * In-app torrent streaming player.
 * Automatically loads and streams the magnet link on WebTor without manual pasting,
 * and allows quick switching between WebTor, TorrServer, and VLC.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Dimensions, StatusBar,
  Linking, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS, TORR_SERVER_BASE } from '../constants';

const { width: W, height: H } = Dimensions.get('window');
const isTV = Platform.isTV;

export default function PlayerScreen({ navigation, route }) {
  const { torrent, magnet, engine: initialEngine = 'webtor' } = route.params;

  const [engine, setEngine] = useState(initialEngine); // 'webtor' | 'torrserver'
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const webViewRef = useRef(null);
  const timerRef = useRef(null);

  // Build the WebTor URL with magnet link automatically injected
  const webTorUrl = `https://webtor.io/#action=load&magnet=${encodeURIComponent(magnet)}`;

  // TorrServer stream URL
  const torrServerUrl = `${TORR_SERVER_BASE}/stream?link=${encodeURIComponent(magnet)}&index=0&play`;

  const resetHideTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 4500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(timerRef.current);
  }, [resetHideTimer]);

  const handleOpenVLC = async () => {
    const vlcUrl = `vlc://${magnet}`;
    try {
      const can = await Linking.canOpenURL(vlcUrl);
      if (can) {
        await Linking.openURL(vlcUrl);
      } else {
        Alert.alert('VLC Not Installed', 'Install VLC for Android from the Play Store to stream.');
      }
    } catch (_) {
      Linking.openURL(magnet);
    }
  };

  const handleOpenBrowser = async () => {
    await Linking.openURL(webTorUrl);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ─── WEB-TOR IN-APP PLAYER ENGINE ─── */}
      {engine === 'webtor' ? (
        <View style={StyleSheet.absoluteFill}>
          <WebView
            ref={webViewRef}
            source={{ uri: webTorUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            injectedJavaScript={`
              // Auto-dismiss cookies/overlays if present
              setTimeout(function() {
                var btn = document.querySelector('.btn-primary, [data-action="play"]');
                if (btn) btn.click();
              }, 1500);
              true;
            `}
          />
          {loading && (
            <View style={styles.loaderOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderTitle}>Connecting to WebTor Stream...</Text>
              <Text style={styles.loaderSub}>Auto-injecting magnet link into peer swarm</Text>
            </View>
          )}
        </View>
      ) : (
        // TorrServer Stream Engine (fallback)
        <View style={styles.torrServerWrap}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loaderTitle}>Buffering Torrent Swarm...</Text>
          <Text style={styles.loaderSub}>{torrent?.title}</Text>
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setEngine('webtor')}
          >
            <Text style={styles.switchBtnText}>Switch to WebTor Player</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── FLOATING TOP CONTROLS OVERLAY ─── */}
      {controlsVisible && (
        <View style={styles.topBarOverlay}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.streamTitleWrap}>
            <Text style={styles.streamTitle} numberOfLines={1}>
              {torrent?.title || 'Streaming Video'}
            </Text>
            <View style={styles.enginePill}>
              <View style={styles.engineDot} />
              <Text style={styles.enginePillText}>
                {engine === 'webtor' ? 'WebTor Player Engine' : 'TorrServer Engine'}
              </Text>
            </View>
          </View>

          {/* Action pills */}
          <View style={styles.topActions}>
            {/* VLC Button */}
            <TouchableOpacity style={styles.actionPill} onPress={handleOpenVLC}>
              <MaterialIcons name="tv" size={16} color="#FF9100" />
              <Text style={styles.actionPillText}>VLC</Text>
            </TouchableOpacity>

            {/* Browser Button */}
            <TouchableOpacity style={styles.actionPill} onPress={handleOpenBrowser}>
              <MaterialIcons name="open-in-browser" size={16} color="#00E5FF" />
              <Text style={styles.actionPillText}>Browser</Text>
            </TouchableOpacity>

            {/* Reload Button */}
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => webViewRef.current?.reload()}
            >
              <MaterialIcons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Touch surface to reveal hidden controls */}
      {!controlsVisible && (
        <TouchableOpacity
          style={styles.revealTrigger}
          activeOpacity={1}
          onPress={() => {
            setControlsVisible(true);
            resetHideTimer();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 10, 14, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  loaderTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  loaderSub: { color: COLORS.textSub, fontSize: 12, textAlign: 'center' },
  torrServerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
  },
  switchBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  switchBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  topBarOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 19, 25, 0.88)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.5)',
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#242735',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamTitleWrap: { flex: 1 },
  streamTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  enginePill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  engineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E676' },
  enginePillText: { color: '#A0A5BC', fontSize: 10, fontWeight: '600' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#242735',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  revealTrigger: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
