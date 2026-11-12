// Backup & restore of your playlists, loved songs, play counts and lyrics.
// Every request carries the phone's backup code:  Authorization: Bearer ABCD-EFGH-JKLM-NPQR-STUV
//
//   GET    /api/backup   → { savedAt, data }   (404 if there is no backup yet)
//   PUT    /api/backup   { data }  → { savedAt, size }
//   DELETE /api/backup   → { deleted }
import { json, preflight, readJson, codeFrom, fingerprint, endpoint, HttpError, MAX_BACKUP_BYTES } from '../lib/http.js';
import { getBackup, putBackup, deleteBackup } from '../lib/db.js';

export const GET = endpoint(async (request) => {
  const id = await fingerprint(codeFrom(request));
  const row = await getBackup(id);
  if (!row) return json(404, { error: 'No backup for this code' });
  return json(200, { savedAt: new Date(row.updated_at).toISOString(), data: row.data });
});

export const PUT = endpoint(async (request) => {
  const id = await fingerprint(codeFrom(request));
  const body = await readJson(request, MAX_BACKUP_BYTES);
  if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
    throw new HttpError(400, 'Send { data: { ... } }');
  }
  const size = new TextEncoder().encode(JSON.stringify(body.data)).length;
  const savedAt = await putBackup(id, body.data, size);
  return json(200, { savedAt: new Date(savedAt).toISOString(), size });
});

export const DELETE = endpoint(async (request) => {
  const id = await fingerprint(codeFrom(request));
  return json(200, { deleted: await deleteBackup(id) });
});

export const OPTIONS = preflight;
