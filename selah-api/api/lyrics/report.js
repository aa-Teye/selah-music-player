// POST /api/lyrics/report  { id }  (Authorization: Bearer <backup code>)
// Wrong or offensive lyrics: after 3 different phones report them, they are hidden.
import { json, preflight, readJson, codeFrom, fingerprint, endpoint, HttpError } from '../../lib/http.js';
import { reportLyrics } from '../../lib/db.js';

export const POST = endpoint(async (request) => {
  const device = await fingerprint(codeFrom(request));
  const body = await readJson(request, 1024);
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Which lyrics? Send { id }');
  return json(200, { reported: await reportLyrics(id, device) });
});

export const OPTIONS = preflight;
