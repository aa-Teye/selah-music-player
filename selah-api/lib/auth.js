// Selah accounts: sign up and log in with email + password, forgot-password codes by email,
// and "delete my account". Runs Better Auth on this server; accounts are stored in Neon Postgres.
// The phone keeps a login token in its secure storage and sends it as "Authorization: Bearer <token>".
import { createHash } from 'node:crypto';
import pg from 'pg';
import { betterAuth } from 'better-auth';
import { bearer, emailOTP } from 'better-auth/plugins';
import { getMigrations } from 'better-auth/db/migration';
import { HttpError } from './http.js';
import { databaseUrl, deleteUserData } from './db.js';
import { sendCodeEmail } from './email.js';

let instance = null;
let tablesReady = null;
let testDatabase = null;

/** Tests keep accounts in memory instead of Postgres */
export function useAuthDatabaseForTests(database) {
  testDatabase = database;
  instance = null;
  tablesReady = null;
}

// Best: set BETTER_AUTH_SECRET to a long random text in Vercel.
// Without it, a secret is derived from the database address (which is secret too).
function authSecret(url) {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  return createHash('sha256').update(`selah-auth:${url}`).digest('hex');
}

function baseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : 'http://localhost:3000';
}

export function authOptions(database, secret) {
  return {
    appName: 'Selah',
    database,
    secret,
    baseURL: baseURL(),
    basePath: '/api/auth',
    trustedOrigins: ['selah://', 'exp://*'],
    telemetry: { enabled: false },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true
    },
    session: {
      expiresIn: 60 * 60 * 24 * 90, // stay logged in for 90 days
      updateAge: 60 * 60 * 24
    },
    user: {
      deleteUser: {
        enabled: true,
        // remove backups, shared lyrics and reports before the account goes
        beforeDelete: async (user) => {
          await deleteUserData(user.id);
        }
      }
    },
    plugins: [
      bearer(),
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        allowedAttempts: 5,
        disableSignUp: true, // codes are only for "forgot password", never to create accounts
        async sendVerificationOTP({ email, otp, type }) {
          await sendCodeEmail({ to: email, code: otp, type });
        }
      })
    ]
  };
}

export async function getAuth() {
  if (!instance) {
    if (testDatabase) {
      instance = betterAuth(authOptions(testDatabase, 'selah-test-secret-0123456789-abcdefghij'));
    } else {
      const url = databaseUrl();
      if (!url) throw new HttpError(503, 'The database is not connected yet');
      const pool = new pg.Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10000 });
      instance = betterAuth(authOptions(pool, authSecret(url)));
    }
  }
  if (!testDatabase) {
    // create or update the account tables the first time (once per server start)
    if (!tablesReady) {
      tablesReady = getMigrations(instance.options)
        .then(({ runMigrations }) => runMigrations())
        .catch((err) => {
          tablesReady = null;
          throw err;
        });
    }
    await tablesReady;
  }
  return instance;
}

/** The logged-in person, or null */
export async function currentUser(request) {
  if (!request.headers.get('authorization') && !request.headers.get('cookie')) return null;
  const auth = await getAuth();
  const result = await auth.api.getSession({ headers: request.headers });
  return result && result.user ? result.user : null;
}

export async function requireUser(request) {
  const user = await currentUser(request);
  if (!user) throw new HttpError(401, 'Please log in to your Selah account');
  return user;
}
