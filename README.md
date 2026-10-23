# Selah Music Player — Cross-Platform Mobile & Desktop Music Companion

A modern, aesthetic music and devotional player blending hardware audio controls and local offline device storage with the daily spiritual inspiration of the Psalms and Scripture.

---

## 📱 Mobile App (React Native / Expo for Android & iOS)

Located in the [`mobile/`](./mobile) directory.

### Core Features
- **Verse of the Day Hero Banner**: Daily scripture reflection and devotion streak badge (🔥 Day 14).
- **Offline Phone Storage Scanner**: Powered by `expo-media-library` to auto-scan and organize all device MP3s, WAVs, and FLAC files by Tracks and Artists.
- **Floating Mini-Player Bar**: Positioned above bottom navigation tabs with animated rotating vinyl disc, track controls, and status ticker.
- **Expandable Full-Screen Modal Player**: Interactive tap-to-seek audio scrubber, rotating vinyl disc, synchronized lyrics view, and audio waveform visualizer.
- **Bedtime Sleep Timer**: Automatic countdown timer (15m, 30m, 45m, 60m) with gentle audio fade-out.
- **Playback Speed Controller**: Adjust playback rates (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`) with pitch correction.
- **Permanent Offline Persistence**: `@react-native-async-storage/async-storage` saves user favorites, imported songs, and streaks locally.
- **5-Band Sound Equalizer & Settings**: Audio presets including Worship & Choral, Bass Boost, Acoustic Clarity, Vocal Enhance, and Flat.
- **YouTube Watch Theatre**: Embedded official player compliant with Google Play Store Policies and YouTube Terms of Service.

### Quick Start (Mobile)
```bash
cd mobile
npx expo start
```
- Scan the QR code using the **Expo Go** app on your phone.
- Or press `a` to run on an Android emulator.

---

## 💻 Web & Desktop Companion App

Located in the root directory.

```bash
npm install
npm run dev
```
Preview in your browser at `http://localhost:5173/`, or package for desktop:
```bash
npm run electron
```

---

## 🛡️ Play Store & YouTube Terms of Service Compliance
1. **Official YouTube IFrame Player**: Rendered strictly using Google's official player API.
2. **No Stream Ripping**: Audio is never extracted, downloaded, or cached separately from YouTube video.
3. **Private Device Storage**: Local audio files remain 100% private in user device storage.

---

## 📄 License
MIT License. Built with React Native, Expo, and React.
