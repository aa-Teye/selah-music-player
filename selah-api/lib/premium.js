// Is this person a Selah Premium member?
//   1. Premium gifted by hand (table premium_gifts)
//   2. PREMIUM_MODE=open  → everyone gets Premium (handy while testing, before payments are set up)
//   3. A Google Play / App Store subscription, checked with RevenueCat
//      (REVENUECAT_SECRET_KEY, and REVENUECAT_ENTITLEMENT, "premium" by default)
import { getGift } from './db.js';
import { HttpError } from './http.js';

const FREE = { active: false, until: null, source: null };

export function premiumSetup() {
  if (process.env.PREMIUM_MODE === 'open') return 'open to everyone';
  return process.env.REVENUECAT_SECRET_KEY ? 'payments ready' : 'payments not set up';
}

async function fromStore(userId) {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) return FREE;
  const entitlement = process.env.REVENUECAT_ENTITLEMENT || 'premium';
  let res;
  try {
    res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }
    });
  } catch {
    throw new HttpError(502, 'Could not check your Premium membership. Please try again.');
  }
  if (!res.ok) throw new HttpError(502, 'Could not check your Premium membership. Please try again.');
  const body = await res.json();
  const e = body && body.subscriber && body.subscriber.entitlements && body.subscriber.entitlements[entitlement];
  if (!e) return FREE;
  const now = Date.now();
  const expires = e.expires_date ? Date.parse(e.expires_date) : null;
  const grace = e.grace_period_expires_date ? Date.parse(e.grace_period_expires_date) : null;
  const active = expires === null || expires > now || (grace !== null && grace > now);
  return { active, until: e.expires_date || null, source: 'store' };
}

export async function premiumStatus(userId) {
  const gift = await getGift(userId);
  if (gift && (!gift.until || new Date(gift.until).getTime() > Date.now())) {
    return { active: true, until: gift.until ? new Date(gift.until).toISOString() : null, source: 'gift' };
  }
  if (process.env.PREMIUM_MODE === 'open') return { active: true, until: null, source: 'open' };
  return fromStore(userId);
}

export async function requirePremium(userId) {
  const status = await premiumStatus(userId);
  if (!status.active) throw new HttpError(402, 'Cloud backup is part of Selah Premium', { premium: false });
  return status;
}
