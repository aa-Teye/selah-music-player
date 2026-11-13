// GET /delete-account (also /api/delete-account) — how to delete a Selah account.
// Google Play requires this page for apps where people can create an account.
import { html } from '../lib/http.js';
import { page, supportLine } from '../lib/pages.js';

export function GET() {
  return html(
    page(
      'Delete your account',
      `<h1>Delete your Selah account</h1>
<p class="muted">Selah music player</p>

<div class="card">
<h2>In the app (fastest)</h2>
<ol>
  <li>Open Selah and tap the menu (☰) at the top right.</li>
  <li>Tap <b>Account &amp; Backup</b>.</li>
  <li>Tap <b>Delete my account</b> and enter your password.</li>
</ol>
</div>

<div class="card">
<h2>Without the app</h2>
<p>From the email address of your account, ${supportLine()} with the subject
<b>"Delete my Selah account"</b>. We will delete it within 7 days and reply to confirm.</p>
</div>

<h2>What gets deleted</h2>
<p>Your account (name, email, password), your cloud backup (playlists, loved songs, play counts and typed
lyrics) and the lyrics you shared. Nothing is kept.</p>

<h2>Your subscription</h2>
<p>Deleting your account does not cancel Selah Premium. Cancel it in Google Play:
Play Store › your profile › Payments &amp; subscriptions › Subscriptions.</p>

<p class="muted">Songs on your phone are never touched.</p>`
    )
  );
}
