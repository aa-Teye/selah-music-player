// GET /api/health — is everything set up? Open it in a browser after each setup step.
import { json, preflight } from '../lib/http.js';
import { db } from '../lib/db.js';
import { getAuth } from '../lib/auth.js';
import { emailProvider } from '../lib/email.js';
import { premiumSetup } from '../lib/premium.js';

export async function GET() {
  let database = 'ok';
  let accounts = 'ok';
  try {
    await db();
  } catch (err) {
    database = err && err.status === 503 ? 'not connected' : 'error';
  }
  try {
    await getAuth();
  } catch (err) {
    accounts = err && err.status === 503 ? 'not connected' : 'error';
  }
  return json(200, {
    ok: true,
    service: 'selah-api',
    version: 2,
    database,
    accounts,
    email: emailProvider() ? 'ready' : 'not set up',
    premium: premiumSetup()
  });
}

export const OPTIONS = preflight;
