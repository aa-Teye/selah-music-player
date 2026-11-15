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
import * as termsPage from '../api/terms.js';
import * as youtubeSearch from '../api/youtube/search.js';
import * as youtubeVideos from '../api/youtube/videos.js';
import * as youtubeChannels from '../api/youtube/channels.js';
import { useYouTubeFetchForTests } from '../lib/youtube.js';
import * as home from '../api/home.js';

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

function request(path, { method = 'GET', token, body, cookie, origin } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (cookie) headers.cookie = cookie;
  if (origin) headers.origin = origin;
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
    youtube: 'not set up',
    premium: 'payments not set up'
  });
});

test("YouTube's official search through Selah's server: answers are remembered for hours, never 30 days", async () => {
  delete process.env.YOUTUBE_API_KEY;
  assert.equal((await call(youtubeSearch.GET, '/api/youtube/search?q=worship')).status, 503); // not set up yet

  process.env.YOUTUBE_API_KEY = 'test-key';
  const asked = [];
  useYouTubeFetchForTests(async (url) => {
    const u = new URL(url);
    asked.push(u.pathname.split('/').pop());
    assert.equal(u.searchParams.get('key'), 'test-key');
    if (u.pathname.endsWith('/search')) {
      assert.equal(u.searchParams.get('videoEmbeddable'), 'true');
      return { ok: true, json: async () => ({ items: [{ id: { videoId: 'gIWCDgNt5ww' } }, { id: { videoId: 'livelivexx1' } }] }) };
    }
    return {
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'gIWCDgNt5ww',
            snippet: { title: 'Chris Tomlin &amp; Friends // Worship', channelTitle: 'Chris Tomlin', thumbnails: { high: { url: 'https://i.ytimg.com/vi/gIWCDgNt5ww/hqdefault.jpg' } } },
            contentDetails: { duration: 'PT1H2M10S' }
          },
          { id: 'livelivexx1', snippet: { title: 'Live now', channelTitle: 'Church', liveBroadcastContent: 'live' }, contentDetails: { duration: 'P0D' } }
        ]
      })
    };
  });
  try {
    const first = await call(youtubeSearch.GET, '/api/youtube/search?q=Worship%20%20songs');
    assert.equal(first.status, 200);
    assert.deepEqual(first.body.results, [
      {
        youtubeId: 'gIWCDgNt5ww',
        title: 'Chris Tomlin & Friends // Worship',
        channel: 'Chris Tomlin',
        duration: 3730,
        durationFormatted: '1:02:10',
        picture: 'https://i.ytimg.com/vi/gIWCDgNt5ww/hqdefault.jpg',
        live: false
      }
    ]); // live streams are left out
    assert.deepEqual(asked, ['search', 'videos']);
    await call(youtubeSearch.GET, '/api/youtube/search?q=worship%20songs'); // the same search again
    assert.deepEqual(asked, ['search', 'videos']); // answered from memory: no YouTube units used

    const fresh = await call(youtubeVideos.GET, '/api/youtube/videos?ids=gIWCDgNt5ww,not-an-id');
    assert.equal(fresh.body.videos[0].title, 'Chris Tomlin & Friends // Worship');
    assert.equal((await call(youtubeSearch.GET, '/api/youtube/search?q=')).status, 400);
  } finally {
    useYouTubeFetchForTests(null);
    delete process.env.YOUTUBE_API_KEY;
  }
});

test("the allowance lasts: an artist's latest songs come from their channel (about 3 units, not 100)", async () => {
  process.env.YOUTUBE_API_KEY = 'test-key';
  const asked = [];
  const video = (id, title, seconds, extra = {}) => ({
    id,
    snippet: { title, channelTitle: 'Sinach', thumbnails: { high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } } },
    contentDetails: { duration: `PT${seconds}S` },
    ...extra
  });
  useYouTubeFetchForTests(async (url) => {
    const u = new URL(url);
    const what = u.pathname.split('/').pop();
    asked.push(what);
    if (what === 'channels') {
      return { ok: true, json: async () => ({ items: [{ id: 'UCzzzzzzzzzzzzzzzzzzzzzz', snippet: { title: 'Sinach', thumbnails: { medium: { url: 'https://yt3.ggpht.com/s' } } } }] }) };
    }
    if (what === 'playlistItems') {
      // a channel's uploads are the playlist starting "UU" instead of "UC"
      assert.match(u.searchParams.get('playlistId'), /^UU(caV40yrjS5R88xYHxK_0rA|zzzzzzzzzzzzzzzzzzzzzz)$/);
      const ids = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc', 'ddddddddddd', 'eeeeeeeeeee'];
      return { ok: true, json: async () => ({ items: ids.map((videoId) => ({ contentDetails: { videoId } })) }) };
    }
    if (what === 'videos') {
      assert.match(u.searchParams.get('part'), /status/);
      return {
        ok: true,
        json: async () => ({
          items: [
            video('aaaaaaaaaaa', 'Way Maker (Live)', 480),
            video('bbbbbbbbbbb', 'A Short', 30), // a Short: left out
            video('ccccccccccc', 'Not for apps', 300, { status: { embeddable: false } }), // cannot play in apps: left out
            video('ddddddddddd', 'Great Are You', 360, { status: { embeddable: true } }),
            video('eeeeeeeeeee', 'Waymaker', 200)
          ]
        })
      };
    }
    throw new Error(`not expected: ${what}`);
  });
  try {
    // by channel ID: the upload list and the details, no keyword search
    const byId = await call(youtubeSearch.GET, '/api/youtube/search?q=latest%20Sinach%20songs%202026&channel=UCcaV40yrjS5R88xYHxK_0rA');
    assert.equal(byId.status, 200);
    assert.deepEqual(byId.body.results.map((v) => v.title), ['Way Maker (Live)', 'Great Are You', 'Waymaker']);
    assert.deepEqual(asked, ['playlistItems', 'videos']);

    // the same tap again: from memory
    await call(youtubeSearch.GET, '/api/youtube/search?q=latest%20Sinach%20songs%202026&channel=UCcaV40yrjS5R88xYHxK_0rA');
    assert.equal(asked.length, 2);

    // by @handle: a small call to find the channel, then its upload list (the video details are the
    // same ones as before, so they are remembered)
    asked.length = 0;
    const byHandle = await call(youtubeSearch.GET, '/api/youtube/search?q=latest%20Sinach%20worship%202026&channel=%40SinachOfficial');
    assert.equal(byHandle.body.results.length, 3);
    assert.deepEqual(asked, ['channels', 'playlistItems']);
    assert.ok(!asked.includes('search'), 'a keyword search (100 units) is never used for an artist with a channel');
  } finally {
    useYouTubeFetchForTests(null);
    delete process.env.YOUTUBE_API_KEY;
  }
});

test("when the day's allowance is used up: the last answer is shown again; with none, 'Search is resting'", async () => {
  process.env.YOUTUBE_API_KEY = 'test-key';
  let used = 0;
  useYouTubeFetchForTests(async (url) => {
    used++;
    const what = new URL(url).pathname.split('/').pop();
    if (what === 'search') return { ok: true, json: async () => ({ items: [{ id: { videoId: 'gIWCDgNt5ww' } }] }) };
    return {
      ok: true,
      json: async () => ({ items: [{ id: 'gIWCDgNt5ww', snippet: { title: 'Worship', channelTitle: 'Church' }, contentDetails: { duration: 'PT5M' } }] })
    };
  });
  try {
    assert.equal((await call(youtubeSearch.GET, '/api/youtube/search?q=worship')).body.results.length, 1);

    // an answer from 30 hours ago: too old to use as new, still good when YouTube cannot be asked
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    await sql`UPDATE youtube_cache SET fetched_at = ${thirtyHoursAgo} WHERE key = 'search:worship'`;
    useYouTubeFetchForTests(async () => ({ ok: false, status: 403, json: async () => ({}) })); // allowance used up
    const again = await call(youtubeSearch.GET, '/api/youtube/search?q=worship');
    assert.equal(again.status, 200);
    assert.equal(again.body.results[0].youtubeId, 'gIWCDgNt5ww');

    // a search nobody made before: nothing to show, and a message that says what is happening
    const none = await call(youtubeSearch.GET, '/api/youtube/search?q=something%20new');
    assert.equal(none.status, 429);
    assert.equal(none.body.code, 'resting');
    assert.match(none.body.error, /resting until tomorrow morning/);

    // any other YouTube trouble: a calm "busy" message
    useYouTubeFetchForTests(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const busy = await call(youtubeSearch.GET, '/api/youtube/search?q=another%20new%20one');
    assert.equal(busy.status, 502);
    assert.equal(busy.body.code, undefined);
    assert.ok(used > 0);
  } finally {
    useYouTubeFetchForTests(null);
    delete process.env.YOUTUBE_API_KEY;
  }
});

test('a typed search is remembered for 3 days, and spellings of the same search share one answer', async () => {
  process.env.YOUTUBE_API_KEY = 'test-key';
  let keywordSearches = 0;
  useYouTubeFetchForTests(async (url) => {
    const what = new URL(url).pathname.split('/').pop();
    if (what === 'search') {
      keywordSearches++;
      return { ok: true, json: async () => ({ items: [{ id: { videoId: 'gIWCDgNt5ww' } }] }) };
    }
    return {
      ok: true,
      json: async () => ({ items: [{ id: 'gIWCDgNt5ww', snippet: { title: 'Worship', channelTitle: 'Church' }, contentDetails: { duration: 'PT5M' } }] })
    };
  });
  try {
    await call(youtubeSearch.GET, '/api/youtube/search?q=Ghana%20gospel');
    await call(youtubeSearch.GET, '/api/youtube/search?q=ghana%20%20gospel%20songs!');
    await call(youtubeSearch.GET, '/api/youtube/search?q=Ghana%20Gospel%20Song');
    assert.equal(keywordSearches, 1, 'three spellings, one question to YouTube');

    // 2 days later: still the same answer; after 4 days: asked again
    const ago = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    await sql`UPDATE youtube_cache SET fetched_at = ${ago(2)} WHERE key = 'search:ghana gospel'`;
    await call(youtubeSearch.GET, '/api/youtube/search?q=Ghana%20gospel');
    assert.equal(keywordSearches, 1);
    await sql`UPDATE youtube_cache SET fetched_at = ${ago(4)} WHERE key = 'search:ghana gospel'`;
    await call(youtubeSearch.GET, '/api/youtube/search?q=Ghana%20gospel');
    assert.equal(keywordSearches, 2);
  } finally {
    useYouTubeFetchForTests(null);
    delete process.env.YOUTUBE_API_KEY;
  }
});

test("artists' pictures: their own YouTube channel pictures, by channel ID or @handle, remembered for a day", async () => {
  delete process.env.YOUTUBE_API_KEY;
  assert.equal((await call(youtubeChannels.GET, '/api/youtube/channels?ids=UCcaV40yrjS5R88xYHxK_0rA')).status, 503);

  process.env.YOUTUBE_API_KEY = 'test-key';
  const asked = [];
  useYouTubeFetchForTests(async (url) => {
    const u = new URL(url);
    assert.equal(u.pathname, '/youtube/v3/channels');
    assert.equal(u.searchParams.get('part'), 'snippet');
    asked.push(u.searchParams.get('id') || u.searchParams.get('forHandle'));
    const picture = (name) => ({ medium: { url: `https://yt3.ggpht.com/${name}=s240` }, default: { url: `https://yt3.ggpht.com/${name}=s88` } });
    if (u.searchParams.get('forHandle') === '@JoeMettleMinistries') {
      return { ok: true, json: async () => ({ items: [{ id: 'UCEwvM8_QdsFIioyVIiGq01Q', snippet: { title: 'Joe Mettle', thumbnails: picture('joe') } }] }) };
    }
    if (u.searchParams.get('forHandle')) return { ok: true, json: async () => ({}) }; // no such handle
    return {
      ok: true,
      json: async () => ({ items: [{ id: 'UCcaV40yrjS5R88xYHxK_0rA', snippet: { title: 'Sinach', thumbnails: picture('sinach') } }] })
    };
  });
  try {
    const path = '/api/youtube/channels?ids=UCcaV40yrjS5R88xYHxK_0rA,UCaaaaaaaaaaaaaaaaaaaaaa,@JoeMettleMinistries,@nobody-here,not-a-channel';
    const first = await call(youtubeChannels.GET, path);
    assert.equal(first.status, 200);
    assert.deepEqual(first.body.channels, {
      UCcaV40yrjS5R88xYHxK_0rA: { id: 'UCcaV40yrjS5R88xYHxK_0rA', title: 'Sinach', picture: 'https://yt3.ggpht.com/sinach=s240' },
      '@JoeMettleMinistries': { id: 'UCEwvM8_QdsFIioyVIiGq01Q', title: 'Joe Mettle', picture: 'https://yt3.ggpht.com/joe=s240' }
    }); // a channel that doesn't exist is left out
    assert.deepEqual(asked, ['UCcaV40yrjS5R88xYHxK_0rA,UCaaaaaaaaaaaaaaaaaaaaaa', '@JoeMettleMinistries', '@nobody-here']);
    await call(youtubeChannels.GET, path); // asked again: from memory, no YouTube units used
    assert.equal(asked.length, 3);
  } finally {
    useYouTubeFetchForTests(null);
    delete process.env.YOUTUBE_API_KEY;
  }
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

test('phones also send the login cookie: Selah\'s app address (selah://) keeps those requests working', async () => {
  // Phones keep cookies automatically, so after logging in every request carries the session cookie too.
  // A cookie without an Origin is refused (protection for websites); the app always sends Origin: selah://
  const signUpRes = await authApi.POST(request('/api/auth?path=sign-up/email', {
    method: 'POST',
    body: { email: 'ama@example.com', password: 'worship123', name: 'Ama' },
    origin: 'selah://'
  }));
  assert.equal(signUpRes.status, 200);
  const token = signUpRes.headers.get('set-auth-token');
  const cookie = signUpRes.headers.get('set-cookie').split(';')[0];
  assert.match(cookie, /session_token=/);

  const refused = await call(authApi.POST, '/api/auth?path=sign-out', { method: 'POST', token, cookie, body: {} });
  assert.equal(refused.status, 403);

  const withApp = (path, body) => call(authApi.POST, `/api/auth?path=${path}`, { method: 'POST', token, cookie, origin: 'selah://', body });
  assert.equal((await withApp('sign-in/email', { email: 'ama@example.com', password: 'worship123' })).status, 200);
  assert.equal((await call(me.GET, '/api/me', { token, cookie, origin: 'selah://' })).status, 200);
  assert.equal((await withApp('delete-user', { password: 'worship123' })).status, 200);

  // other websites are still refused
  assert.equal((await call(authApi.POST, '/api/auth?path=sign-out', { method: 'POST', token, cookie, origin: 'https://evil.example', body: {} })).status, 403);
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
    body: { title: 'Odo Yewu', artist: 'Joe Mettle', synced: false, text: 'Odo yewu, odo yewu\nYour love is so amazing', agreedToRules: true }
  });

  assert.notEqual((await auth('delete-user', { password: 'wrong-password' }, { token })).status, 200);
  const deleted = await auth('delete-user', { password: 'worship123' }, { token });
  assert.equal(deleted.status, 200, JSON.stringify(deleted.body));

  assert.equal((await call(me.GET, '/api/me', { token })).status, 401);
  assert.equal((await auth('sign-in/email', { email: 'ama@example.com', password: 'worship123' })).status, 401);
  assert.deepEqual(await sql`SELECT user_id FROM backups WHERE user_id = ${user.id}`, []);
  assert.deepEqual(await sql`SELECT id FROM shared_lyrics WHERE user_id = ${user.id}`, []);
  assert.deepEqual(await sql`SELECT user_id FROM sharing_rules WHERE user_id = ${user.id}`, []);
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
  text: '[00:01.00] You are here, moving in our midst\n[00:06.00] I worship You, I worship You\n[00:12.00] You are here, working in this place',
  agreedToRules: true
};

test('sharing lyrics needs the sharing rules accepted first (Google Play: things users share)', async () => {
  const { token, user } = await signUp();
  const { agreedToRules, ...withoutAgreeing } = WAY_MAKER;
  const refused = await call(lyrics.POST, '/api/lyrics', { method: 'POST', token, body: withoutAgreeing });
  assert.equal(refused.status, 400);
  assert.match(refused.body.error, /accept the sharing rules/);
  assert.equal((await call(lyrics.POST, '/api/lyrics', { method: 'POST', token, body: WAY_MAKER })).status, 200);
  const [rules] = await sql`SELECT version FROM sharing_rules WHERE user_id = ${user.id}`;
  assert.equal(rules.version, '2026-11-14');
});

test('hide a person: lyrics come with an anonymous author code, and hidden people are left out', async () => {
  const ama = await signUp();
  const kofi = await signUp('kofi@example.com', 'praise1234', 'Kofi');
  await call(lyrics.POST, '/api/lyrics', { method: 'POST', token: ama.token, body: WAY_MAKER });
  await call(lyrics.POST, '/api/lyrics', { method: 'POST', token: kofi.token, body: { ...WAY_MAKER, text: `${WAY_MAKER.text}\n[00:20.00] Promise keeper` } });

  const first = (await call(lyrics.GET, '/api/lyrics?title=Way%20Maker&artist=Sinach')).body.lyrics;
  assert.match(first.author, /^[a-f0-9]{16}$/);
  assert.doesNotMatch(JSON.stringify(first), /kofi@example|ama@example|Kofi|Ama/); // no names or emails
  const next = (await call(lyrics.GET, `/api/lyrics?title=Way%20Maker&artist=Sinach&hide=${first.author}`)).body.lyrics;
  assert.notEqual(next.author, first.author); // the other person's lyrics
  const both = `${first.author},${next.author}`;
  assert.equal((await call(lyrics.GET, `/api/lyrics?title=Way%20Maker&artist=Sinach&hide=${both}`)).body.found, false);
});

test('report a person: after 3 different people report someone, everything they shared is hidden', async () => {
  const author = await signUp();
  const { body } = await call(lyrics.POST, '/api/lyrics', { method: 'POST', token: author.token, body: WAY_MAKER });
  await call(lyrics.POST, '/api/lyrics', {
    method: 'POST',
    token: author.token,
    body: { title: 'Odo Yewu', artist: 'Joe Mettle', synced: false, text: 'Odo yewu, odo yewu\nYour love is so amazing', agreedToRules: true }
  });
  const reportPerson = (token) => call(report.POST, '/api/lyrics/report', { method: 'POST', token, body: { id: body.id, person: true } });

  assert.deepEqual((await reportPerson(author.token)).body, { reported: true, person: false }); // not yourself
  for (const name of ['kofi', 'esi']) {
    const { token } = await signUp(`${name}@example.com`, 'praise1234', name);
    assert.deepEqual((await reportPerson(token)).body, { reported: true, person: true });
  }
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Odo%20Yewu&artist=Joe%20Mettle')).body.found, true);
  const yaw = await signUp('yaw@example.com', 'praise1234', 'Yaw');
  await reportPerson(yaw.token);
  // all of that person's lyrics are hidden now, not only the reported ones
  assert.equal((await call(lyrics.GET, '/api/lyrics?title=Odo%20Yewu&artist=Joe%20Mettle')).body.found, false);
});

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

test('YouTube rules: privacy policy and terms say Selah uses YouTube API Services, with the required links', async () => {
  const policy = await (await privacy.GET()).text();
  assert.match(policy, /YouTube API Services/);
  assert.match(policy, /https:\/\/www\.youtube\.com\/t\/terms/);
  assert.match(policy, /https:\/\/policies\.google\.com\/privacy/);
  assert.match(policy, /refreshed at least every 30 days/);

  const terms = await (await termsPage.GET()).text();
  assert.match(terms, /agree to be\s+bound by the <a href="https:\/\/www\.youtube\.com\/t\/terms">YouTube Terms of Service/);
  // Google Play's rules for things users share: rules to accept, what is not allowed, reporting, blocking
  assert.match(terms, /You must accept these rules before you share/);
  assert.match(terms, /hateful/);
  assert.match(terms, /report shared lyrics or the person who shared them/);
  assert.match(terms, /hide everything\s+from a person/);
});

test('front page says the server is running and whether the database is connected', async () => {
  const ready = await (await home.GET()).text();
  assert.match(ready, /Selah server is running ✓/);
  assert.match(ready, /connected ✓/);

  useSqlForTests(null);
  useAuthDatabaseForTests(null);
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  const waiting = await (await home.GET()).text();
  assert.match(waiting, /almost ready/);
  assert.match(waiting, /Create Database › Neon/);
  if (saved) process.env.DATABASE_URL = saved;
});

test('browsers may call it (CORS preflight)', async () => {
  const res = await backup.OPTIONS(request('/api/backup', { method: 'OPTIONS' }));
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});
