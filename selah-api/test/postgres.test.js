// The same code on a REAL Postgres (PGlite runs Postgres inside Node): the account tables are created
// automatically like on the first visit in production, and deleting an account clears Selah's tables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { getMigrations } from 'better-auth/db/migration';
import { authOptions, useAuthDatabaseForTests } from '../lib/auth.js';
import { useSqlForTests, createTables, giftPremium } from '../lib/db.js';
import { useEmailSenderForTests } from '../lib/email.js';
import * as authApi from '../api/auth.js';
import * as backup from '../api/backup.js';
import * as lyrics from '../api/lyrics/index.js';
import * as me from '../api/me.js';

// The small part of a "pg" Pool that Better Auth's database layer uses, on top of PGlite
function poolFor(pg) {
  return {
    async connect() {
      return {
        async query(text, params) {
          const result = await pg.query(text, params);
          const command = String(text).trim().split(/\s+/)[0].toUpperCase();
          return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length, command };
        },
        release() {}
      };
    },
    async end() {}
  };
}

const tag = (pg) => async (strings, ...values) => {
  let text = strings[0];
  values.forEach((v, i) => {
    text += `$${i + 1}${strings[i + 1]}`;
  });
  return (await pg.query(text, values)).rows;
};

const post = (fn, path, body, token) =>
  fn(
    new Request(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    })
  );

test('real Postgres: tables are created, accounts work, deleting an account clears everything', async () => {
  const pg = new PGlite();
  const sql = tag(pg);
  const pool = poolFor(pg);
  useSqlForTests(sql);
  useEmailSenderForTests(async () => {});

  // Selah's own tables: created on first use, and safe to run again
  await createTables(sql);
  await createTables(sql);

  // Better Auth's tables: created automatically the first time, nothing to do the second time
  const options = authOptions(pool, 'postgres-check-secret-0123456789-abcdef');
  const first = await getMigrations(options);
  assert.deepEqual(first.toBeCreated.map((t) => t.table).sort(), ['account', 'session', 'user', 'verification']);
  await first.runMigrations();
  assert.equal((await getMigrations(options)).toBeCreated.length, 0);

  useAuthDatabaseForTests(pool);
  const signUp = await post(authApi.POST, '/api/auth?path=sign-up/email', { email: 'ama@example.com', password: 'worship123', name: 'Ama' });
  assert.equal(signUp.status, 200);
  const token = signUp.headers.get('set-auth-token');
  const { user } = await signUp.json();
  assert.equal((await sql`SELECT email FROM "user"`)[0].email, 'ama@example.com');

  await giftPremium(user.id, null, 'test');
  const meRes = await me.GET(new Request('http://localhost:3000/api/me', { headers: { authorization: `Bearer ${token}` } }));
  assert.equal((await meRes.json()).premium.source, 'gift');

  const put = await backup.PUT(
    new Request('http://localhost:3000/api/backup', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: { version: 1, favorites: ['s1'] } })
    })
  );
  assert.equal(put.status, 200);
  const shared = await post(lyrics.POST, '/api/lyrics', { title: 'Odo Yewu', artist: 'Joe Mettle', text: 'Odo yewu, odo yewu\nYour love is so amazing' }, token);
  assert.equal(shared.status, 200);

  const deleted = await post(authApi.POST, '/api/auth?path=delete-user', { password: 'worship123' }, token);
  assert.equal(deleted.status, 200);
  assert.deepEqual(await sql`SELECT id FROM "user"`, []);
  assert.deepEqual(await sql`SELECT user_id FROM backups`, []);
  assert.deepEqual(await sql`SELECT id FROM shared_lyrics`, []);
  assert.deepEqual(await sql`SELECT user_id FROM premium_gifts`, []);
  await pg.close();
});
