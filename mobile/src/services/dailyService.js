// ═════════════════════════════════════════════════════════════════════════
//  SELAH — TODAY
//  The verse of the day, a song of the day from your own music, and an
//  optional daily reminder (a phone notification at the time you choose).
// ═════════════════════════════════════════════════════════════════════════
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStoragePackage from '@react-native-async-storage/async-storage';
import { DEVOTIONS } from '../data/devotions';

const AsyncStorage = AsyncStoragePackage?.default || AsyncStoragePackage;
const REMINDER_KEY = '@selah_daily_reminder';
const CHANNEL_ID = 'daily-devotion';
const ID_PREFIX = 'selah-devotion-';
export const REMINDER_DAYS_AHEAD = 14; // refreshed every time Selah opens
export const REMINDER_TIMES = [
  { hour: 6, minute: 0 },
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 21, minute: 0 }
];

/** Days since 1 Jan 1970 in the phone's own time zone (changes at local midnight) */
export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function devotionForDay(day) {
  const n = DEVOTIONS.length;
  return DEVOTIONS[((day % n) + n) % n];
}

/** A song from your own music for the day: the same all day, different each day */
export function songOfTheDay(tracks, day) {
  const own = (tracks || [])
    .filter((t) => t && t.uri && t.sourceType !== 'youtube' && !t.youtubeId)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (own.length === 0) return null;
  const index = Math.floor(Math.abs(Math.sin(day + 1) * 10000)) % own.length;
  return own[index];
}

export function formatReminderTime({ hour, minute }) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

// ── Reminder ────────────────────────────────────────────────────────────────
export async function getReminder() {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && typeof saved.hour === 'number') return saved;
  } catch {}
  return { enabled: false, hour: 7, minute: 0 };
}

async function cancelOurReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      (scheduled || [])
        .filter((n) => String(n.identifier || '').startsWith(ID_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {}
}

/** Schedules one notification per day (each with that day's verse) for the next two weeks */
async function scheduleReminders({ hour, minute }, now = new Date()) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily devotion',
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }
  let count = 0;
  for (let i = 0; count < REMINDER_DAYS_AHEAD && i <= REMINDER_DAYS_AHEAD; i++) {
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, minute, 0, 0);
    if (when.getTime() <= now.getTime() + 60000) continue; // today's time already passed
    const devotion = devotionForDay(dayNumber(when));
    await Notifications.scheduleNotificationAsync({
      identifier: `${ID_PREFIX}${dayNumber(when)}`,
      content: {
        title: "Today's devotion",
        body: `${devotion.verse.replace(/[“”]/g, '')} (${devotion.reference})`,
        data: { screen: 'home' }
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID }
    });
    count += 1;
  }
  return count;
}

/**
 * Turns the daily reminder on (at hour:minute) or off.
 * Returns { ok, reminder, reason? } — reason 'denied' if notifications are not allowed.
 */
export async function setReminder({ enabled, hour, minute }) {
  const reminder = { enabled: Boolean(enabled), hour, minute };
  await cancelOurReminders();
  if (reminder.enabled) {
    try {
      let perm = await Notifications.getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain !== false) perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) return { ok: false, reason: 'denied', reminder: { ...reminder, enabled: false } };
      await scheduleReminders(reminder);
    } catch (err) {
      console.log('Reminder notice:', err);
      return { ok: false, reason: 'error', reminder: { ...reminder, enabled: false } };
    }
  }
  try {
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(reminder));
  } catch {}
  return { ok: true, reminder };
}

/** Called when Selah opens: keeps two weeks of reminders ahead (with the right verses) */
export async function refreshReminders() {
  const reminder = await getReminder();
  if (!reminder.enabled) return reminder;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return reminder;
    await cancelOurReminders();
    await scheduleReminders(reminder);
  } catch {}
  return reminder;
}

/** Show reminders even while Selah is open */
export function setupNotificationDisplay() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false
      })
    });
  } catch {}
}
