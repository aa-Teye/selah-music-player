// ═════════════════════════════════════════════════════════════════════════
//  SELAH — LYRICS SERVICE
//  Finds time-synced lyrics through LRCLIB (https://lrclib.net), a free
//  community lyrics database that needs no API key.
// ═════════════════════════════════════════════════════════════════════════

const BASE_URL = 'https://lrclib.net/api';
const USER_AGENT = 'SelahMusicPlayer/1.0 (https://github.com/aa-Teye/selah-music-player)';

// Text we put in tracks ourselves when we have no real lyrics
const PLACEHOLDER_RE = /^\s*\[(device audio|local audio track|streaming from youtube|peaceful instrumental)/i;

export function isPlaceholderLyrics(text) {
  return !text || typeof text !== 'string' || !text.trim() || PLACEHOLDER_RE.test(text.trim());
}

const NOISE_WORDS =
  /\b(official|lyrics?|lyric video|audio|video|visuali[sz]er|remaster(?:ed)?|live|acoustic|hd|4k|feat\.?|ft\.?|featuring|version|mix|edit)\b/i;

/** "Gratitude (Acoustic Reflection) [Official Video]" -> "Gratitude" */
export function cleanTitle(title = '') {
  return String(title)
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\(([^)]*)\)/g, (match, inner) => (NOISE_WORDS.test(inner) ? ' ' : match))
    .replace(/\s+(?:feat\.?|ft\.?|featuring)\s+.*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns '' when the artist is unknown so we search by title only */
export function cleanArtist(artist = '') {
  const a = String(artist)
    .replace(/\s*-\s*topic$/i, '')
    .replace(/vevo$/i, '')
    .trim();
  if (!a || /^(device storage|unknown artist|youtube|various artists?|selah music)$/i.test(a)) return '';
  return a;
}

const norm = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/[\s\-_.,!?'"’“”()[\]:;/\\&]+/g, ' ')
    .trim();

function similarity(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 2;
  if (x.includes(y) || y.includes(x)) return 1;
  return 0;
}

async function getJson(url, timeoutMs = 9000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller ? controller.signal : undefined
    });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Lyrics service returned ${res.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const buildQuery = (params) =>
  Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

function rankCandidates(results, title, artist) {
  const scored = results.map((r) => {
    const titleScore = similarity(r.trackName || r.name, title);
    const artistScore = artist ? similarity(r.artistName, artist) : 0;
    const lyricsScore = (r.syncedLyrics ? 3 : 0) + (r.plainLyrics ? 1 : 0);
    return { r, titleScore, score: lyricsScore + titleScore * 2 + artistScore * 2 };
  });
  const titleMatches = scored.filter((s) => s.titleScore > 0);
  const pool = titleMatches.length > 0 ? titleMatches : scored;
  return pool.sort((a, b) => b.score - a.score).map((s) => s.r);
}

/**
 * Looks lyrics up by title (+ artist when known).
 * Returns up to 6 candidate versions: { id, trackName, artistName, albumName, duration, instrumental, synced, plain }
 */
export async function searchLyrics({ title, artist }) {
  const t = cleanTitle(title);
  const a = cleanArtist(artist);
  if (!t) return [];

  let results = [];
  if (a) {
    results = await getJson(`${BASE_URL}/search?${buildQuery({ track_name: t, artist_name: a })}`);
  }
  if (!Array.isArray(results) || results.length === 0) {
    results = await getJson(`${BASE_URL}/search?${buildQuery({ q: a ? `${t} ${a}` : t })}`);
  }
  if (!Array.isArray(results)) return [];

  return rankCandidates(results, t, a)
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      trackName: r.trackName || r.name || '',
      artistName: r.artistName || '',
      albumName: r.albumName || '',
      duration: Number(r.duration) || 0,
      instrumental: Boolean(r.instrumental),
      synced: r.syncedLyrics || null,
      plain: r.plainLyrics || null
    }));
}

/** Prefer synced versions, then the one whose length is closest to the real song length */
export function orderCandidates(candidates = [], duration = 0) {
  const trusted = duration >= 30;
  return [...candidates].sort((a, b) => {
    const sa = a.synced ? 1 : 0;
    const sb = b.synced ? 1 : 0;
    if (sa !== sb) return sb - sa;
    if (trusted) return Math.abs((a.duration || 0) - duration) - Math.abs((b.duration || 0) - duration);
    return 0;
  });
}

/** "[01:05.30] text" -> [{ id, time: 65.3, text }] (supports several time tags on one line) */
export function parseLrc(text) {
  if (!text || typeof text !== 'string') return [];
  const tagRe = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  const out = [];
  text.split(/\r?\n/).forEach((line) => {
    const stamps = [];
    let lastEnd = 0;
    let m;
    tagRe.lastIndex = 0;
    while ((m = tagRe.exec(line)) !== null) {
      const frac = m[3] ? parseInt(m[3], 10) / Math.pow(10, m[3].length) : 0;
      stamps.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + frac);
      lastEnd = tagRe.lastIndex;
    }
    if (stamps.length === 0) return;
    const lyric = line.slice(lastEnd).trim();
    if (!lyric) return;
    stamps.forEach((time) => out.push({ time, text: lyric }));
  });
  out.sort((a, b) => a.time - b.time);
  return out.map((l, i) => ({ ...l, id: i }));
}

/** Plain (not synced) lyrics -> lines, keeping single blank lines as verse breaks */
export function parsePlain(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\]/g, '').trim());
  const out = [];
  lines.forEach((l) => {
    if (l === '' && (out.length === 0 || out[out.length - 1] === '')) return;
    out.push(l);
  });
  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

export const LyricsService = { searchLyrics, parseLrc, parsePlain, orderCandidates, isPlaceholderLyrics };
export default LyricsService;
