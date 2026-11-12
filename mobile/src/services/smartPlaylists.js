// ═════════════════════════════════════════════════════════════════════════
//  SELAH — SMART PLAYLISTS
//  Playlists that fill themselves from how you listen.
// ═════════════════════════════════════════════════════════════════════════

export const SMART_LIMIT = 100;
export const LONG_SECONDS = 600; // 10 minutes and more: sermons, worship sets

const isOwnSong = (t) => t && t.sourceType !== 'youtube' && !t.youtubeId;

/** Times a song was really listened to (30 seconds or more) */
export const playsOf = (playCounts, id) => (playCounts && playCounts[id] && playCounts[id].n) || 0;

/**
 * Builds the smart playlists from the library and the play counts.
 * Each one: { id, name, icon, description, empty, smart: true, tracks }
 */
export function buildSmartPlaylists(tracks = [], playCounts = {}) {
  const all = (tracks || []).filter(Boolean);
  const own = all.filter(isOwnSong);
  const lastOf = (t) => (playCounts[t.id] && playCounts[t.id].last) || 0;

  const mostPlayed = all
    .filter((t) => playsOf(playCounts, t.id) > 0)
    .sort((a, b) => playsOf(playCounts, b.id) - playsOf(playCounts, a.id) || lastOf(b) - lastOf(a))
    .slice(0, SMART_LIMIT);

  const recentlyAdded = own
    .filter((t) => t.addedAt)
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .slice(0, SMART_LIMIT);

  const neverPlayed = own.filter((t) => playsOf(playCounts, t.id) === 0).slice(0, SMART_LIMIT);

  const long = own.filter((t) => t.duration >= LONG_SECONDS).slice(0, SMART_LIMIT);

  return [
    {
      id: 'smart-most',
      name: 'Most played',
      icon: 'trending-up',
      description: 'The songs you play the most',
      empty: 'Songs you listen to often will show up here.',
      tracks: mostPlayed
    },
    {
      id: 'smart-recent',
      name: 'Recently added',
      icon: 'time-outline',
      description: 'Newest songs on your phone',
      empty: 'New songs you add will show up here.',
      tracks: recentlyAdded
    },
    {
      id: 'smart-never',
      name: 'Never played',
      icon: 'sparkles-outline',
      description: "Songs you haven't listened to yet",
      empty: "You've listened to every song. Well done!",
      tracks: neverPlayed
    },
    {
      id: 'smart-long',
      name: 'Sermons & long worship',
      icon: 'mic-outline',
      description: 'Messages and songs over 10 minutes',
      empty: 'Sermons and songs longer than 10 minutes will show up here.',
      tracks: long
    }
  ].map((list) => ({ ...list, smart: true }));
}
