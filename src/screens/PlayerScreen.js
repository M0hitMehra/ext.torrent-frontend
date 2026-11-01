/** In-app Webtor embed player for a selected magnet URI. */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Platform, StatusBar, Linking, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS } from '../constants';
import { useTVFocus, playTVSelectFeedback } from '../hooks';

const isTV = Platform.isTV;

export default function PlayerScreen({ navigation, route }) {
  const { torrent, magnet } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const webViewRef = useRef(null);
  const safeMagnet = JSON.stringify(magnet || '').replace(/</g, '\\u003c');
  const safeTitle = JSON.stringify(torrent?.title || '').replace(/</g, '\\u003c');
  const playerHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <style>html,body,#player{width:100%;height:100%;min-height:100%;margin:0;background:#000;color:#fff;overflow:hidden}body{padding-top:env(safe-area-inset-top)}</style></head>
    <body><div id="player" class="webtor"></div>
    <script>window.webtor=window.webtor||[];window.webtor.push({id:'player',magnet:${safeMagnet},width:'100%',height:'100%',title:${safeTitle},controls:true});</script>
    <script src="https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js" charset="utf-8"></script>
    </body></html>`;
  const webTorUrl = `https://webtor.io/${encodeURIComponent(magnet)}`;

  useEffect(() => {
    // The embed SDK can finish loading before peers/files are resolved. Keep a
    // recovery action available if it never reaches a playable file.
    const fallbackTimer = setTimeout(() => setShowFallback(true), 25000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  const openVLC = async () => {
    try {
      await Linking.openURL(`vlc://${magnet}`);
    } catch (_) {
      Alert.alert('VLC unavailable', 'Install VLC or use Open in browser to continue.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        ref={webViewRef}
        source={{ html: playerHtml, baseUrl: 'https://webtor.io' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        javaScriptCanOpenWindowsAutomatically
        setSupportMultipleWindows={false}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        onHttpError={() => setError(true)}
      />
      {loading && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primaryGlow} />
          <Text style={styles.loaderTitle}>Opening Webtor player…</Text>
          <Text style={styles.loaderSub}>The selected magnet is sent directly to the embedded player.</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Webtor could not load. Try opening it in your browser.</Text>
          <PlayerAction label="Open Webtor" onPress={() => Linking.openURL(webTorUrl)} />
        </View>
      )}
      {showFallback && !error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Still loading? Webtor may be resolving the torrent or this file may not be streamable.</Text>
          <View style={styles.fallbackActions}>
            <PlayerAction label="Open Webtor page" onPress={() => Linking.openURL(webTorUrl)} />
            <PlayerAction label="Try VLC" onPress={openVLC} />
          </View>
        </View>
      )}
      <View style={styles.topBar}>
        <PlayerAction icon="arrow-back" onPress={() => navigation.goBack()} preferred style={styles.iconBtn} />
        <Text style={styles.title} numberOfLines={1}>{torrent?.title || 'Streaming'}</Text>
        <PlayerAction icon="play-circle-outline" label="VLC" onPress={openVLC} style={styles.actionBtn} />
        <PlayerAction icon="refresh" onPress={() => webViewRef.current?.reload()} style={styles.iconBtn} />
      </View>
    </View>
  );
}

function PlayerAction({ icon, label, onPress, style, preferred = false }) {
  const { focused, focusStyle, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      hasTVPreferredFocus={isTV && preferred}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[style || styles.playerAction, focused && styles.playerActionFocused, focused && focusStyle]}
    >
      {icon && <MaterialIcons name={icon} size={20} color={focused ? '#fff' : COLORS.primaryGlow} />}
      {label && <Text style={[styles.actionText, focused && styles.actionTextFocused]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  loaderTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  loaderSub: { color: COLORS.textSub, fontSize: 13, textAlign: 'center' },
  topBar: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 16, backgroundColor: 'rgba(22,24,33,0.94)', borderWidth: 1, borderColor: COLORS.cardHighlight },
  iconBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 10, borderRadius: 12, backgroundColor: COLORS.card },
  actionText: { color: '#fff', fontWeight: '700' },
  playerAction: { minHeight: 40, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  playerActionFocused: { borderWidth: 3, borderColor: '#fff', backgroundColor: 'rgba(232,91,67,0.5)', shadowColor: COLORS.primaryGlow, shadowOpacity: 1, shadowRadius: 14, elevation: 12, transform: [{ scale: 1.06 }] },
  actionTextFocused: { color: '#fff', fontWeight: '900' },
  errorBanner: { position: 'absolute', bottom: 22, left: 16, right: 16, padding: 14, borderRadius: 14, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', gap: 8 },
  errorText: { color: '#fff', textAlign: 'center' },
  linkText: { color: COLORS.primaryGlow, fontWeight: '800' },
  fallbackActions: { flexDirection: 'row', gap: 24 },
});
