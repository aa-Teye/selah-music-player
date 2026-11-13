// Small helpers shared by every endpoint.

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024; // 2 MB of playlists, counts and lyrics is plenty

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type'
};

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS }
  });
}

export function html(body) {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' }
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

/** Wraps an endpoint so errors become clear JSON answers */
export function endpoint(fn) {
  return async (request) => {
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.message, ...err.extra });
      console.error('selah-api error:', err);
      return json(500, { error: 'Something went wrong on the server' });
    }
  };
}
