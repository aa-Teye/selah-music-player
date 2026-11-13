# selah-api

Selah's small server, made for **Vercel** (serverless functions) with a **Neon Postgres** database.

It does four things:

1. **Accounts.** Sign up and log in with email and password, a 6-digit code by email when you forget your
   password, and "delete my account". Built with [Better Auth](https://better-auth.com) running on this server.
   The app keeps a login token in the phone's secure storage and sends it as `Authorization: Bearer <token>`.
2. **Selah Premium.** Cloud backup and restore are Premium. Premium comes from a Google Play / App Store
   subscription (checked with RevenueCat), a gift (table `premium_gifts`), or `PREMIUM_MODE=open` while testing.
3. **Backup & restore.** Playlists, loved songs, play counts and lyrics people typed, with each song's name so it
   can be found on another phone. Songs themselves are never uploaded.
4. **Shared lyrics.** Lyrics typed by one Selah user help everyone with the same song. Anyone can read them;
   sharing and reporting need a (free) account. Lyrics reported by 3 different people are hidden.

It also serves the two pages Google Play asks for: `/privacy` and `/delete-account`.

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/health` | What is set up: database, accounts, email, premium |
| POST | `/api/auth/sign-up/email` | `{ name, email, password }` (8+ characters) |
| POST | `/api/auth/sign-in/email` | `{ email, password }`; the token is in the `set-auth-token` header |
| POST | `/api/auth/sign-out` | Log out |
| POST | `/api/auth/email-otp/request-password-reset` | `{ email }`: sends a 6-digit code |
| POST | `/api/auth/email-otp/reset-password` | `{ email, otp, password }` |
| POST | `/api/auth/delete-user` | `{ password }`: deletes the account, backup and shared lyrics |
| GET | `/api/me` | Your account and Premium status |
| GET / PUT / DELETE | `/api/backup` | Your backup (GET and PUT need Premium) |
| GET | `/api/lyrics?title=&artist=&duration=` | Lyrics shared by Selah users |
| POST | `/api/lyrics` | Share lyrics: `{ title, artist, duration, text, synced }` (needs an account) |
| POST | `/api/lyrics/report` | Report lyrics: `{ id }` (needs an account) |

The app sends `Origin: selah://` with every request. Phones keep the server's cookie and send it automatically,
and requests that carry a cookie must say where they come from.

All tables are created automatically on first use.

## Deploy on Vercel

1. **Add New… → Project**, import the GitHub repo `aa-Teye/selah-music-player`.
2. **Root Directory**: `selah-api`. **Framework Preset**: **Other**. Deploy.
3. **Storage → Create Database → Neon**, connect it to the project (all environments). Vercel adds `DATABASE_URL`.
4. **Settings → Environment Variables** (then redeploy):

| Variable | Needed for | Value |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Accounts (recommended) | Any long random text, 32+ characters |
| `EMAIL_FROM` | Forgot-password emails | `Selah <hello@yourdomain.com>`, or your confirmed Brevo sender address |
| `RESEND_API_KEY` *or* `BREVO_API_KEY` | Forgot-password emails | From resend.com (needs a domain) or brevo.com (one confirmed sender is enough) |
| `REVENUECAT_SECRET_KEY` | Premium payments | RevenueCat › Project settings › API keys › **Secret** key |
| `REVENUECAT_ENTITLEMENT` | Premium payments | Only if your entitlement is not called `premium` |
| `PREMIUM_MODE` | Testing only | `open` gives everyone Premium. Remove it before launch |
| `SUPPORT_EMAIL` | `/privacy`, `/delete-account` | The email people can write to |

5. Open `https://<your-project>.vercel.app/api/health` and check each line.
6. Put that address in the app: `mobile/app.json` → `expo.extra.selahApiUrl`. Put RevenueCat's **public** keys in
   `expo.extra.revenueCatAndroidKey` / `revenueCatIosKey`.

## Gift Premium to someone

In Neon's SQL editor (Vercel › Storage › your database › Open in Neon):

```sql
INSERT INTO premium_gifts (user_id, note)
SELECT id, 'tester' FROM "user" WHERE email = 'someone@example.com';
```

Add `until` (for example `now() + interval '30 days'`) for a gift that ends.

## Run the tests

```bash
npm install
npm test
```

No database or internet needed: accounts run in memory, Selah's tables use an in-memory Postgres (pg-mem),
and one test runs everything on a real Postgres inside Node (PGlite).
