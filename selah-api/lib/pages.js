// Simple public web pages (Google Play asks for a privacy policy and an account-deletion page).
// Set SUPPORT_EMAIL in Vercel so people can reach you from these pages.

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export function supportLine() {
  const email = (process.env.SUPPORT_EMAIL || '').trim();
  if (email) {
    const safe = escapeHtml(email);
    return `email <a href="mailto:${safe}">${safe}</a>`;
  }
  return 'contact us through the Selah page on Google Play ("Developer contact")';
}

export function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Selah</title>
<style>
  :root { color-scheme: light dark; --bg: #f8f9fa; --text: #111418; --muted: #5b6270; --card: #ffffff; --line: #e5e7eb; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0b0d12; --text: #f3f4f6; --muted: #a3a9b5; --card: #151922; --line: #272d39; } }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 28px 18px 60px; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 19px; margin: 28px 0 6px; }
  p, li { color: var(--text); }
  .muted { color: var(--muted); font-size: 14px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; margin: 14px 0; }
  a { color: inherit; }
</style>
</head>
<body><main>${body}</main></body>
</html>`;
}
