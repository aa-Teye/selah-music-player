// Sends the 6-digit codes (forgot password). Works with any one of:
//   Gmail:   GMAIL_USER + GMAIL_APP_PASSWORD   (your Gmail address and a Google "App password"; free, ~500 a day)
//   Resend:  RESEND_API_KEY + EMAIL_FROM       (needs your own domain, e.g. "Selah <hello@yourdomain.com>")
//   Brevo:   BREVO_API_KEY  + EMAIL_FROM       (can send from one confirmed address, no domain needed)
import nodemailer from 'nodemailer';

let testSender = null;
let makeTransport = (options) => nodemailer.createTransport(options);
let gmail = null;

/** Tests capture the emails instead of sending them */
export function useEmailSenderForTests(fn) {
  testSender = fn;
}

/** Tests replace the Gmail connection with a fake one */
export function useMailTransportForTests(factory) {
  makeTransport = factory;
  gmail = null;
}

export function emailProvider() {
  if (testSender) return 'test';
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return 'gmail';
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

function gmailConnection() {
  if (!gmail) {
    gmail = makeTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER.trim(),
        // Google shows App passwords in groups of four ("abcd efgh ijkl mnop"): the spaces don't belong
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '')
      }
    });
  }
  return gmail;
}

export async function sendCodeEmail({ to, code, type }) {
  const { subject, text, html } = message(code, type);
  const provider = emailProvider();
  if (provider === 'test') return testSender({ to, code, type, subject, text });
  if (!provider) throw new Error('Email is not set up yet: add GMAIL_USER and GMAIL_APP_PASSWORD (or Resend / Brevo)');

  if (provider === 'gmail') {
    // Gmail only sends from your own address, so "From" is always your Gmail (shown with the name Selah)
    const from = { name: 'Selah', address: process.env.GMAIL_USER.trim() };
    try {
      await gmailConnection().sendMail({ from, to, subject, text, html });
    } catch (err) {
      gmail = null; // try a fresh connection next time
      throw new Error(`The email could not be sent through Gmail (${err && err.code ? err.code : 'error'})`);
    }
    return;
  }

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
