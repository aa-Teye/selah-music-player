// GET /terms (also /api/terms) — Selah's terms of use, in plain words.
// Includes the community rules for shared lyrics (Google Play's user-generated content policy)
// and the YouTube statement that YouTube API Services require.
import { html } from '../lib/http.js';
import { page, supportLine } from '../lib/pages.js';

const UPDATED = '15 November 2026';

export function GET() {
  return html(
    page(
      'Terms of use',
      `<h1>Terms of use</h1>
<p class="muted">Selah music player · last updated ${UPDATED}</p>

<p>Selah is a free music player for your own songs, worship videos and daily devotions. By using Selah you agree
to these terms. Selah is for people aged 13 and over.</p>

<h2>YouTube</h2>
<p>Selah uses YouTube API Services to find and play videos. By using Selah's YouTube features, you agree to be
bound by the <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>. Google's
<a href="https://policies.google.com/privacy">Privacy Policy</a> also applies to them. Videos always play in
YouTube's own player; Selah never downloads them.</p>

<h2>Your account</h2>
<p>An account is optional. Keep your password to yourself. You can delete your account and everything stored with
it at any time, in the app or on the <a href="/delete-account">delete account page</a>.</p>

<h2>Sharing lyrics: community rules</h2>
<p>When you share lyrics, other Selah users can read them. You must accept these rules before you share.
Share only the words of the song. Do not share anything that is:</p>
<ul>
  <li>hateful, or attacks people for who they are</li>
  <li>harassing, bullying or threatening</li>
  <li>sexual or violent</li>
  <li>illegal, or encourages illegal or dangerous acts</li>
  <li>spam, advertising or links</li>
  <li>someone's personal information</li>
  <li>not the lyrics of the song</li>
</ul>
<p>Anyone can report shared lyrics or the person who shared them, right from the lyrics, and can hide everything
from a person. Lyrics reported by several people are hidden automatically. We review reports, remove lyrics that
break these rules, and close the accounts of people who keep breaking them.</p>

<h2>Songs, lyrics and copyright</h2>
<p>The songs on your phone are yours; Selah only plays them and never uploads them. Videos, music and pictures
from YouTube belong to their owners and are shown through YouTube's own player. Lyrics belong to their writers.
Lyrics found by Selah come from the community library <a href="https://lrclib.net">LRCLIB</a>; lyrics you share
stay yours, and you let Selah show them to other Selah users. If you own a song, a lyric or a picture and want it
removed, ${supportLine()}. We remove it promptly, and we close the accounts of people who keep sharing what is
not theirs to share.</p>

<h2>Ending your use</h2>
<p>You can stop using Selah and delete your account at any time. We may suspend or close an account that breaks
these terms or harms other people. If Selah is ever shut down, we will say so in the app first.</p>

<h2>Stores</h2>
<p>These terms are between you and Selah. Google, Apple and the other app stores are not responsible for Selah
or for helping with it; questions go to us at the address below.</p>

<h2>Premium</h2>
<p>If Selah Premium is offered, it is paid through Google Play (or the App Store on iPhone), renews automatically
and can be cancelled there at any time.</p>

<h2>No guarantee</h2>
<p>We work hard to keep Selah running well, but it is provided as it is, without guarantees.</p>

<h2>Changes and questions</h2>
<p>If these terms change, the new version will be on this page. Read our <a href="/privacy">privacy policy</a>.
For questions or to report a problem, ${supportLine()}.</p>`
    )
  );
}
