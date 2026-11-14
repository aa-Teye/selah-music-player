// "What's new": shown once after an update (from Google Play or an instant update).
// For every update people should hear about: add a new entry at the TOP with a new id.
import AsyncStoragePackage from '@react-native-async-storage/async-storage';

const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;
const SEEN_KEY = '@selah_whats_new_seen';

export const WHATS_NEW = [
  {
    id: '1.0.0-1',
    title: "What's new in Selah",
    items: [
      { icon: 'library-outline', text: 'Libraries: browse genres and follow gospel artists' },
      { icon: 'bookmark-outline', text: 'Save YouTube videos to your playlists straight from search' },
      { icon: 'book-outline', text: 'A Bible verse for every day of the year' },
      { icon: 'albums-outline', text: 'Keep watching YouTube in a small window while you use other apps' },
      { icon: 'cloud-done-outline', text: 'Your account remembers your artists and YouTube songs too' }
    ]
  }
];

export const LATEST_WHATS_NEW = WHATS_NEW[0];

/**
 * The news to show now, or null. A fresh install shows nothing (it gets the guided tour);
 * after an update the latest news shows once.
 */
export async function whatsNewToShow(firstRun) {
  try {
    const seen = await AsyncStorage.getItem(SEEN_KEY);
    if (seen === LATEST_WHATS_NEW.id) return null;
    await AsyncStorage.setItem(SEEN_KEY, LATEST_WHATS_NEW.id);
    return !seen || firstRun ? null : LATEST_WHATS_NEW;
  } catch {
    return null;
  }
}
