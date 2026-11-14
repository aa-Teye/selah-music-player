// GET /privacy (also /api/privacy) — Selah's privacy policy, in plain words.
// Review it before publishing, and set SUPPORT_EMAIL in Vercel.
import { html } from '../lib/http.js';
import { page, supportLine } from '../lib/pages.js';

const UPDATED = '14 November 2026';

export function GET() {
  return html(
    page(
      'Privacy policy',
      `<h1>Privacy policy</h1>
<p class="muted">Selah music player · last updated ${UPDATED}</p>

<p>Selah is a music player for your own songs, worship videos and daily devotions.
We collect as little as possible. There are no ads, no tracking and we never sell anything about you.</p>

<h2>What stays on your phone</h2>
<p>Your music files, playlists, loved songs, listening history and the lyrics you type stay on your phone.
Selah never uploads your music files.</p>

<h2>If you create an account</h2>
<p>We keep your name, your email address and a protected (hashed) version of your password, to log you in
and to send you a code if you forget your password.</p>

<h2>If you use Premium backup</h2>
<p>When you back up, we keep your playlists, loved songs, play counts and the lyrics you typed, together with
the title, artist and length of those songs, so they can be restored on another phone. Not the music itself.</p>

<h2>Lyrics</h2>
<p>To find lyrics, Selah sends the song's title, artist and length to the free LRCLIB lyrics library
(lrclib.net) and to Selah's own server. Lyrics you choose to share are shown to other Selah users with the
song name only; your name and email are never shown. Reports about shared lyrics, and the people you hide,
are kept so the community rules in our <a href="/terms">terms of use</a> can be enforced.</p>

<h2>YouTube</h2>
<p>Selah uses YouTube API Services to search for and play videos. Your searches are sent through Selah's server to
YouTube; the server keeps recent search results for up to a day, not linked to you, so the same search does not
have to be repeated. Videos play in YouTube's own player. The videos you save (their title, channel and picture)
are kept on your phone and, if you back up, in your account; their details are refreshed at least every 30 days.
By using Selah's YouTube features you agree to the
<a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>, and
<a href="https://policies.google.com/privacy">Google's Privacy Policy</a> applies.</p>

<h2>Pictures and updates</h2>
<p>Songs without their own picture show photos from Unsplash, loaded from images.unsplash.com. Small app updates
are downloaded from Expo (expo.dev). These services see your phone's internet address, as any website does.</p>

<h2>Payments</h2>
<p>Premium is paid through Google Play (or the App Store on iPhone). We use RevenueCat to check whether your
subscription is active. We never see your card details.</p>

<h2>Companies that help run Selah</h2>
<ul>
  <li>Vercel: runs Selah's server</li>
  <li>Neon: stores accounts, backups and shared lyrics</li>
  <li>Google (YouTube API Services): video search and playback</li>
  <li>Expo: delivers app updates</li>
  <li>RevenueCat: checks Premium subscriptions</li>
  <li>Google (Gmail), Resend or Brevo: sends password reset emails</li>
</ul>

<h2>Deleting your data</h2>
<p>In the app: the account button at the top › Delete my account. Your account, backup and shared lyrics
are deleted straight away. See <a href="/delete-account">how to delete your account</a> for other ways.
Deleting your account does not cancel a Google Play subscription: cancel it in Google Play.</p>

<h2>Children</h2>
<p>Selah is not directed at children under 13, and we do not knowingly collect their information.</p>

<h2>Questions</h2>
<p>To ask about your data, ${supportLine()}.</p>`
    )
  );
}
