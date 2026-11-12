import AsyncStoragePackage from '@react-native-async-storage/async-storage';
const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;
import { Directory, File, Paths } from 'expo-file-system';
import { Id3Service } from './id3Service';
import { coverUri, savedCoverNames } from './coverStore';

// The music library can hold thousands of songs, so it is kept in a file
// (the phone's key-value storage only allows a few MB).
function libraryFile() {
  const dir = new Directory(Paths.document, '.selah');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return new File(dir, 'library.json');
}

const PLACEHOLDER_LYRICS = /^\s*\[(device audio|local audio track)/i;

function compactTrack(t) {
  if (!t) return t;
  const out = { ...t };
  if (typeof out.lyrics === 'string' && PLACEHOLDER_LYRICS.test(out.lyrics)) delete out.lyrics;
  if (out.coverFile) delete out.coverUrl; // the song's own cover: its address is worked out when loading
  else if (out.coverUrl && out.coverUrl === Id3Service.generateCuratedArtwork(out.title, out.artist)) delete out.coverUrl;
  return out;
}

function hydrateTrack(t, covers) {
  if (!t) return t;
  if (t.coverFile) {
    if (covers && covers.has(t.coverFile)) return { ...t, coverUrl: coverUri(t.coverFile) };
    // The phone cleared this cover: show the usual picture and read the song again on the next scan
    const { coverFile, tagsVersion, ...rest } = t;
    return { ...rest, coverUrl: Id3Service.generateCuratedArtwork(t.title, t.artist) };
  }
  if (t.coverUrl) return t;
  return { ...t, coverUrl: Id3Service.generateCuratedArtwork(t.title, t.artist) };
}

const hydrateAll = (list) => {
  const covers = list.some((t) => t && t.coverFile) ? savedCoverNames() : null;
  return list.map((t) => hydrateTrack(t, covers));
};

const KEYS = {
  FAVORITES: '@selah_favorites',
  LOCAL_TRACKS: '@selah_local_tracks',
  PLAYLISTS: '@selah_playlists',
  STREAK: '@selah_streak',
  RECENTLY_PLAYED: '@selah_recent_tracks',
  RECENT_TRACKS: '@selah_recent_tracks',
  BOOKMARKS: '@selah_bookmarks',
  SETTINGS: '@selah_settings',
  FAV_ARTISTS: '@selah_fav_artists',
  LAST_PLAYED: '@selah_last_played',
  HAS_ONBOARDED: '@selah_has_onboarded'
};

export const StorageService = {
  // Favorites
  async getFavorites() {
    try {
      const data = await AsyncStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.log('Error reading favorites:', e);
      return [];
    }
  },

  async saveFavorites(favorites) {
    try {
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.log('Error saving favorites:', e);
    }
  },

  // Local Tracks imported/scanned (saved in a file so large libraries fit)
  async getLocalTracks() {
    try {
      const file = libraryFile();
      if (file.exists) {
        const list = JSON.parse(await file.text());
        if (Array.isArray(list)) return hydrateAll(list);
      }
    } catch (e) {
      console.log('Error reading library file:', e);
    }
    // Older versions kept the library in key-value storage
    try {
      const data = await AsyncStorage.getItem(KEYS.LOCAL_TRACKS);
      const list = data ? JSON.parse(data) : [];
      return Array.isArray(list) ? hydrateAll(list) : [];
    } catch (e) {
      console.log('Error reading local tracks:', e);
      return [];
    }
  },

  async saveLocalTracks(tracks) {
    const json = JSON.stringify((tracks || []).map(compactTrack));
    try {
      const file = libraryFile();
      if (!file.exists) file.create();
      await file.write(json);
      AsyncStorage.removeItem(KEYS.LOCAL_TRACKS).catch(() => {});
      return;
    } catch (e) {
      console.log('Error saving library file:', e);
    }
    try {
      await AsyncStorage.setItem(KEYS.LOCAL_TRACKS, json);
    } catch (e) {
      console.log('Error saving local tracks:', e);
    }
  },

  // Custom User Playlists
  async getPlaylists() {
    try {
      const data = await AsyncStorage.getItem(KEYS.PLAYLISTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.log('Error reading playlists:', e);
      return [];
    }
  },

  async savePlaylists(playlists) {
    try {
      await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.log('Error saving playlists:', e);
    }
  },

  // Daily Streak (real: counts consecutive days the app was opened)
  async getStreak() {
    try {
      const data = await AsyncStorage.getItem(KEYS.STREAK);
      if (!data) return { streakDays: 0, lastActiveDate: null };
      return JSON.parse(data);
    } catch (e) {
      return { streakDays: 0, lastActiveDate: null };
    }
  },

  async recordDailyStreak() {
    try {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      const current = await this.getStreak();
      if (current.lastActiveDate === today) {
        return { ...current, streakDays: Math.max(1, current.streakDays || 1) };
      }
      const updated = {
        streakDays: current.lastActiveDate === yesterday ? (current.streakDays || 0) + 1 : 1,
        lastActiveDate: today
      };
      await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return { streakDays: 1, lastActiveDate: new Date().toDateString() };
    }
  },

  // Recently Played Tracks
  async getRecentlyPlayed() {
    try {
      const data = await AsyncStorage.getItem(KEYS.RECENT_TRACKS || '@selah_recent_tracks');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addRecentlyPlayed(track) {
    if (!track) return;
    try {
      const current = await this.getRecentlyPlayed();
      const filtered = current.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 20); // Keep last 20
      await AsyncStorage.setItem(KEYS.RECENT_TRACKS || '@selah_recent_tracks', JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.log('Error saving recent track:', e);
    }
  },

  async saveRecentlyPlayed(list) {
    try {
      await AsyncStorage.setItem(KEYS.RECENT_TRACKS, JSON.stringify((list || []).slice(0, 50)));
    } catch (e) {
      console.log('Error saving recent tracks:', e);
    }
  },

  // Custom User Lyrics per track
  async getCustomLyrics(trackId) {
    if (!trackId) return null;
    try {
      const raw = await AsyncStorage.getItem(`@selah_lyrics_${trackId}`);
      return raw || null;
    } catch (e) {
      return null;
    }
  },

  async saveCustomLyrics(trackId, lyricsText) {
    if (!trackId) return;
    try {
      await AsyncStorage.setItem(`@selah_lyrics_${trackId}`, lyricsText);
    } catch (e) {
      console.log('Error saving lyrics:', e);
    }
  },

  // Simple on/off flags (e.g. "the first detailed scan has been done")
  async getFlag(name) {
    try {
      return (await AsyncStorage.getItem(`@selah_flag_${name}`)) === 'true';
    } catch (e) {
      return false;
    }
  },

  async setFlag(name, value = true) {
    try {
      await AsyncStorage.setItem(`@selah_flag_${name}`, value ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving flag:', e);
    }
  },

  // Lyrics lookup cache (so we only ask the lyrics service once per song)
  async getLyricsCache(trackId) {
    if (!trackId) return null;
    try {
      const raw = await AsyncStorage.getItem(`@selah_lyrics_cache_${trackId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async saveLyricsCache(trackId, data) {
    if (!trackId) return;
    try {
      await AsyncStorage.setItem(`@selah_lyrics_cache_${trackId}`, JSON.stringify(data));
    } catch (e) {
      console.log('Error saving lyrics cache:', e);
    }
  },

  // Per-song lyrics timing adjustment (seconds)
  async getLyricsOffset(trackId) {
    if (!trackId) return 0;
    try {
      const raw = await AsyncStorage.getItem(`@selah_lyrics_offset_${trackId}`);
      return raw ? Number(raw) || 0 : 0;
    } catch (e) {
      return 0;
    }
  },

  async saveLyricsOffset(trackId, seconds) {
    if (!trackId) return;
    try {
      await AsyncStorage.setItem(`@selah_lyrics_offset_${trackId}`, String(seconds));
    } catch (e) {
      console.log('Error saving lyrics offset:', e);
    }
  },

  // Devotion Listening Statistics
  async getListeningStats() {
    try {
      const data = await AsyncStorage.getItem('@selah_listening_stats');
      return data ? JSON.parse(data) : { totalSeconds: 0, tracksPlayedCount: 0 };
    } catch (e) {
      return { totalSeconds: 0, tracksPlayedCount: 0 };
    }
  },

  // Count one more track started (no fake seconds)
  async recordTrackPlayed() {
    try {
      const current = await this.getListeningStats();
      const updated = { ...current, tracksPlayedCount: (current.tracksPlayedCount || 0) + 1 };
      await AsyncStorage.setItem('@selah_listening_stats', JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.log('Error saving stats:', e);
    }
  },

  // Add real listened seconds
  async addListeningSeconds(seconds) {
    if (!seconds || seconds <= 0) return;
    try {
      const current = await this.getListeningStats();
      const updated = { ...current, totalSeconds: (current.totalSeconds || 0) + Math.round(seconds) };
      await AsyncStorage.setItem('@selah_listening_stats', JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.log('Error saving stats:', e);
    }
  },

  // Last played track + position (for resume on launch)
  async getLastPlayed() {
    try {
      const data = await AsyncStorage.getItem(KEYS.LAST_PLAYED);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async saveLastPlayed(track, position) {
    const trackId = typeof track === 'string' ? track : track && track.id;
    if (!trackId) return;
    let stored = null;
    if (track && typeof track === 'object') {
      const { embeddedLyrics, lyrics, ...rest } = track; // keep it small
      stored = rest;
    }
    try {
      await AsyncStorage.setItem(
        KEYS.LAST_PLAYED,
        JSON.stringify({ trackId, position: Math.floor(position || 0), track: stored, savedAt: Date.now() })
      );
    } catch (e) {
      console.log('Error saving last played:', e);
    }
  },

  // Long songs (sermons, worship sets) remember their own spot
  async getSongPositions() {
    try {
      const data = await AsyncStorage.getItem('@selah_song_positions');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  async saveSongPositions(positions) {
    try {
      const entries = Object.entries(positions || {})
        .sort((x, y) => (y[1].at || 0) - (x[1].at || 0))
        .slice(0, 200);
      await AsyncStorage.setItem('@selah_song_positions', JSON.stringify(Object.fromEntries(entries)));
    } catch (e) {
      console.log('Error saving song positions:', e);
    }
  },

  async recordListeningSession(seconds = 30) {
    try {
      const current = await this.getListeningStats();
      const updated = {
        totalSeconds: (current.totalSeconds || 0) + seconds,
        tracksPlayedCount: (current.tracksPlayedCount || 0) + 1
      };
      await AsyncStorage.setItem('@selah_listening_stats', JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.log('Error saving stats:', e);
    }
  },

  // Scripture & Prayer Bookmarks
  async getBookmarks() {
    try {
      const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.log('Error loading bookmarks:', e);
      return [];
    }
  },

  async saveBookmarks(bookmarks) {
    try {
      await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.log('Error saving bookmarks:', e);
    }
  },

  async addBookmark(entry) {
    try {
      const current = await this.getBookmarks();
      const newBookmark = {
        id: `bm-${Date.now()}`,
        trackId: entry.trackId,
        trackTitle: entry.trackTitle || 'Worship Track',
        trackArtist: entry.trackArtist || 'Selah Music',
        timestamp: Math.round(entry.timestamp || 0),
        note: entry.note || '',
        scripture: entry.scripture || '',
        createdAt: new Date().toISOString()
      };
      const updated = [newBookmark, ...current];
      await this.saveBookmarks(updated);
      return updated;
    } catch (e) {
      console.log('Error adding bookmark:', e);
    }
  },

  async deleteBookmark(bookmarkId) {
    try {
      const current = await this.getBookmarks();
      const updated = current.filter((b) => b.id !== bookmarkId);
      await this.saveBookmarks(updated);
      return updated;
    } catch (e) {
      console.log('Error deleting bookmark:', e);
    }
  },

  // General App Settings (Crossfade, Ambient Sound, etc.)
  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : { crossfadeSeconds: 0, ambientSoundType: null, ambientVolume: 0.5 };
    } catch (e) {
      return { crossfadeSeconds: 0, ambientSoundType: null, ambientVolume: 0.5 };
    }
  },

  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.log('Error saving settings:', e);
    }
  },

  // Onboarding & Favorite Artists
  async getFavoriteArtists() {
    try {
      const data = await AsyncStorage.getItem(KEYS.FAV_ARTISTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.log('Error getting favorite artists:', e);
      return [];
    }
  },

  async saveFavoriteArtists(artists) {
    try {
      await AsyncStorage.setItem(KEYS.FAV_ARTISTS, JSON.stringify(artists));
    } catch (e) {
      console.log('Error saving favorite artists:', e);
    }
  },

  async getHasOnboarded() {
    try {
      const data = await AsyncStorage.getItem(KEYS.HAS_ONBOARDED);
      return data === 'true';
    } catch (e) {
      return false;
    }
  },

  async setHasOnboarded(status = true) {
    try {
      await AsyncStorage.setItem(KEYS.HAS_ONBOARDED, status ? 'true' : 'false');
    } catch (e) {
      console.log('Error setting onboarded state:', e);
    }
  }
};
