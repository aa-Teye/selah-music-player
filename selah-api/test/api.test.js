// Runs every endpoint against an in-memory Postgres (pg-mem), using the real SQL.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { newDb } from 'pg-mem';
import { useSqlForTests } from '../lib/db.js';
import { songKey } from '../lib/songKey.js';
import * as backup from '../api/backup.js';
import * as lyrics from '../api/lyrics/index.js';
import * as report from '../api/lyrics/report.js';
import * as health from '../api/health.js';

const CODE = 'ABCD-EFGH-JKLM-NPQR-STUV';
const CODE2 = 'WXYZ-2345-6789-ABCD-EFGH';
const CODE3 = 'HJKL-MNPQ-RSTU-VWXY-Z234';

function memorySql() {
  const { Pool } = newDb().adapters.createPg();
  const pool = new Pool();
  return async (strings, ...values) => {
    let text = strings[0];
    values.forEach((v, i) => {
      text += `$${i + 1}${strings[i + 1]}`;
    });
    return (await pool.query(text, values)).rows;
  };
}

function req(path, { method = 'GET', code, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (code) headers.authorization = `Bearer ${code}`;
  return new Request(`https://selah.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  });
}

const call = async (fn, path, options) => {
  const res = await fn(req(path, options));
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
};

beforeEach(() => {
  useSqlForTests(memorySql());
});

test('health: up, with the database', async () => {
  const { status, body } = await call(health.GET, '/api/health');
  assert.equal(status, 200);
  assert.deepEqual(body, { ok: true, service: 'selah-api', version: 1, database: 'ok' });
});

test('health: says clearly when the database is not connected yet', async () => {
  useSqlForTests(null);
  const saved = { DATABASE_URL: process.env.DATABASE_URL, POSTGRES_URL: process.env.POSTGRES_URL };
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  const { body } = await call(health.GET, '/api/health');
  assert.equal(body.database, 'not connected');
  const res = await call(backup.GET, '/api/backup', { code: CODE });
  assert.equal(res.status, 503);
  Object.assign(process.env, Object.fromEntries(Object.entries(saved).filter(([, v]) => v)));
});

test('backup: save, read back, private to its code, delete', async () => {
  assert.equal((await call(backup.GET, '/api/backup', { code: CODE })).status, 404);

  const data = { version: 1, playlists: [{ id: 'pl-1', name: 'Sunday', songs: ['way maker|sinach'] }], favorites: ['x'] };
  const saved = await call(backup.PUT, '/api/backup', { method: 'PUT', code: CODE, body: { data } });
  assert.equal(saved.status, 200);
  assert.ok(saved.body.size > 10);
  assert.ok(Date.parse(saved.body.savedAt) > 0);

  const read = await call(backup.GET, '/api/backup', { code: CODE.toLowerCase() }); // case doesn't matter
  assert.equal(read.status, 200);
  assert.deepEqual(read.body.data, data);

  // saving again replaces it
  await call(backup.PUT, '/api/backup', { method: 'PUT', code: CODE, body: { data: { version: 1, favorites: [] } } });
  assert.deepEqual((await call(backup.GET, '/api/backup', { code: CODE })).body.data, { version: 1, favorites: [] });

  // nobody else can see it
  assert.equal((await call(backup.GET, '/api/backup', { code: CODE2 })).status, 404);

  assert.deepEqual((await call(backup.DELETE, '/api/backup', { method: 'DELETE', code: CODE })).body, { deleted: true });
  assert.equal((await call(backup.GET, '/api/backup', { code: CODE })).status, 404);
});

test('backup: refuses missing codes, bad data and huge uploads', async () => {
  assert.equal((await call(backup.GET, '/api/backup')).status, 401);
  assert.equal((await call(backup.GET, '/api/backup', { code: 'password123' })).status, 401);
  assert.equal((await call(backup.GET, '/api/backup', { code: 'ABCD-EFGH-JKLM-NPQR-STU1' })).status, 401); // 1 is never used
  assert.equal((await call(backup.PUT, '/api/backup', { method: 'PUT', code: CODE, body: 'not json' })).status, 400);
  assert.equal((await call(backup.PUT, '/api/backup', { method: 'PUT', code: CODE, body: { data: [1, 2] } })).status, 400);
  const huge = { data: { blob: 'x'.repeat(2 * 1024 * 1024 + 10) } };
  assert.equal((await call(backup.PUT, '/api/backup', { method: 'PUT', code: CODE, body: huge })).status, 413);
});

test('song names match however they are written', () => {
  assert.equal(songKey('Way Maker (Live) [Official Video]', 'Sinach ft. Joe Mettle'), 'way maker|sinach');
  assert.equal(songKey('Ọlọ́run Àgbáyé', 'Tope Àlàbí'), 'olorun agbaye|tope alabi');
  assert.equal(songKey('  WAY   MAKER! ', 'SINACH'), 'way maker|sinach');
});

const WAY_MAKER = {
  title: 'Way Maker',
  artist: 'Sinach',
  duration: 300,
  synced: true,
  text: '[00:01.00] You are here, moving in our midst\n[00:06.00] I worship You, I worship You\n[00:12.00] You are here, working in this place'
};

test('lyrics: shared by one phone, found by another (any spelling)', async () => {
  assert.deepEqual((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach')).body, { found: false });

  const posted = await call(lyrics.POST, '/api/lyrics', { method: 'POST', code: CODE, body: WAY_MAKER });
  assert.equal(posted.status, 200);
  assert.ok(posted.body.id > 0);

  const found = await call(lyrics.GET, '/api/lyrics?title=Way%20Maker%20(Live)&artist=SINACH%20ft.%20Joe&duration=301');
  assert.equal(found.body.found, true);
  assert.equal(found.body.lyrics.text, WAY_MAKER.text);
  assert.equal(found.body.lyrics.synced, true);

  // synced lyrics for a much longer version are not used (the timing would be wrong)
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach&duration=420')).body.found, false);

  // the same phone sharing again replaces its own version
  await call(lyrics.POST, '/api/lyrics', { method: 'POST', code: CODE, body: { ...WAY_MAKER, text: `${WAY_MAKER.text}\n[00:18.00] Way maker` } });
  const again = await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach&duration=300');
  assert.match(again.body.lyrics.text, /Way maker$/);
  assert.equal(again.body.lyrics.id, posted.body.id);
});

test('lyrics: plain lyrics fit any version of the song', async () => {
  await call(lyrics.POST, '/api/lyrics', {
    method: 'POST',
    code: CODE,
    body: { title: 'Odo Yewu', artist: 'Joe Mettle', duration: 280, synced: false, text: 'Odo yewu, odo yewu\nYour love is so amazing' }
  });
  const found = await call(lyrics.GET, '/api/lyrics?title=Odo%20Yewu&artist=Joe%20Mettle&duration=500');
  assert.equal(found.body.found, true);
  assert.equal(found.body.lyrics.synced, false);
});

test('lyrics: refuses incomplete or broken submissions', async () => {
  const post = (body, code = CODE) => call(lyrics.POST, '/api/lyrics', { method: 'POST', code, body });
  assert.equal((await post(WAY_MAKER, null)).status, 401);
  assert.equal((await post({ ...WAY_MAKER, title: '' })).status, 400);
  assert.equal((await post({ ...WAY_MAKER, artist: 'Unknown Artist' })).status, 400);
  assert.equal((await post({ ...WAY_MAKER, text: 'too short' })).status, 400);
  assert.equal((await post({ ...WAY_MAKER, text: 'no times here at all, just words' })).status, 400);
  assert.equal((await post({ ...WAY_MAKER, text: 'x'.repeat(20001) })).status, 413);
  assert.equal((await call(lyrics.GET, '/api/lyrics?artist=Sinach')).status, 400);
});

test('lyrics: hidden after 3 different phones report them (a phone counts once)', async () => {
  const { body } = await call(lyrics.POST, '/api/lyrics', { method: 'POST', code: CODE, body: WAY_MAKER });
  const reportBy = (code) => call(report.POST, '/api/lyrics/report', { method: 'POST', code, body: { id: body.id } });

  assert.deepEqual((await reportBy(CODE2)).body, { reported: true });
  assert.deepEqual((await reportBy(CODE2)).body, { reported: false }); // same phone again
  await reportBy(CODE3);
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach')).body.found, true); // 2 reports

  await reportBy('KLMN-PQRS-TUVW-XYZ2-3456');
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach')).body.found, false); // 3 reports

  assert.equal((await call(report.POST, '/api/lyrics/report', { method: 'POST', code: CODE, body: { id: 'x' } })).status, 400);
});

test('browsers may call it (CORS preflight)', async () => {
  const res = await backup.OPTIONS(req('/api/backup', { method: 'OPTIONS' }));
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});
