// Forgot-password emails through Gmail (with a fake Gmail connection: nothing is really sent).
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { emailProvider, sendCodeEmail, useEmailSenderForTests, useMailTransportForTests } from '../lib/email.js';

const KEYS = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'EMAIL_FROM', 'RESEND_API_KEY', 'BREVO_API_KEY'];
let saved;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  KEYS.forEach((k) => delete process.env[k]);
  useEmailSenderForTests(null);
});

afterEach(() => {
  KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
});

test('no email settings: clearly not set up', async () => {
  assert.equal(emailProvider(), null);
  await assert.rejects(sendCodeEmail({ to: 'a@b.co', code: '123456', type: 'forget-password' }), /not set up yet/);
});

test('Gmail: sends the code from your Gmail, named Selah (App password spaces are fine)', async () => {
  process.env.GMAIL_USER = 'selah.app@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop';
  const made = [];
  const sent = [];
  useMailTransportForTests((options) => {
    made.push(options);
    return { sendMail: async (mail) => sent.push(mail) };
  });

  assert.equal(emailProvider(), 'gmail');
  await sendCodeEmail({ to: 'ama@example.com', code: '482913', type: 'forget-password' });
  assert.deepEqual(made[0], { service: 'gmail', auth: { user: 'selah.app@gmail.com', pass: 'abcdefghijklmnop' } });
  assert.deepEqual(sent[0].from, { name: 'Selah', address: 'selah.app@gmail.com' });
  assert.equal(sent[0].to, 'ama@example.com');
  assert.equal(sent[0].subject, 'Your Selah password reset code');
  assert.match(sent[0].text, /482913/);
  assert.match(sent[0].html, /482913/);
});

test('Gmail refuses (e.g. wrong App password): a clear error, and a fresh try next time', async () => {
  process.env.GMAIL_USER = 'selah.app@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'wrongwrongwrongw';
  let connections = 0;
  useMailTransportForTests(() => {
    connections += 1;
    return {
      sendMail: async () => {
        const err = new Error('Invalid login');
        err.code = 'EAUTH';
        throw err;
      }
    };
  });
  await assert.rejects(sendCodeEmail({ to: 'a@b.co', code: '1', type: 'forget-password' }), /Gmail \(EAUTH\)/);
  await assert.rejects(sendCodeEmail({ to: 'a@b.co', code: '1', type: 'forget-password' }), /Gmail/);
  assert.equal(connections, 2);
});
