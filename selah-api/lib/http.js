// Small helpers shared by every endpoint.

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024; // 2 MB of playlists, counts and lyrics is plenty

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type'
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS }
  });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function readJson(request, limit = MAX_BACKUP_BYTES) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > limit) throw new HttpError(413, 'Too large');
  try {
    const value = JSON.parse(text || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not an object');
    return value;
  } catch {
    throw new HttpError(400, 'Send a JSON object');
  }
}

// A backup code looks like ABCD-EFGH-JKLM-NPQR-STUV (no I, O, 0 or 1 so it is easy to read out).
// It works like a password: the server only keeps its fingerprint, never the code itself.
export const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){4}$/;

export function codeFrom(request) {
  const header = request.headers.get('authorization') || '';
  const code = header.replace(/^Bearer\s+/i, '').trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) throw new HttpError(401, 'Missing or invalid backup code');
  return code;
}

export async function fingerprint(code) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`selah:${code}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Wraps an endpoint so errors become clear JSON answers */
export function endpoint(fn) {
  return async (request) => {
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.message });
      console.error('selah-api error:', err);
      return json(500, { error: 'Something went wrong on the server' });
    }
  };
}
