// An anonymous code for the person who shared lyrics: the same for all their lyrics, with no
// name or email in it. Lets people hide everything from someone without anyone seeing who it is.
import { createHash } from 'node:crypto';

export function authorCode(userId) {
  const salt = process.env.BETTER_AUTH_SECRET || process.env.DATABASE_URL || 'selah';
  return createHash('sha256').update(`selah-author:${salt}:${userId}`).digest('hex').slice(0, 16);
}

/** "a1b2…,c3d4…" from the app → a set of valid codes (at most 100) */
export function hiddenAuthors(param) {
  return new Set(
    String(param || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^[a-f0-9]{16}$/.test(s))
      .slice(0, 100)
  );
}
