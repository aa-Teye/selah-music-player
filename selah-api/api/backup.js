// Cloud backup of playlists, loved songs, play counts and typed lyrics: a Selah Premium feature.
// Every request needs a logged-in account:  Authorization: Bearer <login token>
//
//   GET    /api/backup   → { savedAt, data }   (Premium; 404 if there is no backup yet)
//   PUT    /api/backup   { data } → { savedAt, size }   (Premium)
//   DELETE /api/backup   → { deleted }   (anyone: your data is always yours to delete)
import { json, preflight, readJson, endpoint, HttpError, MAX_BACKUP_BYTES } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { requirePremium } from '../lib/premium.js';
import { getBackup, putBackup, deleteBackup } from '../lib/db.js';

export const GET = endpoint(async (request) => {
  const user = await requireUser(request);
  await requirePremium(user.id);
  const row = await getBackup(user.id);
  if (!row) return json(404, { error: 'There is no backup in your account yet' });
  return json(200, { savedAt: new Date(row.updated_at).toISOString(), data: row.data });
});

export const PUT = endpoint(async (request) => {
  const user = await requireUser(request);
  await requirePremium(user.id);
  const body = await readJson(request, MAX_BACKUP_BYTES);
  if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
    throw new HttpError(400, 'Send { data: { ... } }');
  }
  const size = new TextEncoder().encode(JSON.stringify(body.data)).length;
  const savedAt = await putBackup(user.id, body.data, size);
  return json(200, { savedAt: new Date(savedAt).toISOString(), size });
});

export const DELETE = endpoint(async (request) => {
  const user = await requireUser(request);
  return json(200, { deleted: await deleteBackup(user.id) });
});

export const OPTIONS = preflight;
