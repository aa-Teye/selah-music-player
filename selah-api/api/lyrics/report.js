// POST /api/lyrics/report  { id }  (a logged-in account: Authorization: Bearer <login token>)
// Wrong or offensive lyrics: after 3 different people report them, they are hidden.
import { json, preflight, readJson, endpoint, HttpError } from '../../lib/http.js';
import { requireUser } from '../../lib/auth.js';
import { reportLyrics } from '../../lib/db.js';

export const POST = endpoint(async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request, 1024);
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Which lyrics? Send { id }');
  return json(200, { reported: await reportLyrics(id, user.id) });
});

export const OPTIONS = preflight;
