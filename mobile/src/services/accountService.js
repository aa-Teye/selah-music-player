// ═════════════════════════════════════════════════════════════════════════
//  SELAH — YOUR ACCOUNT
//  Sign up, log in, forgot password (6-digit code by email), log out and
//  delete account, on Selah's server. Errors come back in plain words.
// ═════════════════════════════════════════════════════════════════════════
import { call, clearToken, getToken, isCloudReady, CloudError } from './apiClient';

const MESSAGES = {
  INVALID_EMAIL_OR_PASSWORD: 'That email or password is not right.',
  USER_ALREADY_EXISTS: 'There is already an account with this email. Log in instead.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'There is already an account with this email. Log in instead.',
  PASSWORD_TOO_SHORT: 'Use at least 8 characters for your password.',
  PASSWORD_TOO_LONG: 'That password is too long.',
  INVALID_EMAIL: 'Please check the email address.',
  INVALID_OTP: 'That code is not right. Check the email and try again.',
  OTP_EXPIRED: 'That code has expired. Ask for a new one.',
  TOO_MANY_ATTEMPTS: 'Too many tries with that code. Ask for a new one.',
  INVALID_PASSWORD: 'That password is not right.'
};

function friendly(err) {
  if (!(err instanceof CloudError)) return new CloudError('http', 'Something went wrong. Please try again.');
  if (err.code && MESSAGES[err.code]) return new CloudError(err.kind, MESSAGES[err.code], err.status, err.code);
  if (err.status === 429) return new CloudError('http', 'Too many tries. Please wait a minute and try again.', 429);
  return err;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (s) => EMAIL.test(String(s || '').trim());
const cleanEmail = (s) => String(s || '').trim().toLowerCase();

function check(condition, message) {
  if (!condition) throw new CloudError('input', message);
}

export async function signUp({ name, email, password }) {
  check(String(name || '').trim(), 'Please enter your name.');
  check(isEmail(email), 'Please check the email address.');
  check(String(password || '').length >= 8, 'Use at least 8 characters for your password.');
  try {
    const res = await call('/api/auth/sign-up/email', {
      method: 'POST',
      body: { name: String(name).trim(), email: cleanEmail(email), password }
    });
    return res.user;
  } catch (err) {
    throw friendly(err);
  }
}

export async function logIn({ email, password }) {
  check(isEmail(email), 'Please check the email address.');
  check(password, 'Please enter your password.');
  try {
    const res = await call('/api/auth/sign-in/email', { method: 'POST', body: { email: cleanEmail(email), password } });
    return res.user;
  } catch (err) {
    throw friendly(err);
  }
}

export async function logOut() {
  try {
    await call('/api/auth/sign-out', { method: 'POST', auth: true, body: {} });
  } catch {}
  await clearToken();
}

/** { user, premium } for the logged-in person, or null when logged out */
export async function loadAccount() {
  if (!isCloudReady() || !(await getToken())) return null;
  try {
    return await call('/api/me', { auth: true });
  } catch (err) {
    if (err.kind === 'logged-out') return null;
    throw friendly(err);
  }
}

export async function sendResetCode(email) {
  check(isEmail(email), 'Please check the email address.');
  try {
    await call('/api/auth/email-otp/request-password-reset', { method: 'POST', body: { email: cleanEmail(email) } });
  } catch (err) {
    if (err.status >= 500) throw new CloudError('http', "We couldn't send the email right now. Please try again later.");
    throw friendly(err);
  }
}

export async function resetPassword({ email, code, password }) {
  check(isEmail(email), 'Please check the email address.');
  check(/^\d{6}$/.test(String(code || '').trim()), 'Enter the 6-digit code from the email.');
  check(String(password || '').length >= 8, 'Use at least 8 characters for your new password.');
  try {
    await call('/api/auth/email-otp/reset-password', {
      method: 'POST',
      body: { email: cleanEmail(email), otp: String(code).trim(), password }
    });
  } catch (err) {
    throw friendly(err);
  }
}

/** Deletes the account and everything Selah keeps about it (the backup, shared lyrics) */
export async function deleteAccount(password) {
  check(password, 'Enter your password to delete your account.');
  try {
    await call('/api/auth/delete-user', { method: 'POST', auth: true, body: { password } });
  } catch (err) {
    throw friendly(err);
  }
  await clearToken();
}
