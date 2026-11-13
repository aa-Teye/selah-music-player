// Sends the 6-digit codes (forgot password). Works with either:
//   Resend:  RESEND_API_KEY + EMAIL_FROM   (needs your own domain, e.g. "Selah <hello@yourdomain.com>")
//   Brevo:   BREVO_API_KEY  + EMAIL_FROM   (can send from one confirmed address, no domain needed)
let testSender = null;

/** Tests capture the emails instead of sending them */
export function useEmailSenderForTests(fn) {
  testSender = fn;
}

export function emailProvider() {
  if (testSender) return 'test';
  if (!process.env.EMAIL_FROM) return null;
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.BREVO_API_KEY) return 'brevo';
  return null;
}

const SUBJECTS = {
  'forget-password': 'Your Selah password reset code',
  'email-verification': 'Your Selah confirmation code',
  'sign-in': 'Your Selah sign-in code',
  'change-email': 'Confirm your new email for Selah'
};

function message(code, type) {
  const subject = SUBJECTS[type] || 'Your Selah code';
  const text = `Your Selah code is ${code}\n\nIt works for 10 minutes. If you didn't ask for it, you can ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;color:#111">
<p>Your Selah code is</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p>
<p>It works for 10 minutes. If you didn't ask for it, you can ignore this email.</p>
</div>`;
  return { subject, text, html };
}

function parseFrom(from) {
  const m = String(from).match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || 'Selah', email: m[2] } : { name: 'Selah', email: String(from).trim() };
}

export async function sendCodeEmail({ to, code, type }) {
  const { subject, text, html } = message(code, type);
  const provider = emailProvider();
  if (provider === 'test') return testSender({ to, code, type, subject, text });
  if (!provider) throw new Error('Email is not set up yet: add RESEND_API_KEY or BREVO_API_KEY, and EMAIL_FROM');
  const from = process.env.EMAIL_FROM;
  let res;
  if (provider === 'resend') {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html })
    });
  } else {
    res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender: parseFrom(from), to: [{ email: to }], subject, textContent: text, htmlContent: html })
    });
  }
  if (!res.ok) throw new Error(`The email could not be sent (${provider} answered ${res.status})`);
}
