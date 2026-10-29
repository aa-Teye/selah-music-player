// Mock window.localStorage for AsyncStorage in Node environment
const store = new Map();
global.window = {
  localStorage: {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  }
};

const storageMap = new Map();
const mockAsyncStorage = {
  getItem: async (key) => storageMap.get(key) || null,
  setItem: async (key, val) => { storageMap.set(key, val); return null; },
  removeItem: async (key) => { storageMap.delete(key); return null; },
  clear: async () => { storageMap.clear(); return null; }
};

// Handle audio assets in require
global.require = require;
require.extensions['.m4a'] = () => 1;
require.extensions['.mp3'] = () => 1;
require.extensions['.png'] = () => 1;
require.extensions['.jpg'] = () => 1;

// Override require for @react-native-async-storage/async-storage and assets
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id.endsWith('.m4a') || id.endsWith('.mp3') || id.endsWith('.png') || id.endsWith('.jpg')) {
    return 1;
  }
  if (id === '@react-native-async-storage/async-storage') {
    mockAsyncStorage.default = mockAsyncStorage;
    return mockAsyncStorage;
  }
  if (id === 'react-native') {
    return {
      Platform: { OS: 'android', select: (obj) => obj.android },
      Dimensions: { get: () => ({ width: 390, height: 844 }) },
      StyleSheet: { create: (s) => s },
      Animated: {
        Value: function(v) { this.v = v; this.interpolate = () => ''; },
        timing: () => ({ start: (cb) => cb && cb() }),
        loop: () => ({ start: () => {}, stop: () => {} })
      },
      Easing: { linear: () => {} },
      Alert: { alert: () => {} },
      Linking: { openSettings: async () => {} }
    };
  }
  if (id.startsWith('@expo/vector-icons')) {
    return { Ionicons: () => null, MaterialCommunityIcons: () => null };
  }
  return originalRequire.apply(this, arguments);
};

async function runTests() {
  console.log('========================================');
  console.log('🧪 SELAH MUSIC PLAYER - FEATURE TEST SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: StorageService
  console.log('--- 1. Testing StorageService Methods ---');
  const { StorageService } = require('./src/services/storageService');

  // Favorites
  await StorageService.saveFavorites(['track-1', 'track-2', 'track-3']);
  const favs = await StorageService.getFavorites();
  assert(favs.length === 3 && favs.includes('track-3'), 'StorageService: Favorites save & retrieve');

  // Playlists
  const testPls = [{ id: 'pl-test', name: 'Sunday Praise', trackIds: ['track-1'] }];
  await StorageService.savePlaylists(testPls);
  const pls = await StorageService.getPlaylists();
  assert(pls.length === 1 && pls[0].name === 'Sunday Praise', 'StorageService: Playlists save & retrieve');

  // Bookmarks
  await StorageService.addBookmark({
    trackId: 'track-1',
    trackTitle: 'Oceans',
    trackArtist: 'Hillsong',
    timestamp: 125,
    note: 'Deep moment of worship',
    scripture: 'Psalm 23:4'
  });
  let bms = await StorageService.getBookmarks();
  assert(bms.length === 1 && bms[0].scripture === 'Psalm 23:4', 'StorageService: Add Bookmark with Scripture');
  assert(bms[0].timestamp === 125, 'StorageService: Bookmark Timestamp accurate');

  // Delete Bookmark
  const bmId = bms[0].id;
  await StorageService.deleteBookmark(bmId);
  bms = await StorageService.getBookmarks();
  assert(bms.length === 0, 'StorageService: Delete Bookmark');

  // Settings (Crossfade, Ambient Sound)
  await StorageService.saveSettings({ crossfadeSeconds: 6, ambientSoundType: 'rain', ambientVolume: 0.75 });
  const settings = await StorageService.getSettings();
  assert(settings.crossfadeSeconds === 6 && settings.ambientSoundType === 'rain', 'StorageService: Crossfade & Ambient Settings save & retrieve');

  // Recently Played
  await StorageService.addRecentlyPlayed({ id: 't-recent', title: 'Goodness of God', artist: 'CeCe Winans' });
  const recent = await StorageService.getRecentlyPlayed();
  assert(recent.length === 1 && recent[0].id === 't-recent', 'StorageService: Recently Played save & retrieve');

  // Listening Stats
  await StorageService.recordListeningSession(45);
  const stats = await StorageService.getListeningStats();
  assert(stats.totalSeconds === 45 && stats.tracksPlayedCount === 1, 'StorageService: Listening Stats increment');

  // Custom Lyrics
  await StorageService.saveCustomLyrics('track-1', '[00:10.00] Custom Saved Lyric Line');
  const lyrics = await StorageService.getCustomLyrics('track-1');
  assert(lyrics.includes('Custom Saved Lyric Line'), 'StorageService: Custom Lyrics save & retrieve');

  // TEST 2: Id3Service
  console.log('\n--- 2. Testing Id3Service Tag Cleaning & Metadata ---');
  const { Id3Service } = require('./src/services/id3Service');

  const meta1 = Id3Service.parseFilenameMetadata('01 - Brandon Lake - Gratitude (Live).mp3');
  assert(meta1.title.includes('Gratitude'), 'Id3Service: Parse title from raw filename');
  assert(meta1.artist.includes('Brandon Lake'), 'Id3Service: Parse artist from raw filename');

  const artWorship = Id3Service.generateCuratedArtwork('Gratitude Worship', 'Brandon Lake');
  assert(typeof artWorship === 'string' && artWorship.startsWith('http'), 'Id3Service: Curated artwork generation for worship');

  const artAcoustic = Id3Service.generateCuratedArtwork('Acoustic Guitar Praise', 'Guitar');
  assert(typeof artAcoustic === 'string' && artAcoustic.startsWith('http'), 'Id3Service: Curated artwork generation for acoustic');

  const mockAsset = {
    id: 'media-101',
    filename: 'CeCe Winans - Believe For It.mp3',
    uri: 'file:///storage/emulated/0/Music/CeCe Winans - Believe For It.mp3',
    duration: 240
  };
  const enriched = Id3Service.enrichAsset(mockAsset);
  assert(enriched.id === 'local-scan-media-101' && enriched.title.includes('Believe For It'), 'Id3Service: Enrich raw MediaLibrary asset');
  assert(enriched.category === 'local' && enriched.folder === 'Music', 'Id3Service: Detect category and parent folder');

  // TEST 3: Mock Data Verification
  console.log('\n--- 3. Testing Mock Data Integrity ---');
  const { DAILY_DEVOTION, INITIAL_TRACKS, MOOD_TAGS } = require('./src/data/mockData');
  assert(DAILY_DEVOTION && DAILY_DEVOTION.verse && DAILY_DEVOTION.reference, 'MockData: Daily Devotion has verse and reference');
  assert(Array.isArray(INITIAL_TRACKS) && INITIAL_TRACKS.length > 0, 'MockData: Initial tracks populated');
  assert(Array.isArray(MOOD_TAGS) && MOOD_TAGS.length > 0, 'MockData: Mood tags populated');

  // TEST 4: Component Verification & Metro Bundling
  console.log('\n--- 4. Testing Component Definitions & Bundler Compilation ---');
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');

  const components = [
    './src/components/TopHeader.js',
    './src/components/BottomTabs.js',
    './src/components/MiniPlayerBar.js',
    './src/components/FullPlayerModal.js',
    './src/components/AddToPlaylistModal.js',
    './src/components/SetRingtoneModal.js',
    './src/components/AudioTrimmerModal.js',
    './src/components/CarModeModal.js',
    './src/components/ListeningStatsModal.js',
    './src/components/SyncedLyricsView.js',
    './src/components/PlaybackQueueView.js',
    './src/components/PrayerBookmarksModal.js',
    './src/components/AmbientSoundscapesModal.js',
    './src/components/EditTagsModal.js',
    './src/screens/HomeScreen.js',
    './src/screens/LocalLibraryScreen.js',
    './src/screens/YouTubeWatchScreen.js',
    './src/screens/PlaylistsScreen.js',
    './src/screens/EqualizerScreen.js',
    './src/screens/AiDiscoveryScreen.js'
  ];

  for (const compPath of components) {
    const fullPath = path.join(__dirname, compPath);
    const exists = fs.existsSync(fullPath);
    const content = exists ? fs.readFileSync(fullPath, 'utf8') : '';
    const hasDefaultExport = content.includes('export default') || content.includes('module.exports');
    assert(exists && content.length > 100 && hasDefaultExport, `Component validated: ${path.basename(compPath)}`);
  }

  // Metro Production Compilation Check
  console.log('\n--- 5. Testing Android Metro Production Compilation ---');
  try {
    const bundleOut = execSync('npx expo export:embed --platform android --dev false --entry-file index.js --bundle-output /tmp/check-bundle.js', {
      cwd: __dirname,
      encoding: 'utf8'
    });
    fs.unlinkSync('/tmp/check-bundle.js');
    assert(bundleOut.includes('Done writing bundle output'), 'Metro: Full Android production bundle passes cleanly');
  } catch (err) {
    assert(false, `Metro: Bundle failed - ${err.message}`);
  }

  console.log('\n========================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
