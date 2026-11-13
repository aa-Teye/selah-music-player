// Runs every endpoint for real: accounts in memory (Better Auth), Selah's tables in an in-memory
// Postgres (pg-mem, using the real SQL). Payments (RevenueCat) and emails are stubbed.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { newDb } from 'pg-mem';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { useSqlForTests, giftPremium } from '../lib/db.js';
import { useAuthDatabaseForTests } from '../lib/auth.js';
import { useEmailSenderForTests } from '../lib/email.js';
import { songKey } from '../lib/songKey.js';
import * as authApi from '../api/auth.js';
import * as me from '../api/me.js';
import * as backup from '../api/backup.js';
import * as lyrics from '../api/lyrics/index.js';
import * as report from '../api/lyrics/report.js';
import * as health from '../api/health.js';
import * as privacy from '../api/privacy.js';
import * as deleteAccount from '../api/delete-account.js';

const BASE = 'http://localhost:3000';
let sql;
let emails;
const realFetch = global.fetch;

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

beforeEach(() => {
  sql = memorySql();
  useSqlForTests(sql);
  useAuthDatabaseForTests(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
  emails = [];
  useEmailSenderForTests(async (m) => {
    emails.push(m);
  });
  delete process.env.PREMIUM_MODE;
  delete process.env.REVENUECAT_SECRET_KEY;
  delete process.env.SUPPORT_EMAIL;
});

afterEach(() => {
  global.fetch = realFetch;
});

function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  });
}

async function call(fn, path, options) {
  const res = await fn(request(path, options));
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, token: res.headers.get('set-auth-token') };
}

// Vercel forwards /api/auth/<path> as /api/auth?path=<path> (vercel.json); both must work
const auth = (path, body, options = {}) =>
  call(body === undefined ? authApi.GET : authApi.POST, options.direct ? `/api/auth/${path}` : `/api/auth?path=${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    body,
    token: options.token
  });

async function signUp(email = 'ama@example.com', password = 'worship123', name = 'Ama') {
  const res = await auth('sign-up/email', { email, password, name });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(res.token, 'a login token comes back');
  return { token: res.token, user: res.body.user };
}

test('health: tells what is set up', async () => {
  const { body } = await call(health.GET, '/api/health');
  assert.deepEqual(body, {
    ok: true,
    service: 'selah-api',
    version: 2,
    database: 'ok',
    accounts: 'ok',
    email: 'ready',
    premium: 'payments not set up'
  });
});

test('sign up, see my account, log out, log in again', async () => {
  const { token, user } = await signUp();
  assert.equal(user.email, 'ama@example.com');

  const mine = await call(me.GET, '/api/me', { token });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.user.email, 'ama@example.com');
  assert.equal(mine.body.user.name, 'Ama');
  assert.deepEqual(mine.body.premium, { active: false, until: null, source: null });

  assert.equal((await call(me.GET, '/api/me')).status, 401);
  assert.equal((await call(me.GET, '/api/me', { token: 'not-a-real-token' })).status, 401);

  // the same email can't sign up twice
  assert.notEqual((await auth('sign-up/email', { email: 'AMA@example.com', password: 'another123', name: 'X' })).status, 200);

  await auth('sign-out', {}, { token });
  assert.equal((await call(me.GET, '/api/me', { token })).status, 401);

  assert.equal((await auth('sign-in/email', { email: 'ama@example.com', password: 'wrong-password' })).status, 401);
  const again = await auth('sign-in/email', { email: 'ama@example.com', password: 'worship123' }, { direct: true });
  assert.equal(again.status, 200);
  assert.equal((await call(me.GET, '/api/me', { token: again.token })).body.user.email, 'ama@example.com');
});

test('passwords must be at least 8 characters', async () => {
  const res = await auth('sign-up/email', { email: 'kofi@example.com', password: 'short', name: 'Kofi' });
  assert.notEqual(res.status, 200);
});

test('forgot password: a 6-digit code by email, then a new password; old logins stop working', async () => {
  const { token } = await signUp();
  const sent = await auth('email-otp/request-password-reset', { email: 'ama@example.com' });
  assert.equal(sent.status, 200);
  assert.equal(emails.length, 1);
  assert.equal(emails[0].to, 'ama@example.com');
  assert.equal(emails[0].type, 'forget-password');
  assert.match(emails[0].code, /^\d{6}$/);

  const wrong = await auth('email-otp/reset-password', { email: 'ama@example.com', otp: '000000', password: 'newpass123' });
  assert.notEqual(wrong.status, 200);

  const reset = await auth('email-otp/reset-password', { email: 'ama@example.com', otp: emails[0].code, password: 'newpass123' });
  assert.equal(reset.status, 200, JSON.stringify(reset.body));
  assert.equal((await call(me.GET, '/api/me', { token })).status, 401); // logged out everywhere
  assert.equal((await auth('sign-in/email', { email: 'ama@example.com', password: 'worship123' })).status, 401);
  assert.equal((await auth('sign-in/email', { email: 'ama@example.com', password: 'newpass123' })).status, 200);
});

test('backup is Premium: refused for free accounts, works when Premium is gifted', async () => {
  const { token, user } = await signUp();
  const data = { version: 1, playlists: [{ id: 'pl-1', name: 'Sunday', trackIds: ['s1'] }], songs: { s1: { t: 'Way Maker', a: 'Sinach' } } };

  const refused = await call(backup.PUT, '/api/backup', { method: 'PUT', token, body: { data } });
  assert.equal(refused.status, 402);
  assert.equal(refused.body.premium, false);
  assert.equal((await call(backup.PUT, '/api/backup', { method: 'PUT', body: { data } })).status, 401);

  await giftPremium(user.id, null, 'tester');
  assert.deepEqual((await call(me.GET, '/api/me', { token })).body.premium, { active: true, until: null, source: 'gift' });
  assert.equal((await call(backup.GET, '/api/backup', { token })).status, 404);
  const saved = await call(backup.PUT, '/api/backup', { method: 'PUT', token, body: { data } });
  assert.equal(saved.status, 200);
  assert.deepEqual((await call(backup.GET, '/api/backup', { token })).body.data, data);

  // someone else never sees it
  const other = await signUp('kofi@example.com', 'praise1234', 'Kofi');
  await giftPremium(other.user.id);
  assert.equal((await call(backup.GET, '/api/backup', { token: other.token })).status, 404);

  // a gift that has ended
  await giftPremium(other.user.id, new Date(Date.now() - 1000).toISOString());
  assert.equal((await call(backup.GET, '/api/backup', { token: other.token })).status, 402);

  // deleting your backup never needs Premium
  assert.deepEqual((await call(backup.DELETE, '/api/backup', { method: 'DELETE', token })).body, { deleted: true });
});

test('PREMIUM_MODE=open gives everyone Premium (for testing)', async () => {
  process.env.PREMIUM_MODE = 'open';
  const { token } = await signUp();
  assert.deepEqual((await call(me.GET, '/api/me', { token })).body.premium, { active: true, until: null, source: 'open' });
  assert.equal((await call(health.GET, '/api/health')).body.premium, 'open to everyone');
});

test('Premium bought in Google Play is checked with RevenueCat', async () => {
  const { token, user } = await signUp();
  process.env.REVENUECAT_SECRET_KEY = 'sk_test_123';
  let entitlement = { expires_date: new Date(Date.now() + 86400000).toISOString(), product_identifier: 'selah_premium_monthly' };
  const asked = [];
  global.fetch = async (url, options) => {
    asked.push({ url: String(url), auth: options.headers.Authorization });
    return new Response(JSON.stringify({ subscriber: { entitlements: entitlement ? { premium: entitlement } : {} } }), { status: 200 });
  };

  const active = (await call(me.GET, '/api/me', { token })).body.premium;
  assert.equal(active.active, true);
  assert.equal(active.source, 'store');
  assert.equal(asked[0].url, `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`);
  assert.equal(asked[0].auth, 'Bearer sk_test_123');
  assert.equal((await call(backup.PUT, '/api/backup', { method: 'PUT', token, body: { data: { version: 1 } } })).status, 200);

  entitlement = { expires_date: new Date(Date.now() - 86400000).toISOString() }; // ran out
  assert.equal((await call(me.GET, '/api/me', { token })).body.premium.active, false);
  entitlement = { expires_date: new Date(Date.now() - 1000).toISOString(), grace_period_expires_date: new Date(Date.now() + 86400000).toISOString() };
  assert.equal((await call(me.GET, '/api/me', { token })).body.premium.active, true); // payment problem: grace period
  entitlement = null; // never bought
  assert.equal((await call(me.GET, '/api/me', { token })).body.premium.active, false);

  global.fetch = async () => {
    throw new Error('offline');
  };
  assert.equal((await call(backup.GET, '/api/backup', { token })).status, 502);
});

test('delete my account: needs the password, removes the account, backup and shared lyrics', async () => {
  const { token, user } = await signUp();
  await giftPremium(user.id);
  await call(backup.PUT, '/api/backup', { method: 'PUT', token, body: { data: { version: 1 } } });
  await call(lyrics.POST, '/api/lyrics', {
    method: 'POST',
    token,
    body: { title: 'Odo Yewu', artist: 'Joe Mettle', synced: false, text: 'Odo yewu, odo yewu\nYour love is so amazing' }
  });

  assert.notEqual((await auth('delete-user', { password: 'wrong-password' }, { token })).status, 200);
  const deleted = await auth('delete-user', { password: 'worship123' }, { token });
  assert.equal(deleted.status, 200, JSON.stringify(deleted.body));

  assert.equal((await call(me.GET, '/api/me', { token })).status, 401);
  assert.equal((await auth('sign-in/email', { email: 'ama@example.com', password: 'worship123' })).status, 401);
  assert.deepEqual(await sql`SELECT user_id FROM backups WHERE user_id = ${user.id}`, []);
  assert.deepEqual(await sql`SELECT id FROM shared_lyrics WHERE user_id = ${user.id}`, []);
  assert.deepEqual(await sql`SELECT user_id FROM premium_gifts WHERE user_id = ${user.id}`, []);
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Odo%20Yewu&artist=Joe%20Mettle')).body.found, false);

  // the same email can sign up again later, as a new account
  assert.equal((await auth('sign-up/email', { email: 'ama@example.com', password: 'worship123', name: 'Ama' })).status, 200);
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

test('shared lyrics: anyone can read them; sharing needs an account (free)', async () => {
  assert.deepEqual((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach')).body, { found: false });
  assert.equal((await call(lyrics.POST, '/api/lyrics', { method: 'POST', body: WAY_MAKER })).status, 401);

  const { token } = await signUp();
  const posted = await call(lyrics.POST, '/api/lyrics', { method: 'POST', token, body: WAY_MAKER });
  assert.equal(posted.status, 200);

  const found = await call(lyrics.GET, '/api/lyrics?title=Way%20Maker%20(Live)&artist=SINACH%20ft.%20Joe&duration=301');
  assert.equal(found.body.found, true);
  assert.equal(found.body.lyrics.text, WAY_MAKER.text);
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach&duration=420')).body.found, false); // other version

  // sharing again replaces your own version
  await call(lyrics.POST, '/api/lyrics', { method: 'POST', token, body: { ...WAY_MAKER, text: `${WAY_MAKER.text}\n[00:18.00] Way maker` } });
  const again = await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach&duration=300');
  assert.match(again.body.lyrics.text, /Way maker$/);
  assert.equal(again.body.lyrics.id, posted.body.id);

  const post = (body) => call(lyrics.POST, '/api/lyrics', { method: 'POST', token, body });
  assert.equal((await post({ ...WAY_MAKER, artist: 'Unknown Artist' })).status, 400);
  assert.equal((await post({ ...WAY_MAKER, text: 'too short' })).status, 400);
  assert.equal((await post({ ...WAY_MAKER, text: 'no times here at all, just words' })).status, 400);
  assert.equal((await post({ ...WAY_MAKER, text: 'x'.repeat(20001) })).status, 413);
});

test('shared lyrics are hidden after 3 different people report them', async () => {
  const author = await signUp();
  const { body } = await call(lyrics.POST, '/api/lyrics', { method: 'POST', token: author.token, body: WAY_MAKER });
  const reporters = [];
  for (const name of ['kofi', 'esi', 'yaw']) reporters.push((await signUp(`${name}@example.com`, 'praise1234', name)).token);
  const reportBy = (token) => call(report.POST, '/api/lyrics/report', { method: 'POST', token, body: { id: body.id } });

  assert.equal((await call(report.POST, '/api/lyrics/report', { method: 'POST', body: { id: body.id } })).status, 401);
  assert.deepEqual((await reportBy(reporters[0])).body, { reported: true });
  assert.deepEqual((await reportBy(reporters[0])).body, { reported: false }); // counts once
  await reportBy(reporters[1]);
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach')).body.found, true);
  await reportBy(reporters[2]);
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach')).body.found, false);
});

test('privacy and delete-account pages (Google Play needs both)', async () => {
  const policy = await (await privacy.GET()).text();
  assert.match(policy, /Privacy policy/);
  assert.match(policy, /never uploads your music files/);
  assert.match(policy, /Google Play \("Developer contact"\)/);

  process.env.SUPPORT_EMAIL = 'help@selah.app<script>';
  const deletion = await (await deleteAccount.GET()).text();
  assert.match(deletion, /Delete my account/);
  assert.match(deletion, /mailto:help@selah\.app&lt;script&gt;/); // shown safely
  assert.doesNotMatch(deletion, /<script>/);
});

test('browsers may call it (CORS preflight)', async () => {
  const res = await backup.OPTIONS(request('/api/backup', { method: 'OPTIONS' }));
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});
