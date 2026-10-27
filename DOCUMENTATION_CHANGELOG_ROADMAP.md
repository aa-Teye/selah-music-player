# Selah Music Player — Changes & Implementation Roadmap

> **Workflow Rule**: All proposed changes must be reviewed and approved by the user before committing or pushing (`git push`) to the remote repository.

---

## 📋 Status Overview
- **Application**: Selah Music Player (Cross-platform: Web, Desktop Electron, Mobile Android/iOS via Expo)
- **Current Mobile Target**: Expo SDK 57 / React Native 0.86 / Android APK Preview
- **Document Version**: 1.0.0
- **Last Updated**: October 27, 2026

---

## ✅ Section 1: Previously Implemented Changes

1. **Mobile EAS Build Configuration (`mobile/eas.json`)**
   - Configured `preview` build profile to output standalone Android APKs (`buildType: apk`).
   - Configured `requireCommit: true` to guarantee repeatable cloud build triggers.

2. **Cross-Platform Audio Engine (`mobile/App.js`, `expo-audio`)**
   - Integrated `expo-audio` with `setAudioModeAsync` for background playback (`shouldPlayInBackground: true`, `playsInSilentMode: true`).
   - Implemented real-time playback updates, scrubber seeking (`seekTo`), and playback speed control.
   - Built a bedtime sleep timer with automated gradual pausing.

3. **Persistent Offline Storage (`mobile/src/services/storageService.js`)**
   - Implemented AsyncStorage caching for:
     - Favorites (`@selah_favorites`)
     - Custom playlists (`@selah_playlists`)
     - Imported and scanned local audio tracks (`@selah_local_tracks`)
     - Daily Christian devotion streak tracking (`@selah_streak`)

4. **Multi-Tab UI Architecture**
   - **Home Screen**: Daily devotion, curated worship playlists, mood filters, trending tracks.
   - **Local Library**: Device scanning, manual file import, artist grouping, in-library search.
   - **YouTube Watch / Visual Worship**: Integrated `react-native-youtube-iframe` with live devotion commentary.
   - **Playlists Screen**: Custom user playlist creation, track addition, and playback.
   - **Equalizer Screen**: Presets (Gospel Warm, Acoustic Praise, Bass Boost, Vocal Pure) and custom 5-band EQ sliders.

---

## 🛠️ Section 2: Changes Implemented in Current Turn (Mobile APK Audio Scan Fix)

### Issue Addressed
- **Symptom**: Auto-Scan failed on Android APK ("Scan Error: Unable to scan storage"). The app did not show a permission dialog or detect local audio files on the device.
- **Root Cause 1 (Permission Integrity Mismatch)**:
  `MediaLibrary.requestPermissionsAsync()` was invoked without arguments. In Expo SDK 57 on Android 13+ (API 33+), `expo-media-library` defaults to requesting `['photo', 'video', 'audio']` and asserts that all 3 permissions exist in `AndroidManifest.xml`. Because `READ_MEDIA_IMAGES` and `READ_MEDIA_VIDEO` were not in the Android manifest, `expo-media-library` immediately threw a native `PermissionsException` without showing the Android permission prompt.
- **Root Cause 2 (SortBy Query Column Incompatibility)**:
  `MediaLibrary.getAssetsAsync` used `SortBy.creationTime`, which resolves to `DATE_TAKEN` (`datetaken`) in MediaStore. Audio records in Android MediaStore do not reliably contain a `datetaken` column, causing query failures on many Android versions.
- **Root Cause 3 (Single File Picker Limitation)**:
  `DocumentPicker.getDocumentAsync` was restricted to single file selection (`multiple: false`), preventing bulk manual imports.

### Changes Applied
1. **[LocalLibraryScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/LocalLibraryScreen.js)**:
   - Updated permission checking to use `MediaLibrary.getPermissionsAsync(false, ['audio'])` followed by `MediaLibrary.requestPermissionsAsync(false, ['audio'])`.
   - Added specific guidance dialog if permissions were previously denied with `canAskAgain === false` directing the user to device Settings.
   - Switched query sorting to `MediaLibrary.SortBy.modificationTime` (or fallback) to eliminate the invalid MediaStore column crash.
   - Added pagination loop to scan and aggregate up to 500 device audio tracks.
   - Added safety fallback query without sorting if a device ROM has non-standard MediaStore providers.
   - Upgraded `handlePickAudio` with `multiple: true` to allow importing one or multiple audio tracks simultaneously.
2. **[app.json](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/app.json)**:
   - Configured `expo-media-library` plugin with `granularPermissions: ["audio", "photo"]`.
3. **[AndroidManifest.xml](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/android/app/src/main/AndroidManifest.xml)**:
   - Added `android.permission.READ_MEDIA_IMAGES` alongside `android.permission.READ_MEDIA_AUDIO` and `READ_EXTERNAL_STORAGE` to guarantee integrity check passes across all Android API levels (Android 10 - 15+).

---

## ⏳ Section 3: Yet to Be Implemented (Roadmap & Backlog)

The following items are planned or scheduled for subsequent iterations:

1. **Enhanced Audio Metadata Extraction (Mobile)**
   - Extract embedded ID3 tags (artist, album, embedded album artwork) directly from scanned local files using pure JS tag parsers rather than fallback cover art.
2. **Folder-Based Filtering for Local Music**
   - Provide folder view (e.g. `Music/`, `Downloads/`, `WhatsApp Audio/`) in Local Library so users can exclude ringtones or voice notes.
3. **Android Media Notification & Lock Screen Controls**
   - Ensure lock-screen media controls (Notification media style with play/pause/skip buttons) are fully bound via Expo Audio / MediaSession.
4. **Offline Lyrics Synchronization**
   - Synchronized LRC or local lyrics parser for offline songs.
5. **EAS Cloud Build Trigger for New APK**
   - Triggering EAS preview APK build after user approves the code changes and git commit.

---

## 🔒 Approval Gate
- **Approval Status**: Approved by user on October 27, 2026.
- **Git Push Status**: Pushed to remote repository (`origin/main`).
