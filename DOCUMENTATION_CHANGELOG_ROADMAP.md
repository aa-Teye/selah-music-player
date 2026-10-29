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

## 🛠️ Section 3: Changes Implemented in Current Turn (Custom Playlist Engine & AI Screen Integration)

### Issues Addressed
1. **Disconnected Playlist Screen**:
   - `PlaylistsScreen.js` previously only showed static presets and favorites. Custom playlists could not be saved to `AsyncStorage`, displayed in the UI, viewed in detail, or played.
2. **Missing "Add to Playlist" Action**:
   - No screen (Home, Local Library, Full Player) had a button or modal allowing users to assign songs into playlists.
3. **Unrendered AI Discovery Screen**:
   - Tapping the "AI Devotion" button in `TopHeader` or `HomeScreen` set `activeTab` to `'ai'`, but `mobile/App.js` lacked an `activeTab === 'ai'` render block, causing a blank screen.

### Changes Applied
1. **[AddToPlaylistModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/AddToPlaylistModal.js)**:
   - Created reusable modal allowing users to check/uncheck any track into custom playlists.
   - Includes an inline "+ Create New Playlist" shortcut.
2. **[PlaylistsScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/PlaylistsScreen.js)**:
   - Built **"My Playlists"** section showing all user-created playlists with track counts, mini play buttons, and delete actions.
   - Built **Playlist Detail View**: Tapping any playlist displays all its songs, track removal buttons, and a **"Play All"** button.
   - Handled empty states and confirmation prompts.
3. **[App.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/App.js)**:
   - Added persistent state for `playlists` linked to `StorageService.getPlaylists()` and `StorageService.savePlaylists()`.
   - Implemented handlers: `handleCreatePlaylist`, `handleDeletePlaylist`, `handleToggleTrackInPlaylist`, and `handlePlayPlaylist`.
   - Wired `{activeTab === 'ai' && <AiDiscoveryScreen ... />}` with a "Back to Home" button.
   - Embedded `<AddToPlaylistModal />` accessible globally.
4. **[HomeScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/HomeScreen.js)** & **[LocalLibraryScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/LocalLibraryScreen.js)** & **[FullPlayerModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/FullPlayerModal.js)**:
   - Added `onOpenAddToPlaylist` trigger on every track row and inside the player utilities bar.
5. **[AiDiscoveryScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/AiDiscoveryScreen.js)**:
   - Added top back button returning to `'home'`.

---

## 🛠️ Section 4: Changes Implemented in Current Turn (Folder Browser, Caller Tune / Ringtone, ID3 Metadata, Lock Screen)

### Features Addressed (Per User Audio Note)
1. **Folder Browser in Local Library**:
   - Added a 3rd sub-tab in `LocalLibraryScreen.js`: `Tracks`, `Folders`, and `Artists`.
   - Grouped device tracks by parent folder (`Music/`, `Download/`, `WhatsApp Audio/`, etc.).
   - Added folder drill-down view with track count, "Play Entire Folder" button, and back button navigation.
2. **Embedded ID3 Tag & Metadata Enrichment (`id3Service.js`)**:
   - Created `mobile/src/services/id3Service.js` to intelligently clean raw filenames (`"01 - Artist - Title.mp3"` -> Clean Title, Artist, and Album).
   - Dynamic cover artwork matching: Maps worship, praise, prayer, lofi, acoustic, and choir tracks to curated visuals.
3. **Caller Tune & Ringtone Setter (`SetRingtoneModal.js`)**:
   - Built a dark-gold modal allowing users to assign any audio file as their Phone Caller Tune / Ringtone, SMS/Notification tone, or Devotion Alarm.
   - Added action buttons in `LocalLibraryScreen.js` and in `FullPlayerModal.js` utility bar.
   - Added `WRITE_SETTINGS` permission in `AndroidManifest.xml`.
4. **System Lock-Screen & Notification Drawer Controls**:
   - Configured `POST_NOTIFICATIONS` permission in `AndroidManifest.xml` and `app.json`.
   - Automated notification permission request in `App.js` on app launch via `requestNotificationPermissionsAsync()`.
   - Integrated `player.setActiveForLockScreen(true, { title, artist, album, artworkUrl })` upon track playback so playback controls and track artwork appear on device lock screens.

---

## 🛠️ Section 5: Changes Implemented in Current Turn (Synced Lyrics, Audio Trimmer, Car Mode, Listening Analytics)

### Features Implemented
1. **Real-Time Synchronized Karaoke Lyrics ([SyncedLyricsView.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/SyncedLyricsView.js))**:
   - Parses timestamped `.lrc` lyrics (`[00:15.30] Lyric text`) with fallback plain-text time distribution.
   - Highlights the active lyric line with an animated gold glow (`#E5A93C`) and larger font.
   - Auto-scrolls vertically with `ScrollView` so current singing line is always centered on screen.
   - Interactive tap-to-seek: Tapping any lyric line instantly seeks the audio player to that timestamp.
   - Built an **"Edit / Add Lyrics"** modal to allow pasting or updating custom lyrics for any track, saved persistently to disk.

2. **Built-in Audio Trimmer & Ringtone Cutter ([AudioTrimmerModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/AudioTrimmerModal.js))**:
   - Visual waveform scrubber with start and end position flags.
   - Fine-tuning steppers (`-5s`, `-1s`, `+1s`, `+5s`) and preset durations (15s, 30s, 45s, 60s).
   - "Preview Clip" button to listen exclusively to the selected slice.
   - One-tap "Set as Ringtone" button linked into the Ringtone and Caller Tune engine.

3. **Recently Played Rail & Devotion Listening Analytics ([ListeningStatsModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/ListeningStatsModal.js) & [HomeScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/HomeScreen.js))**:
   - Added horizontal **"Recently Played"** rail on the Home Screen showing recently listened songs with album art.
   - Built a **"My Worship Journey"** modal tracking:
     - Total time spent in worship/praise (minutes/hours).
     - Total songs played.
     - Active devotion streak count.
     - Favorite songs tally.

4. **Fullscreen Car & Stage Mode ([CarModeModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/CarModeModal.js))**:
   - Ultra-large, high-contrast, distraction-free player interface with 120px play/pause and 80px skip buttons.
   - Designed for safe in-car use and church stage/podium playback monitoring.
   - Accessible via Car icon in `FullPlayerModal.js`.

---

---

## 🛠️ Section 6: Comprehensive Quality Audit & Bugfixes (Current Turn)

### Issues Identified & Resolved
1. **Audio Engine Background Collision with YouTube Playback ([App.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/App.js))**:
   - *Issue*: Switching to a YouTube video or non-audio track bypassed the audio cleanup block because `audioSource` was falsy, leaving any active local MP3 or devotion audio playing simultaneously under the YouTube video.
   - *Fix*: Unconditionally halted and removed `soundRef.current` and status listeners prior to source branching so YouTube and local audio never conflict.
2. **Horizontal Overflow on Player Utilities Bar ([FullPlayerModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/FullPlayerModal.js))**:
   - *Issue*: 5 utility pills (Speed, Sleep Timer, + Playlist, Ringtone, Cutter) were rendered in a static row, causing them to clip and squish on narrower phone screens.
   - *Fix*: Upgraded to a horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}` and smooth scrolling.
3. **Timer Leak in Ringtone Cutter ([AudioTrimmerModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/AudioTrimmerModal.js))**:
   - *Issue*: Audio preview timeout continued firing after modal dismissal or toggle.
   - *Fix*: Attached `previewTimeoutRef` with automatic cancellation on unmount and re-toggle.
4. **Defensive LRC Lyrics Parsing ([SyncedLyricsView.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/SyncedLyricsView.js))**:
   - *Issue*: Non-string `lyrics` prop could trigger runtime `split` exceptions.
   - *Fix*: Added safe string assertion and whitespace validation.
5. **Up Next Playback Queue ([PlaybackQueueView.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/PlaybackQueueView.js))**:
   - Created mobile counterpart for the desktop `QueueDrawer.jsx`.
   - Added 3rd tab (`Queue`) in [FullPlayerModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/FullPlayerModal.js) header (`Player | Lyrics | Queue`).
   - Integrated track list, playing indicator, instant tap-to-play, track removal, and clear queue with confirmation.
6. **Storage Key Consistency & App Config Cleanup**:
   - Fixed `RECENT_TRACKS` key aliasing in [storageService.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/services/storageService.js).
   - Cleaned redundant web configuration and added explicit `"platforms": ["android", "ios"]` in [app.json](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/app.json).
   - Guarded featured track click in [HomeScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/HomeScreen.js).

---

## 🛠️ Section 7: Devotional Journaling & Ambient Sound Features (Current Turn)

### Features Implemented
1. **Scripture & Prayer Bookmarks ([PrayerBookmarksModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/PrayerBookmarksModal.js))**:
   - Pinned audio timestamps with scripture references (e.g. `Psalm 23:4`, `Phil 4:7`) and personal devotional reflections.
   - Filter by current playing song or browse entire prayer journal.
   - One-tap audio seeking to jump back to any bookmarked moment.
   - Persistent storage via `@selah_bookmarks`.
2. **Bedtime Ambient Soundscapes ([AmbientSoundscapesModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/AmbientSoundscapesModal.js))**:
   - 4 peaceful ambient layers: Gentle Rainfall, Holy Cathedral Pad, River of Life, and Quiet Night Wind.
   - Independent blend volume slider (25%, 50%, 75%, 100%).
   - Integrated with the Bedtime Sleep Timer so both music and ambience fade out together.
3. **Seamless Audio Crossfade**:
   - Added crossfade selector in [EqualizerScreen.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/screens/EqualizerScreen.js) (Off, 3s, 6s, 9s, 12s) to eliminate silence between songs.
4. **Dynamic Ambient Glow**:
   - Added soft breathing halo behind the spinning vinyl disc in [FullPlayerModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/FullPlayerModal.js).
5. **In-App ID3 Tag & Metadata Editor ([EditTagsModal.js](file:///Users/Robert/Documents/MYCODINGWORKS/MUZIO%20PLAYER%20/mobile/src/components/EditTagsModal.js))**:
   - Edit Title, Artist, Album, and Genre on any local audio file directly in the app.
   - Smart artwork matching button to refresh cover art.

---

## ⏳ Section 8: Cloud APK & Release Status

1. **Android Preview APK (Completed Build)**:
   - Build ID: `0cf784ff-a5c9-4619-a01b-2a8bd8a531bc`
   - Download Link: [EAS Preview APK](https://expo.dev/artifacts/eas/lCvT7rH6mp2bTwb5S1-sN77wlyX6BKIiJfMHLF6pgvg.apk)
2. **Store Production Packaging (Play Store / App Store)**:
   - Android Bundle: `npx eas-cli build -p android --profile production`
   - iOS Archive: `npx eas-cli build -p ios --profile production`

---

## 🔒 Approval Gate
- **Status**: All 5 new features fully implemented, tested, and validated with zero syntax errors.
- **Git Push Status**: Ready to commit and push to remote.




