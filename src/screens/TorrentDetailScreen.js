/**
 * TorrentDetailScreen.js
 * Neumorphic detailed view for a torrent entry.
 * Features:
 *  - High-res poster & trailer integration (only shown if available)
 *  - Working clipboard copy via expo-clipboard
 *  - Multi-engine Player Selector (WebTor auto-paste, TorrServer, VLC, Browser)
 *  - TV D-pad focusable buttons
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Image, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { setClipboardString } from '../utils/clipboard';
import { COLORS } from '../constants';
import { getTorrentDetail } from '../api/torrentApi';
import { fetchMediaMetadata } from '../api/metaApi';
import { PlayerSelectorModal } from '../components/PlayerSelectorModal';
import { LoadingSpinner, ErrorView } from '../components/Common';
import { useTVFocus, playTVSelectFeedback } from '../hooks';

const isTV = Platform.isTV;

export default function TorrentDetailScreen({ navigation, route }) {
  const { torrent: initialTorrent } = route.params;

  const [detail, setDetail] = useState(initialTorrent);
  const [metadata, setMetadata] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [copied, setCopied] = useState(false);
  const [playerModalVisible, setPlayerModalVisible] = useState(false);

  const magnet = detail?.magnet || initialTorrent?.magnet;
  const infoHash = detail?.infoHash || magnet?.match(/btih:([a-fA-F0-9]+)/i)?.[1];

  // Fetch full detail from backend (if needed)
  useEffect(() => {
    let isMounted = true;
    if (initialTorrent?.id && (!initialTorrent.description || !initialTorrent.files)) {
      setLoadingDetail(true);
      getTorrentDetail(initialTorrent.id)
        .then(res => {
          if (isMounted && res.torrent) {
            setDetail(prev => ({ ...prev, ...res.torrent }));
          }
        })
        .catch(e => console.warn('Detail fetch error:', e.message))
        .finally(() => { if (isMounted) setLoadingDetail(false); });
    }
    return () => { isMounted = false; };
  }, [initialTorrent]);

  // Fetch poster & trailer metadata (Cinemeta / TVMaze)
  useEffect(() => {
    let isMounted = true;
    setLoadingMeta(true);
    fetchMediaMetadata(initialTorrent?.title)
      .then(meta => {
        if (isMounted) {
          setMetadata(meta);
        }
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setLoadingMeta(false); });
    return () => { isMounted = false; };
  }, [initialTorrent]);

  // Working copy to clipboard
  const handleCopyMagnet = useCallback(async () => {
    if (!magnet) {
      Alert.alert('No Magnet', 'Magnet link not available for this torrent.');
      return;
    }
    try {
      const success = await setClipboardString(magnet);
      if (!success) throw new Error('Clipboard unavailable');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      Alert.alert('Could not copy link', e.message || 'Please try again.');
    }
  }, [magnet]);

  // Open Player Selector Modal
  const handleOpenPlayerModal = useCallback(() => {
    if (!magnet) {
      Alert.alert('No Magnet Link', 'Magnet link is still loading. Please wait a moment.');
      return;
    }
    setPlayerModalVisible(true);
  }, [magnet]);

  // Handle in-app stream selection from modal
  const handleSelectInAppEngine = useCallback((engine) => {
    navigation.navigate('Player', {
      torrent: detail,
      magnet,
      engine,
    });
  }, [detail, magnet, navigation]);

  // Open Official Trailer (if available)
  const handleOpenTrailer = useCallback(async () => {
    if (metadata?.trailerUrl) {
      try {
        await Linking.openURL(metadata.trailerUrl);
      } catch (_) {
        Alert.alert('Trailer', 'Could not open trailer link.');
      }
    }
  }, [metadata]);

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <DetailBackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail?.title || 'Torrent Details'}
        </Text>
        <DetailCopyHeaderButton copied={copied} onPress={handleCopyMagnet} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── POSTER / BACKDROP CARD (Only rendered if available) ─── */}
        {metadata && metadata.poster ? (
          <View style={styles.posterCard}>
            <Image
              source={{ uri: metadata.poster }}
              style={styles.posterImage}
              resizeMode="cover"
            />
            <View style={styles.posterInfo}>
              <Text style={styles.metaTitle} numberOfLines={2}>{metadata.name}</Text>
              
              <View style={styles.posterMetaRow}>
                {metadata.year && (
                  <View style={styles.yearChip}>
                    <Text style={styles.yearChipText}>{metadata.year}</Text>
                  </View>
                )}
                {metadata.rating && (
                  <View style={styles.ratingChip}>
                    <MaterialIcons name="star" size={12} color={COLORS.gold} />
                    <Text style={styles.ratingText}>{metadata.rating}</Text>
                  </View>
                )}
              </View>

              {metadata.genres && metadata.genres.length > 0 && (
                <Text style={styles.genresText} numberOfLines={1}>
                  {metadata.genres.join(' • ')}
                </Text>
              )}

              {/* Watch Trailer Button (only if trailer available) */}
              {metadata.trailerUrl && (
                <DetailTrailerButton onPress={handleOpenTrailer} />
              )}
            </View>
          </View>
        ) : null}

        {/* ─── TITLE & BADGE BLOCK ─── */}
        <View style={styles.neuBlock}>
          <View style={styles.catBadgeRow}>
            <View style={styles.catBadge}>
              <MaterialIcons name="local-offer" size={12} color={COLORS.primaryGlow} />
              <Text style={styles.catBadgeText}>{detail.category || 'General'}</Text>
            </View>
            {detail.uploader && (
              <Text style={styles.uploaderText}>by {detail.uploader}</Text>
            )}
          </View>

          <Text style={styles.torrentTitle}>{detail.title}</Text>

          {/* Quick Metrics */}
          <View style={styles.statsGrid}>
            <View style={styles.statTile}>
              <MaterialIcons name="arrow-upward" size={16} color={COLORS.seeder} />
              <Text style={[styles.statValue, { color: COLORS.seeder }]}>
                {(parseInt(detail.seeders) || 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Seeders</Text>
            </View>

            <View style={styles.statTile}>
              <MaterialIcons name="arrow-downward" size={16} color={COLORS.leecher} />
              <Text style={[styles.statValue, { color: COLORS.leecher }]}>
                {(parseInt(detail.leechers) || 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Leechers</Text>
            </View>

            <View style={styles.statTile}>
              <MaterialIcons name="storage" size={16} color={COLORS.secondary} />
              <Text style={[styles.statValue, { color: COLORS.secondary }]}>
                {detail.size || 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Size</Text>
            </View>
          </View>
        </View>

        {/* ─── ACTION BUTTONS (Neumorphic Extruded with TV Pointer) ─── */}
        <View style={styles.actionSection}>
          {/* Main Primary Stream Button */}
          <DetailStreamMainButton onPress={handleOpenPlayerModal} />

          {/* Copy Magnet Button with Live Feedback */}
          <DetailCopyMagnetButton copied={copied} onPress={handleCopyMagnet} />
        </View>

        {/* ─── DESCRIPTION (If available) ─── */}
        {(metadata?.description || detail.description) ? (
          <View style={styles.neuBlock}>
            <Text style={styles.sectionHeading}>About this Release</Text>
            <Text style={styles.descriptionText} numberOfLines={8}>
              {metadata?.description || detail.description}
            </Text>
          </View>
        ) : null}

        {/* ─── FILE LIST (If available) ─── */}
        {detail.files && detail.files.length > 0 && (
          <View style={styles.neuBlock}>
            <Text style={styles.sectionHeading}>Included Files ({detail.files.length})</Text>
            {detail.files.slice(0, 15).map((f, i) => (
              <View key={i} style={styles.fileRow}>
                <MaterialIcons name="insert-drive-file" size={14} color={COLORS.textMuted} />
                <Text style={styles.fileNameText} numberOfLines={1}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── MAGNET PREVIEW BOX ─── */}
        {magnet && (
          <View style={styles.neuBlock}>
            <Text style={styles.sectionHeading}>Raw Magnet URI</Text>
            <DetailMagnetBox magnet={magnet} onPress={handleCopyMagnet} />
          </View>
        )}
      </ScrollView>

      {/* Multiple Player Options Modal */}
      <PlayerSelectorModal
        visible={playerModalVisible}
        onClose={() => setPlayerModalVisible(false)}
        torrent={detail}
        magnet={magnet}
        onSelectInApp={handleSelectInAppEngine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  headerTitle: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '700' },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  scroll: { padding: 16, paddingBottom: 60, gap: 14 },

  // Poster Card
  posterCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  posterImage: {
    width: 120,
    height: 170,
    backgroundColor: COLORS.input,
  },
  posterInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    gap: 6,
  },
  metaTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  posterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearChip: {
    backgroundColor: COLORS.input,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yearChipText: { color: COLORS.textSub, fontSize: 11, fontWeight: '700' },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.input,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { color: COLORS.gold, fontSize: 11, fontWeight: '800' },
  genresText: { color: COLORS.textMuted, fontSize: 11 },
  trailerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF5252' + '22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FF5252' + '44',
  },
  trailerBtnText: { color: '#FF7070', fontSize: 11, fontWeight: '800' },

  // Neumorphic Block
  neuBlock: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  catBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: { color: COLORS.primaryGlow, fontSize: 10, fontWeight: '800' },
  uploaderText: { color: COLORS.textMuted, fontSize: 11 },
  torrentTitle: {
    color: COLORS.text,
    fontSize: isTV ? 20 : 17,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.input,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  statValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },

  // Actions
  actionSection: { gap: 10 },
  btnPrimaryStream: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  btnPrimaryStreamFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 16,
  },
  streamPointerPill: {
    backgroundColor: COLORS.tvPointer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  streamPointerPillText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  btnCopyMagnetFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    backgroundColor: COLORS.surfaceElevated,
    transform: [{ scale: 1.05 }],
  },
  trailerBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: '#FF5252' + '33',
    transform: [{ scale: 1.08 }],
  },
  backBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: COLORS.primary,
  },
  shareBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: COLORS.primary,
  },
  magnetBoxFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: COLORS.surfaceElevated,
  },
  btnPrimaryTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  btnPrimarySub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },

  btnCopyMagnet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  btnCopiedActive: {
    backgroundColor: COLORS.seeder + '15',
    borderColor: COLORS.seeder,
  },
  btnCopyText: { color: COLORS.primaryGlow, fontSize: 13, fontWeight: '700' },

  sectionHeading: { color: COLORS.text, fontSize: 14, fontWeight: '800', marginBottom: 10 },
  descriptionText: { color: COLORS.textSub, fontSize: 12, lineHeight: 18 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  fileNameText: { flex: 1, color: COLORS.textSub, fontSize: 11 },
  magnetBox: {
    backgroundColor: COLORS.input,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderTopColor: COLORS.cardShadow,
    borderLeftColor: COLORS.cardShadow,
    borderBottomColor: COLORS.cardHighlight,
    borderRightColor: COLORS.cardHighlight,
  },
  magnetText: { color: COLORS.primaryGlow, fontSize: 10, lineHeight: 14 },
  tapToCopyText: { color: COLORS.textMuted, fontSize: 9, marginTop: 4, textAlign: 'right' },
});

function DetailBackButton({ onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      style={[styles.backBtn, focused && styles.backBtnFocused]}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

function DetailCopyHeaderButton({ copied, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      style={[styles.shareBtn, focused && styles.shareBtnFocused]}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons
        name={copied ? 'check' : 'content-copy'}
        size={20}
        color={copied ? COLORS.seeder : '#FFFFFF'}
      />
    </TouchableOpacity>
  );
}

function DetailTrailerButton({ onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      style={[styles.trailerBtn, focused && styles.trailerBtnFocused]}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons name="movie" size={15} color="#FF5252" />
      <Text style={styles.trailerBtnText}>Watch Trailer</Text>
    </TouchableOpacity>
  );
}

function DetailStreamMainButton({ onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      style={[styles.btnPrimaryStream, focused && styles.btnPrimaryStreamFocused]}
      activeOpacity={0.85}
      hasTVPreferredFocus={isTV}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons name="play-arrow" size={30} color="#fff" />
      <View>
        <Text style={styles.btnPrimaryTitle}>STREAM VIDEO</Text>
        <Text style={styles.btnPrimarySub}>Choose WebTor, TorrServer, or VLC</Text>
      </View>
      {focused ? (
        <View style={styles.streamPointerPill}>
          <Text style={styles.streamPointerPillText}>PRESS OK</Text>
        </View>
      ) : (
        <MaterialIcons name="chevron-right" size={24} color="#fff" style={{ marginLeft: 'auto' }} />
      )}
    </TouchableOpacity>
  );
}

function DetailCopyMagnetButton({ copied, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      style={[
        styles.btnCopyMagnet,
        copied && styles.btnCopiedActive,
        focused && styles.btnCopyMagnetFocused,
      ]}
      activeOpacity={0.8}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <MaterialIcons
        name={copied ? 'check-circle' : 'content-copy'}
        size={20}
        color={copied ? COLORS.seeder : COLORS.primaryGlow}
      />
      <Text style={[styles.btnCopyText, copied && { color: COLORS.seeder }]}>
        {copied ? 'Magnet Link Copied to Clipboard!' : 'Copy Magnet Link'}
      </Text>
    </TouchableOpacity>
  );
}

function DetailMagnetBox({ magnet, onPress }) {
  const { focused, onFocus, onBlur } = useTVFocus();
  return (
    <TouchableOpacity
      style={[styles.magnetBox, focused && styles.magnetBoxFocused]}
      onPress={() => { playTVSelectFeedback(); onPress(); }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <Text style={styles.magnetText} numberOfLines={2}>{magnet}</Text>
      <Text style={styles.tapToCopyText}>Tap to copy URI</Text>
    </TouchableOpacity>
  );
}
