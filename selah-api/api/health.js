// GET /api/health — is the service up, and is the database connected?
import { json, preflight } from '../lib/http.js';
import { db } from '../lib/db.js';

export async function GET() {
  let database = 'ok';
  try {
    await db();
  } catch (err) {
    database = err && err.status === 503 ? 'not connected' : 'error';
  }
  return json(200, { ok: true, service: 'selah-api', version: 1, database });
}

export const OPTIONS = preflight;
