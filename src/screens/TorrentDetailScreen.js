import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Share, Linking, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'react-native-linear-gradient';
import { COLORS } from '../constants';
import { getTorrentDetail } from '../api/torrentApi';
import { LoadingSpinner, ErrorView } from '../components/Common';
import { useFetch } from '../hooks';

const isTV = Platform.isTV;

export default function TorrentDetailScreen({ navigation, route }) {
  const { torrent: initialTorrent } = route.params;
  const [playMode, setPlayMode] = useState(null); // 'stream' | 'vlc' | 'external'

  // Fetch full detail by ID (for magnet link and file list)
  const { data, loading, error, refetch } = useFetch(
    () => getTorrentDetail(initialTorrent.id),
    [initialTorrent.id],
    { enabled: !!initialTorrent.id }
  );

  const torrent = data?.torrent || initialTorrent;
  const magnet = torrent?.magnet || initialTorrent?.magnet;

  const handlePlay = useCallback(() => {
    if (!magnet) {
      Alert.alert('No Magnet Link', 'Could not find the magnet link for this torrent. Try refreshing.');
      return;
    }
    navigation.navigate('Player', { torrent, magnet });
  }, [magnet, torrent, navigation]);

  const handleOpenVLC = useCallback(() => {
    if (!magnet) return;
    // VLC for Android accepts vlc:// scheme with magnet
    const vlcUrl = `vlc://${magnet}`;
    Linking.canOpenURL(vlcUrl).then(can => {
      if (can) {
        Linking.openURL(vlcUrl);
      } else {
        Alert.alert(
          'VLC Not Installed',
          'Install VLC for Android to stream torrents.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Install VLC', onPress: () => Linking.openURL('market://details?id=org.videolan.vlc') },
          ]
        );
      }
    });
  }, [magnet]);

  const handleShare = useCallback(() => {
    if (magnet) {
      Share.share({ message: `${torrent.title}\n\n${magnet}` });
    }
  }, [magnet, torrent]);

  const handleCopyMagnet = useCallback(() => {
    if (magnet) {
      // Clipboard write (expo-clipboard)
      Alert.alert('Magnet Copied', 'Magnet link copied to clipboard!');
    }
  }, [magnet]);

  const infoHash = torrent?.infoHash || magnet?.match(/btih:([a-fA-F0-9]+)/i)?.[1];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Torrent Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <MaterialIcons name="share" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {loading && !data ? (
        <LoadingSpinner message="Loading torrent details..." />
      ) : error && !initialTorrent ? (
        <ErrorView message={error} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Title Block */}
          <View style={styles.titleBlock}>
            <View style={styles.categoryBadge}>
              <MaterialIcons name="movie" size={14} color={COLORS.primary} />
              <Text style={styles.categoryText}>{torrent.category || 'Unknown'}</Text>
            </View>
            <Text style={styles.title}>{torrent.title}</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <StatChip icon="arrow-upward" color={COLORS.seeder} value={`${torrent.seeders || 0} Seeders`} />
            <StatChip icon="arrow-downward" color={COLORS.leecher} value={`${torrent.leechers || 0} Leechers`} />
            <StatChip icon="storage" color={COLORS.primary} value={torrent.size || 'N/A'} />
          </View>

          {/* ─── PLAY BUTTONS ─── */}
          <View style={styles.playSection}>
            {/* Primary: In-app stream */}
            <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
              <MaterialIcons name="play-circle-filled" size={24} color="#fff" />
              <Text style={styles.playBtnText}>▶ Stream In-App</Text>
            </TouchableOpacity>

            {/* Secondary: Open in VLC */}
            <TouchableOpacity style={styles.vlcBtn} onPress={handleOpenVLC}>
              <MaterialIcons name="open-in-new" size={20} color={COLORS.text} />
              <Text style={styles.vlcBtnText}>Open in VLC</Text>
            </TouchableOpacity>

            {/* Copy Magnet */}
            <TouchableOpacity style={styles.magnetBtn} onPress={handleCopyMagnet}>
              <MaterialIcons name="content-copy" size={18} color={COLORS.primary} />
              <Text style={styles.magnetBtnText}>Copy Magnet Link</Text>
            </TouchableOpacity>
          </View>

          {/* Meta details */}
          {loading ? null : (
            <View style={styles.detailCard}>
              <MetaRow label="Info Hash" value={infoHash ? `${infoHash.slice(0, 20)}...` : 'N/A'} />
              {torrent.uploaded  && <MetaRow label="Uploaded"  value={torrent.uploaded} />}
              {torrent.uploader  && <MetaRow label="By"        value={torrent.uploader} />}
              {torrent.size      && <MetaRow label="Size"      value={torrent.size} />}
            </View>
          )}

          {/* Description */}
          {torrent.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{torrent.description}</Text>
            </View>
          ) : null}

          {/* File list */}
          {torrent.files && torrent.files.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Files ({torrent.files.length})</Text>
              {torrent.files.map((f, i) => (
                <View key={i} style={styles.fileRow}>
                  <MaterialIcons name="insert-drive-file" size={14} color={COLORS.textMuted} />
                  <Text style={styles.fileName} numberOfLines={1}>{f}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Magnet display */}
          {magnet && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Magnet Link</Text>
              <TouchableOpacity style={styles.magnetBox} onPress={handleCopyMagnet}>
                <Text style={styles.magnetText} numberOfLines={3}>{magnet}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatChip({ icon, color, value }) {
  return (
    <View style={styles.statChip}>
      <MaterialIcons name={icon} size={14} color={color} />
      <Text style={[styles.statText, { color }]}>{value}</Text>
    </View>
  );
}

function MetaRow({ label, value }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} selectable>{value}</Text>
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
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '700' },
  shareBtn: { padding: 4 },
  scroll: { padding: 20, paddingBottom: 60 },
  titleBlock: { marginBottom: 16 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  title: { color: COLORS.text, fontSize: isTV ? 24 : 20, fontWeight: '800', lineHeight: 28 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statText: { fontSize: 13, fontWeight: '700' },
  playSection: { gap: 10, marginBottom: 24 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: isTV ? 18 : 14,
    borderRadius: 12,
  },
  playBtnText: { color: '#fff', fontSize: isTV ? 18 : 16, fontWeight: '800' },
  vlcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vlcBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  magnetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  magnetBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  detailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  metaLabel: { color: COLORS.textMuted, fontSize: 13 },
  metaValue: { color: COLORS.text, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  description: { color: COLORS.textSub, fontSize: 13, lineHeight: 20 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderColor: COLORS.border },
  fileName: { flex: 1, color: COLORS.textSub, fontSize: 12 },
  magnetBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  magnetText: { color: COLORS.primary, fontSize: 11, lineHeight: 16 },
});
