# ExtTorrent Android App

A full-featured Android + Android TV torrent browser and streaming app built with React Native / Expo.

## Features
- 🔍 Search torrents from ext.to
- 🔥 Trending & latest torrents
- 📁 Browse by category (Movies, TV, Music, Games, Software, Anime...)
- 📱 **Phone layout**: bottom navigation, swipe-friendly
- 📺 **TV layout**: D-pad navigation, YouTube-TV-style on-screen keyboard
- ▶️ **In-app streaming**: play torrents without downloading
- 🔗 Open in VLC for Android (best quality)
- 🌙 Dark Material You theme

## Architecture

```
App (React Native)
  │
  └─► API Backend (https://ext-torrent-backend.onrender.com)
        │
        └─► ext.to (scraping with Cloudflare bypass)
```

## Build APK (EAS Cloud Build — No SDK needed)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
# Create free account at expo.dev if needed
```

### Step 3: Configure project
```bash
cd TorrentApp
eas build:configure
```

### Step 4: Build APK
```bash
eas build -p android --profile preview
```

This will:
1. Upload your code to Expo's cloud build servers
2. Build the APK remotely (takes ~5-10 minutes)
3. Give you a download link for the APK

### Step 5: Download & Install
- Download the APK from the link provided
- Transfer to your Android device/TV
- Enable "Install from unknown sources" in Settings
- Install and enjoy!

## Screens

| Screen | Description |
|--------|-------------|
| Home | Trending + Latest + Categories |
| Search | Full-text search with sort options |
| Browse | Category browser with tabs (Browse/Trending/Latest) |
| Detail | Torrent metadata, file list, play/stream buttons |
| Player | In-app streaming (TorrServer) or WebTorrent fallback |

## TV Support

The app auto-detects Android TV mode via `Platform.isTV`:
- Shows on-screen keyboard (YouTube TV style) for search
- D-pad navigation with focus highlighting (purple glow)
- Larger fonts and touch targets
- No bottom tab bar (uses stack navigation)
