// ═════════════════════════════════════════════════════════════════════════
//  SELAH — TALKING TO SELAH'S SERVER (selah-api on Vercel)
//  • The server address comes from app.json (expo.extra.selahApiUrl).
//    While it is empty, every online feature stays hidden.
//  • When you log in, the server gives a login token. It is kept in the
//    phone's secure storage (Keychain / Keystore) and sent with requests
//    that need your account: "Authorization: Bearer <token>".
// ═════════════════════════════════════════════════════════════════════════
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'selah_login_token';
export const APP_ORIGIN = 'selah://';

export class CloudError extends Error {
  constructor(kind, message, status, code) {
    super(message);
    // 'not-configured' | 'offline' | 'logged-out' | 'premium' | 'not-found' | 'http'
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

// ── Where the server lives ──────────────────────────────────────────────────
let urlForTests = null;
export function setApiUrlForTests(url) {
  urlForTests = url;
}
export function apiUrl() {
  const url = urlForTests ?? Constants.expoConfig?.extra?.selahApiUrl ?? '';
  return String(url || '').trim().replace(/\/+$/, '');
}
export const isCloudReady = () => Boolean(apiUrl());

// ── Login token ─────────────────────────────────────────────────────────────
let tokenCache; // undefined = not read yet
const listeners = new Set();

export async function getToken() {
  if (tokenCache === undefined) {
    try {
      tokenCache = (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
    } catch {
      tokenCache = null;
    }
  }
  return tokenCache;
}

export async function setToken(token) {
  tokenCache = token || null;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
  listeners.forEach((fn) => fn(Boolean(token)));
}

export const clearToken = () => setToken(null);

/** Called with true/false whenever you log in or out (also when the server says the login ended) */
export function onLoginChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** For tests: forget the cached token */
export function resetTokenCacheForTests() {
  tokenCache = undefined;
  listeners.clear();
}

// ── Requests ────────────────────────────────────────────────────────────────
const header = (res, name) => (res && res.headers && typeof res.headers.get === 'function' ? res.headers.get(name) : null);

/**
 * Sends a request to Selah's server and returns the JSON answer.
 * auth: true sends your login token. A new token in the answer is saved automatically.
 */
export async function call(path, { method = 'GET', body, auth = false, timeout = 15000 } = {}) {
  const base = apiUrl();
  if (!base) throw new CloudError('not-configured', 'Selah cloud is not set up yet.');
  const token = auth ? await getToken() : null;
  if (auth && !token) throw new CloudError('logged-out', 'Please log in to your Selah account.', 401);

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        // Phones also keep the server's login cookie and send it automatically; the server only
        // accepts cookie requests that say where they come from, so Selah always says "selah://"
        Origin: APP_ORIGIN,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
    });
  } catch {
    throw new CloudError('offline', 'Could not reach Selah. Check your internet connection and try again.');
  } finally {
    if (timer) clearTimeout(timer);
  }

  let data = {};
  try {
    data = (await res.json()) || {};
  } catch {}

  if (!res.ok) {
    const message = data.error || data.message || `Selah answered with an error (${res.status}).`;
    if (res.status === 401 && auth) {
      await clearToken(); // the login ended (logged out elsewhere, password changed, account deleted)
      throw new CloudError('logged-out', 'Please log in to your Selah account again.', 401, data.code);
    }
    const kind = res.status === 402 ? 'premium' : res.status === 404 ? 'not-found' : 'http';
    throw new CloudError(kind, message, res.status, data.code);
  }

  const newToken = header(res, 'set-auth-token') || (data && typeof data.token === 'string' && data.user ? data.token : null);
  if (newToken) await setToken(newToken);
  return data;
}
