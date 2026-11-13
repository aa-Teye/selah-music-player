// Lyrics typed by Selah users, shared with everyone who has the same song.
//
//   GET  /api/lyrics?title=Way%20Maker&artist=Sinach&duration=300
//        → { found: true, lyrics: { id, title, artist, duration, text, synced } } or { found: false }
//   POST /api/lyrics   (a logged-in account: Authorization: Bearer <login token>)
//        { title, artist, duration, text, synced } → { id }
//        One entry per account per song: sharing again replaces your earlier version.
import { json, preflight, readJson, endpoint, HttpError } from '../../lib/http.js';
import { requireUser } from '../../lib/auth.js';
import { lyricsForSong, saveLyrics } from '../../lib/db.js';
import { songKey, cleanName } from '../../lib/songKey.js';

const MAX_LYRICS = 20000;
const TIMESTAMP = /\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/g;

function songFromQuery(url) {
  const title = (url.searchParams.get('title') || '').trim();
  const artist = (url.searchParams.get('artist') || '').trim();
  if (!cleanName(title)) throw new HttpError(400, 'Add the song title');
  const duration = Math.round(Number(url.searchParams.get('duration')) || 0);
  return { title, artist, duration };
}

/** Picks the best entry: one whose length matches the song (within 3 s); plain lyrics fit any version */
export function pickLyrics(rows, duration) {
  if (!rows || rows.length === 0) return null;
  if (!(duration > 0)) return rows[0];
  const close = rows.find((r) => !r.duration || Math.abs(r.duration - duration) <= 3);
  return close || rows.find((r) => !r.synced) || null;
}

export const GET = endpoint(async (request) => {
  const { title, artist, duration } = songFromQuery(new URL(request.url));
  const row = pickLyrics(await lyricsForSong(songKey(title, artist)), duration);
  if (!row) return json(200, { found: false });
  return json(200, {
    found: true,
    lyrics: {
      id: row.id,
      title: row.title,
      artist: row.artist,
      duration: row.duration,
      text: row.lyrics,
      synced: row.synced
    }
  });
});

export const POST = endpoint(async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request, 64 * 1024);
  const title = String(body.title || '').trim().slice(0, 200);
  const artist = String(body.artist || '').trim().slice(0, 200);
  const text = String(body.text || '').replace(/\r\n?/g, '\n').trim();
  const synced = Boolean(body.synced);
  const duration = Math.round(Number(body.duration) || 0) || null;

  if (!cleanName(title)) throw new HttpError(400, 'Add the song title');
  if (!cleanName(artist) || /^unknown artist$/i.test(artist)) throw new HttpError(400, 'Add the artist so others can find these lyrics');
  if (text.length < 20) throw new HttpError(400, 'The lyrics are too short');
  if (text.length > MAX_LYRICS || text.split('\n').length > 600) throw new HttpError(413, 'The lyrics are too long');
  if (synced && (text.match(TIMESTAMP) || []).length < 3) throw new HttpError(400, 'Synced lyrics need [mm:ss] times');
  if (duration !== null && (duration < 0 || duration > 36000)) throw new HttpError(400, 'Song length is not right');

  const id = await saveLyrics({ songKey: songKey(title, artist), title, artist, duration, lyrics: text, synced, userId: user.id });
  return json(200, { id });
});

export const OPTIONS = preflight;
