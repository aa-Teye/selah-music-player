import AsyncStoragePackage from '@react-native-async-storage/async-storage';
const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;

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
      return data ? JSON.parse(data) : ['yt-1', 'yt-2'];
    } catch (e) {
      console.log('Error reading favorites:', e);
      return ['yt-1', 'yt-2'];
    }
  },

  async saveFavorites(favorites) {
    try {
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.log('Error saving favorites:', e);
    }
  },

  // Local Tracks imported/scanned
  async getLocalTracks() {
    try {
      const data = await AsyncStorage.getItem(KEYS.LOCAL_TRACKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.log('Error reading local tracks:', e);
      return [];
    }
  },

  async saveLocalTracks(tracks) {
    try {
      await AsyncStorage.setItem(KEYS.LOCAL_TRACKS, JSON.stringify(tracks));
    } catch (e) {
      console.log('Error saving local tracks:', e);
    }
  },

  // Custom User Playlists
  async getPlaylists() {
    try {
      const data = await AsyncStorage.getItem(KEYS.PLAYLISTS);
      return data ? JSON.parse(data) : [
        { id: 'pl-1', name: 'Morning Devotions', trackIds: ['yt-1', 'yt-4'] },
        { id: 'pl-2', name: 'Peaceful Worship', trackIds: ['yt-2', 'yt-3'] }
      ];
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

  async saveLastPlayed(trackId, position) {
    if (!trackId) return;
    try {
      await AsyncStorage.setItem(KEYS.LAST_PLAYED, JSON.stringify({ trackId, position: Math.floor(position || 0) }));
    } catch (e) {
      console.log('Error saving last played:', e);
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
