/**
 * PlayerSelectorModal.js
 * Neumorphic modal offering multiple player options for streaming torrents.
 * TV & Mobile compatible with D-pad focus states.
 */

import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Platform, Linking, Alert,
} from 'react-native';
import { FocusableOpacity } from './FocusableOpacity';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTVFocus, playTVFocusFeedback, playTVSelectFeedback, useTVRemote } from '../hooks';
import { getTheme, useAppSettings } from '../utils/settings';

const isTV = Platform.isTV;

export function PlayerSelectorModal({ visible, onClose, torrent, magnet, onSelectInApp }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const [modalFocus, setModalFocus] = React.useState(0);
  if (!torrent || !magnet) return null;

  const handleWebTorInApp = () => {
    playTVSelectFeedback();
    onClose();
    onSelectInApp('webtor');
  };

  const handleOpenVLC = async () => {
    playTVSelectFeedback();
    onClose();
    const vlcUrl = `vlc://${magnet}`;
    try {
      const can = await Linking.canOpenURL(vlcUrl);
      if (can) {
        await Linking.openURL(vlcUrl);
      } else {
        Alert.alert(
          'VLC Not Installed',
          'Would you like to install VLC for Android from the Play Store?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Install VLC', onPress: () => Linking.openURL('market://details?id=org.videolan.vlc') },
          ]
        );
      }
    } catch (_) {
      Linking.openURL(magnet);
    }
  };

  const handleOpenWebTorBrowser = async () => {
    playTVSelectFeedback();
    onClose();
    const webTorUrl = `https://webtor.io/${encodeURIComponent(magnet)}`;
    await Linking.openURL(webTorUrl);
  };

  const handleOpenSystemDefault = async () => {
    playTVSelectFeedback();
    onClose();
    try {
      await Linking.openURL(magnet);
    } catch (e) {
      Alert.alert('No Handler', 'No app on this device is registered to open magnet links. Please install VLC or a BitTorrent player.');
    }
  };

  const modalActions = [
    handleWebTorInApp,
    handleOpenVLC,
    handleOpenWebTorBrowser,
    handleOpenSystemDefault,
  ];

  useTVRemote((eventType) => {
    if (!visible) return;

    if (eventType === 'up') {
      if (modalFocus > 0) {
        playTVFocusFeedback();
        setModalFocus(f => f - 1);
      }
    } else if (eventType === 'down') {
      if (modalFocus < modalActions.length - 1) {
        playTVFocusFeedback();
        setModalFocus(f => f + 1);
      }
    } else if (eventType === 'select') {
      playTVSelectFeedback();
      modalActions[modalFocus]?.();
    } else if (eventType === 'back') {
      onClose();
    }
  }, visible);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrapper}>
                <MaterialIcons name="play-circle-filled" size={26} color={COLORS.primaryGlow} />
              </View>
              <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Select Streaming Player</Text>
              <Text style={[styles.headerSub, { color: theme.textMuted }]} numberOfLines={1}>{torrent.title}</Text>
              </View>
            </View>
            <FocusableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={22} color={COLORS.textMuted} />
            </FocusableOpacity>
          </View>

          {/* Player Option Tiles */}
          <View style={styles.optionsList}>
            {/* 1. In-App WebTor Player */}
            <PlayerOptionTile
              icon="language"
              iconColor="#00E5FF"
              badge="AUTO-PASTE"
              title="WebTor In-App Player"
              description="Loads this magnet directly in the embedded Webtor player."
              onPress={handleWebTorInApp}
              recommended
              isFocused={modalFocus === 0}
            />

            {/* 2. VLC Player */}
            <PlayerOptionTile
              icon="video-settings"
              iconColor="#FF9100"
              badge="EXTERNAL"
              title="VLC for Android"
              description="Opens in official VLC with hardware acceleration and subtitle support."
              onPress={handleOpenVLC}
              isFocused={modalFocus === 1}
            />

            {/* 3. Browser WebTor */}
            <PlayerOptionTile
              icon="open-in-browser"
              iconColor="#00E676"
              title="Open WebTor in Browser"
              description="Launches external Chrome/browser with magnet auto-loaded."
              onPress={handleOpenWebTorBrowser}
              isFocused={modalFocus === 2}
            />

            {/* 4. System Intent */}
            <PlayerOptionTile
              icon="phone-android"
              iconColor={COLORS.textSub}
              title="Other Installed Media Player"
              description="Pass magnet to MX Player, Just Player, or system default."
              onPress={handleOpenSystemDefault}
              isFocused={modalFocus === 3}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function PlayerOptionTile({ icon, iconColor, badge, title, description, onPress, recommended, isFocused }) {
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.tile,
        recommended && styles.tileRecommended,
        { backgroundColor: theme.card, borderColor: theme.border },
        isFocused && {
          borderColor: '#FFFFFF',
          borderWidth: 3.5,
          transform: [{ scale: 1.05 }],
          elevation: 16,
          shadowColor: '#FF5722',
          shadowOpacity: 1,
          shadowRadius: 16,
        },
      ]}
      onPress={onPress}
    >
      onBlur={onBlur}
    >
      <View style={[styles.tileIconCircle, { backgroundColor: iconColor + '20' }]}>
        <MaterialIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.tileTextWrap}>
        <View style={styles.tileTitleRow}>
          <Text style={[styles.tileTitle, { color: theme.text }, focused && styles.tileTitleFocused]}>{title}</Text>
          {badge && (
            <View style={[styles.badge, recommended && styles.badgeRec, focused && styles.badgeFocused]}>
              <Text style={[styles.badgeText, focused && styles.badgeTextFocused]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tileDesc, { color: theme.textSub }, focused && styles.tileDescFocused]} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={focused ? '#FFFFFF' : COLORS.textMuted}
      />
      {focused && (
        <View style={styles.tileBeacon}>
          <Text style={styles.tileBeaconText}>SELECT</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: isTV ? 680 : 440,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionsList: { gap: 10 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderTopColor: COLORS.cardHighlight,
    borderLeftColor: COLORS.cardHighlight,
    borderBottomColor: COLORS.cardShadow,
    borderRightColor: COLORS.cardShadow,
    gap: 12,
  },
  tileRecommended: {
    borderColor: COLORS.primary + '55',
    borderWidth: 1.5,
  },
  tileFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.8,
    backgroundColor: '#262A3C',
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 16,
    elevation: 14,
  },
  tileTitleFocused: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tileDescFocused: {
    color: '#FFFFFF',
  },
  badgeFocused: {
    backgroundColor: COLORS.primary,
  },
  badgeTextFocused: {
    color: '#FFFFFF',
  },
  tileBeacon: {
    backgroundColor: COLORS.tvPointer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  tileBeaconText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  tileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTextWrap: { flex: 1 },
  tileTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  tileTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: COLORS.cardShadow,
  },
  badgeRec: {
    backgroundColor: COLORS.primary + '33',
  },
  badgeText: { color: COLORS.primary, fontSize: 9, fontWeight: '800' },
  tileDesc: { color: COLORS.textSub, fontSize: 11, lineHeight: 15 },
});
