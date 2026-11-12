// The database (Neon Postgres, added from the Vercel Marketplace).
// Vercel puts its address in DATABASE_URL (or POSTGRES_URL) automatically.
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

function getSql() {
  if (testSql) return testSql;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new HttpError(503, 'The database is not connected yet');
  if (!client) client = neon(url);
  return client;
}

/** The tables are created automatically the first time they're needed */
export async function createTables(sql) {
  await sql`CREATE TABLE IF NOT EXISTS backups (
    id text PRIMARY KEY,
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
    device text NOT NULL,
    reports integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (song_key, device)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS shared_lyrics_song ON shared_lyrics (song_key)`;
  await sql`CREATE TABLE IF NOT EXISTS lyric_reports (
    lyric_id integer NOT NULL,
    device text NOT NULL,
    PRIMARY KEY (lyric_id, device)
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
export async function getBackup(id) {
  const sql = await db();
  const rows = await sql`SELECT data, updated_at FROM backups WHERE id = ${id}`;
  return rows[0] || null;
}

export async function putBackup(id, data, size) {
  const sql = await db();
  const rows = await sql`INSERT INTO backups (id, data, size, updated_at)
    VALUES (${id}, ${JSON.stringify(data)}::jsonb, ${size}, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, size = EXCLUDED.size, updated_at = now()
    RETURNING updated_at`;
  return rows[0].updated_at;
}

export async function deleteBackup(id) {
  const sql = await db();
  const rows = await sql`DELETE FROM backups WHERE id = ${id} RETURNING id`;
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

export async function saveLyrics({ songKey, title, artist, duration, lyrics, synced, device }) {
  const sql = await db();
  const rows = await sql`INSERT INTO shared_lyrics (song_key, title, artist, duration, lyrics, synced, device)
    VALUES (${songKey}, ${title}, ${artist}, ${duration}, ${lyrics}, ${synced}, ${device})
    ON CONFLICT (song_key, device) DO UPDATE SET
      title = EXCLUDED.title, artist = EXCLUDED.artist, duration = EXCLUDED.duration,
      lyrics = EXCLUDED.lyrics, synced = EXCLUDED.synced, created_at = now()
    RETURNING id`;
  return rows[0].id;
}

export async function reportLyrics(id, device) {
  const sql = await db();
  const added = await sql`INSERT INTO lyric_reports (lyric_id, device) VALUES (${id}, ${device})
    ON CONFLICT DO NOTHING RETURNING lyric_id`;
  if (added.length > 0) await sql`UPDATE shared_lyrics SET reports = reports + 1 WHERE id = ${id}`;
  return added.length > 0;
}
