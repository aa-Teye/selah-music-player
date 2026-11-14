// POST /api/lyrics/report  { id, person? }  (a logged-in account: Authorization: Bearer <login token>)
// Wrong or offensive lyrics: after 3 different people report them, they are hidden.
// person: true also reports the person who shared them: after 3 different people report someone,
// everything they shared is hidden (Google Play's rules for things users share).
import { json, preflight, readJson, endpoint, HttpError } from '../../lib/http.js';
import { requireUser } from '../../lib/auth.js';
import { reportLyrics, reportPerson } from '../../lib/db.js';

export const POST = endpoint(async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request, 1024);
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Which lyrics? Send { id }');
  const reported = await reportLyrics(id, user.id);
  if (body.person !== true) return json(200, { reported });
  return json(200, { reported, person: await reportPerson(id, user.id) });
});

export const OPTIONS = preflight;
