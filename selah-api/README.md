# selah-api

Selah's small cloud service, made for **Vercel** (serverless functions + a Neon Postgres database).

It does two things:

1. **Backup & restore.** Playlists, loved songs, play counts and lyrics people typed.
   There are no accounts: each phone has a private backup code (`ABCD-EFGH-JKLM-NPQR-STUV`).
   The server only stores a fingerprint (SHA-256) of the code, never the code itself.
   Songs are never uploaded; only their names, so they can be found again on a new phone.
2. **Shared lyrics.** When someone types lyrics for a song that the free LRCLIB library doesn't have,
   they can share them with other Selah users. Lyrics reported by 3 different phones are hidden.

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/health` | `{ ok, database }`: is the service up and the database connected? |
| GET | `/api/backup` | Your backup (header `Authorization: Bearer <code>`) |
| PUT | `/api/backup` | Save your backup: `{ data: { ... } }` (max 2 MB) |
| DELETE | `/api/backup` | Delete your backup |
| GET | `/api/lyrics?title=&artist=&duration=` | Lyrics shared by Selah users for a song |
| POST | `/api/lyrics` | Share lyrics: `{ title, artist, duration, text, synced }` (needs a code) |
| POST | `/api/lyrics/report` | Report wrong or offensive lyrics: `{ id }` (needs a code) |

The tables are created automatically on first use (see `lib/db.js`).

## Deploy on Vercel

1. In Vercel: **Add New… → Project** and import the GitHub repo `aa-Teye/selah-music-player`.
2. Set **Root Directory** to `selah-api` and **Framework Preset** to **Other** (no build command).
3. Deploy.
4. In the project: **Storage → Create Database → Neon (Postgres)**, then connect it to this project
   (all environments). Vercel adds `DATABASE_URL` for you. Redeploy once.
5. Open `https://<your-project>.vercel.app/api/health`. You should see `"database": "ok"`.
6. Put that address in the app: `mobile/app.json` → `expo.extra.selahApiUrl`
   (for example `"https://selah-api.vercel.app"`). The Backup & Restore menu appears in the app.

## Run the tests

```bash
npm install
npm test
```

The tests use an in-memory Postgres (pg-mem), so no database or internet is needed.
