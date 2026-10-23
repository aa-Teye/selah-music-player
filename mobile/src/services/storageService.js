import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  FAVORITES: '@selah_favorites',
  LOCAL_TRACKS: '@selah_local_tracks',
  PLAYLISTS: '@selah_playlists',
  STREAK: '@selah_streak',
  RECENTLY_PLAYED: '@selah_recent_tracks',
  SETTINGS: '@selah_settings'
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

  // Daily Streak
  async getStreak() {
    try {
      const data = await AsyncStorage.getItem(KEYS.STREAK);
      if (!data) return { streakDays: 14, lastActiveDate: new Date().toDateString() };
      return JSON.parse(data);
    } catch (e) {
      return { streakDays: 14, lastActiveDate: new Date().toDateString() };
    }
  },

  async recordDailyStreak() {
    try {
      const today = new Date().toDateString();
      const current = await this.getStreak();
      if (current.lastActiveDate !== today) {
        const updated = {
          streakDays: (current.streakDays || 14) + 1,
          lastActiveDate: today
        };
        await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(updated));
        return updated;
      }
      return current;
    } catch (e) {
      return { streakDays: 14, lastActiveDate: new Date().toDateString() };
    }
  }
};
