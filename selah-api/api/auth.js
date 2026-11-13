// Every account action goes through here (Better Auth), for example:
//   POST /api/auth/sign-up/email                  { name, email, password }
//   POST /api/auth/sign-in/email                  { email, password }
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   POST /api/auth/email-otp/request-password-reset   { email }
//   POST /api/auth/email-otp/reset-password           { email, otp, password }
//   POST /api/auth/delete-user                    { password }
// vercel.json sends every /api/auth/... address to this one function as ?path=...
import { getAuth } from '../lib/auth.js';
import { json, preflight } from '../lib/http.js';

async function handle(request) {
  try {
    const url = new URL(request.url);
    const rest = url.searchParams.get('path');
    url.searchParams.delete('path');
    if (rest !== null && url.pathname.replace(/\/+$/, '') === '/api/auth') url.pathname = `/api/auth/${rest}`;
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const forwarded = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: hasBody ? await request.arrayBuffer() : undefined
    });
    const auth = await getAuth();
    return await auth.handler(forwarded);
  } catch (err) {
    if (err && err.status) return json(err.status, { error: err.message });
    console.error('selah-api auth error:', err);
    return json(500, { error: 'Something went wrong on the server' });
  }
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = preflight;
