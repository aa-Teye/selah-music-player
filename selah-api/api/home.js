// GET /  — a simple front page, so opening the server's address shows that it is running
// and whether the database is connected.
import { db } from '../lib/db.js';
import { getAuth } from '../lib/auth.js';
import { page } from '../lib/pages.js';

async function check(fn) {
  try {
    await fn();
    return { ok: true, text: 'connected ✓' };
  } catch (err) {
    if (err && err.status === 503) {
      return { ok: false, text: 'not connected yet: in Vercel, open Storage › Create Database › Neon, connect it to this project, then Redeploy' };
    }
    return { ok: false, text: 'problem: check the Neon database connection in Vercel' };
  }
}

export async function GET() {
  const database = await check(db);
  const accounts = database.ok ? await check(getAuth) : database;
  const ready = database.ok && accounts.ok;
  const body = page(
    'Selah server',
    `<h1>${ready ? 'Selah server is running ✓' : 'Selah server is running, almost ready'}</h1>
<div class="card">
<p><b>Database:</b> ${database.text}</p>
<p><b>Accounts:</b> ${accounts.ok ? 'ready ✓' : 'waiting for the database'}</p>
</div>
<p>This is the server for the Selah music player app. Put this page's address in the app's settings
(<code>selahApiUrl</code>).</p>
<ul>
  <li><a href="/api/health">Health check</a></li>
  <li><a href="/privacy">Privacy policy</a></li>
  <li><a href="/delete-account">Delete your account</a></li>
</ul>`
  );
  return new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
