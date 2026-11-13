// Selah's own tables (Neon Postgres, added from the Vercel Marketplace).
// Accounts live in Better Auth's tables (see lib/auth.js); these tables point to them by user id.
// Vercel puts the database address in DATABASE_URL (or POSTGRES_URL) automatically.
import { neon } from '@neondatabase/serverless';
import { HttpError } from './http.js';

let client = null;
let testSql = null;
let ready = null;

/** Tests use an in-memory database instead of Neon */
export function useSqlForTests(sql) {
  testSql = sql;
  ready = null;
}

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

function getSql() {
  if (testSql) return testSql;
  const url = databaseUrl();
  if (!url) throw new HttpError(503, 'The database is not connected yet');
  if (!client) client = neon(url);
  return client;
}

/** The tables are created automatically the first time they're needed */
export async function createTables(sql) {
  await sql`CREATE TABLE IF NOT EXISTS backups (
    user_id text PRIMARY KEY,
    data jsonb NOT NULL,
    size integer NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS shared_lyrics (
    id serial PRIMARY KEY,
    song_key text NOT NULL,
    title text NOT NULL,
    artist text NOT NULL,
    duration integer,
    lyrics text NOT NULL,
    synced boolean NOT NULL DEFAULT false,
    user_id text NOT NULL,
    reports integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (song_key, user_id)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS shared_lyrics_song ON shared_lyrics (song_key)`;
  await sql`CREATE TABLE IF NOT EXISTS lyric_reports (
    lyric_id integer NOT NULL,
    user_id text NOT NULL,
    PRIMARY KEY (lyric_id, user_id)
  )`;
  // Premium given for free (testers, church partners...). Add a row by hand to gift Premium.
  await sql`CREATE TABLE IF NOT EXISTS premium_gifts (
    user_id text PRIMARY KEY,
    until timestamptz,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
}

export async function db() {
  const sql = getSql();
  if (!ready) {
    ready = createTables(sql).catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
  return sql;
}

// ── Backups ────────────────────────────────────────────────────────────────
export async function getBackup(userId) {
  const sql = await db();
  const rows = await sql`SELECT data, updated_at FROM backups WHERE user_id = ${userId}`;
  return rows[0] || null;
}

export async function putBackup(userId, data, size) {
  const sql = await db();
  const rows = await sql`INSERT INTO backups (user_id, data, size, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}::jsonb, ${size}, now())
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, size = EXCLUDED.size, updated_at = now()
    RETURNING updated_at`;
  return rows[0].updated_at;
}

export async function deleteBackup(userId) {
  const sql = await db();
  const rows = await sql`DELETE FROM backups WHERE user_id = ${userId} RETURNING user_id`;
  return rows.length > 0;
}

// ── Shared lyrics ──────────────────────────────────────────────────────────
export async function lyricsForSong(songKey) {
  const sql = await db();
  return sql`SELECT id, title, artist, duration, lyrics, synced, created_at FROM shared_lyrics
    WHERE song_key = ${songKey} AND reports < 3
    ORDER BY synced DESC, created_at DESC
    LIMIT 20`;
}

export async function saveLyrics({ songKey, title, artist, duration, lyrics, synced, userId }) {
  const sql = await db();
  const rows = await sql`INSERT INTO shared_lyrics (song_key, title, artist, duration, lyrics, synced, user_id)
    VALUES (${songKey}, ${title}, ${artist}, ${duration}, ${lyrics}, ${synced}, ${userId})
    ON CONFLICT (song_key, user_id) DO UPDATE SET
      title = EXCLUDED.title, artist = EXCLUDED.artist, duration = EXCLUDED.duration,
      lyrics = EXCLUDED.lyrics, synced = EXCLUDED.synced, created_at = now()
    RETURNING id`;
  return rows[0].id;
}

export async function reportLyrics(id, userId) {
  const sql = await db();
  const added = await sql`INSERT INTO lyric_reports (lyric_id, user_id) VALUES (${id}, ${userId})
    ON CONFLICT DO NOTHING RETURNING lyric_id`;
  if (added.length > 0) await sql`UPDATE shared_lyrics SET reports = reports + 1 WHERE id = ${id}`;
  return added.length > 0;
}

// ── Premium gifts ──────────────────────────────────────────────────────────
export async function getGift(userId) {
  const sql = await db();
  const rows = await sql`SELECT until FROM premium_gifts WHERE user_id = ${userId}`;
  return rows[0] || null;
}

export async function giftPremium(userId, until = null, note = null) {
  const sql = await db();
  await sql`INSERT INTO premium_gifts (user_id, until, note) VALUES (${userId}, ${until}, ${note})
    ON CONFLICT (user_id) DO UPDATE SET until = EXCLUDED.until, note = EXCLUDED.note`;
}

// ── Deleting an account removes everything Selah keeps about that person ──
export async function deleteUserData(userId) {
  const sql = await db();
  await sql`DELETE FROM backups WHERE user_id = ${userId}`;
  await sql`DELETE FROM lyric_reports WHERE user_id = ${userId}`;
  await sql`DELETE FROM lyric_reports WHERE lyric_id IN (SELECT id FROM shared_lyrics WHERE user_id = ${userId})`;
  await sql`DELETE FROM shared_lyrics WHERE user_id = ${userId}`;
  await sql`DELETE FROM premium_gifts WHERE user_id = ${userId}`;
}
