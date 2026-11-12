import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  dayNumber,
  devotionForDay,
  songOfTheDay,
  formatReminderTime,
  getReminder,
  setReminder,
  refreshReminders,
  REMINDER_DAYS_AHEAD
} from '../src/services/dailyService';
import { DEVOTIONS } from '../src/data/devotions';

const notifications = require('./mocks/notifications');

beforeEach(async () => {
  await AsyncStorage.clear();
  notifications.__reset();
  jest.useRealTimers();
});

test('30 different verses, each with a reference and a thought', () => {
  expect(DEVOTIONS).toHaveLength(30);
  expect(new Set(DEVOTIONS.map((d) => d.id)).size).toBe(30);
  expect(new Set(DEVOTIONS.map((d) => d.reference)).size).toBe(30);
  DEVOTIONS.forEach((d) => {
    expect(d.verse).toMatch(/^“.+”$/);
    expect(d.reference).toMatch(/\((ESV|KJV)\)$/);
    expect(d.reflection.length).toBeGreaterThan(30);
  });
});

test('the verse changes at midnight (phone time) and repeats after 30 days', () => {
  const lateNight = new Date(2026, 10, 12, 23, 59);
  const morning = new Date(2026, 10, 13, 0, 1);
  expect(dayNumber(morning)).toBe(dayNumber(lateNight) + 1);
  expect(devotionForDay(dayNumber(lateNight))).not.toBe(devotionForDay(dayNumber(morning)));
  expect(devotionForDay(100)).toBe(devotionForDay(130));
  expect(devotionForDay(-1)).toBeTruthy();
});

test('song of the day: from your own songs, the same all day, often different the next day', () => {
  const tracks = Array.from({ length: 20 }, (_, i) => ({ id: `local-scan-${i}`, uri: `file:///s${i}.mp3`, sourceType: 'local' }));
  tracks.push({ id: 'yt-x', youtubeId: 'x', sourceType: 'youtube', uri: 'https://youtube.com' });
  const day = dayNumber(new Date(2026, 10, 12));
  const pick = songOfTheDay(tracks, day);
  expect(pick.id).toMatch(/^local-scan-/);
  expect(songOfTheDay([...tracks].reverse(), day)).toBe(pick); // library order doesn't matter
  const week = new Set(Array.from({ length: 7 }, (_, i) => songOfTheDay(tracks, day + i).id));
  expect(week.size).toBeGreaterThan(3);
  expect(songOfTheDay([], day)).toBeNull();
});

test('reminder: two weeks of notifications, each with that day’s verse, at the chosen time', async () => {
  expect(await getReminder()).toEqual({ enabled: false, hour: 7, minute: 0 });
  const result = await setReminder({ enabled: true, hour: 21, minute: 0 });
  expect(result.ok).toBe(true);
  expect(notifications.__scheduled).toHaveLength(REMINDER_DAYS_AHEAD);
  notifications.__scheduled.forEach((n) => {
    const when = new Date(n.trigger.date);
    expect(when.getHours()).toBe(21);
    expect(when.getTime()).toBeGreaterThan(Date.now());
    expect(n.content.title).toBe("Today's devotion");
    expect(n.content.body).toContain(devotionForDay(dayNumber(when)).reference);
  });
  expect(await getReminder()).toEqual({ enabled: true, hour: 21, minute: 0 });

  // reopening the app keeps exactly two weeks ahead (no duplicates)
  await refreshReminders();
  expect(notifications.__scheduled).toHaveLength(REMINDER_DAYS_AHEAD);

  // turning it off removes them all
  await setReminder({ enabled: false, hour: 21, minute: 0 });
  expect(notifications.__scheduled).toHaveLength(0);
});

test('reminder: if notifications are not allowed, nothing is scheduled and it stays off', async () => {
  notifications.__permission = { granted: false, canAskAgain: false };
  const result = await setReminder({ enabled: true, hour: 7, minute: 0 });
  expect(result).toMatchObject({ ok: false, reason: 'denied' });
  expect(notifications.__scheduled).toHaveLength(0);
  expect((await getReminder()).enabled).toBe(false);
});

test('times read naturally', () => {
  expect(formatReminderTime({ hour: 7, minute: 0 })).toBe('7:00 AM');
  expect(formatReminderTime({ hour: 12, minute: 0 })).toBe('12:00 PM');
  expect(formatReminderTime({ hour: 21, minute: 30 })).toBe('9:30 PM');
  expect(formatReminderTime({ hour: 0, minute: 5 })).toBe('12:05 AM');
});
