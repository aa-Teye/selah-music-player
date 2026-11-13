// GET /api/me → who is logged in, and their Selah Premium membership
// (header: Authorization: Bearer <login token>)
import { json, preflight, endpoint } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { premiumStatus } from '../lib/premium.js';

export const GET = endpoint(async (request) => {
  const user = await requireUser(request);
  const premium = await premiumStatus(user.id);
  return json(200, {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    premium
  });
});

export const OPTIONS = preflight;
