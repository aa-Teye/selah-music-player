/* A pretend Selah server (selah-api) for the app tests: accounts, Premium, backups, shared lyrics.
   It answers like the real one (same addresses, status codes and error codes). */
const BASE = 'https://selah-api.test';

function respond(status, body, headers = {}) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => lower[String(name).toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body)
  };
}

function createFakeServer({ otherFetch } = {}) {
  const server = {
    BASE,
    users: new Map(), // email -> { id, name, email, password, premium }
    tokens: new Map(), // token -> email
    backups: new Map(), // user id -> { data, savedAt }
    codes: new Map(), // email -> reset code
    emails: [],
    sharedLyrics: null, // what GET /api/lyrics answers (null = nothing)
    posted: [], // lyrics shared
    reports: [],
    calls: [],
    nextId: 1
  };

  const userFor = (options) => {
    const auth = options && options.headers && (options.headers.Authorization || options.headers.authorization);
    const token = auth ? String(auth).replace(/^Bearer\s+/i, '') : null;
    const email = token && server.tokens.get(token);
    return email ? server.users.get(email) : null;
  };
  const login = (user) => {
    const token = `token-${user.id}-${server.tokens.size + 1}`;
    server.tokens.set(token, user.email);
    return respond(200, { token, user: { id: user.id, name: user.name, email: user.email } }, { 'set-auth-token': token });
  };
  const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: '2026-11-13T00:00:00.000Z' });
  const freePremium = { active: false, until: null, source: null };

  server.giftPremium = (email, premium = { active: true, until: null, source: 'gift' }) => {
    server.users.get(email).premium = premium;
  };

  server.fetch = jest.fn(async (url, options = {}) => {
    const u = String(url);
    if (!u.startsWith(BASE)) {
      return otherFetch ? otherFetch(url, options) : respond(200, []);
    }
    const path = u.slice(BASE.length).split('?')[0];
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};
    server.calls.push({ method, path, body });
    const me = userFor(options);

    switch (`${method} ${path}`) {
      case 'POST /api/auth/sign-up/email': {
        if (server.users.has(body.email)) return respond(422, { code: 'USER_ALREADY_EXISTS', message: 'User already exists' });
        if (String(body.password).length < 8) return respond(400, { code: 'PASSWORD_TOO_SHORT', message: 'Password too short' });
        const user = { id: `user-${server.nextId++}`, name: body.name, email: body.email, password: body.password, premium: freePremium };
        server.users.set(user.email, user);
        return login(user);
      }
      case 'POST /api/auth/sign-in/email': {
        const user = server.users.get(body.email);
        if (!user || user.password !== body.password) {
          return respond(401, { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' });
        }
        return login(user);
      }
      case 'POST /api/auth/sign-out': {
        [...server.tokens.entries()].forEach(([t, e]) => me && e === me.email && server.tokens.delete(t));
        return respond(200, { success: true });
      }
      case 'POST /api/auth/email-otp/request-password-reset': {
        if (server.users.has(body.email)) {
          server.codes.set(body.email, '123456');
          server.emails.push({ to: body.email, code: '123456' });
        }
        return respond(200, { success: true });
      }
      case 'POST /api/auth/email-otp/reset-password': {
        if (server.codes.get(body.email) !== body.otp) return respond(400, { code: 'INVALID_OTP', message: 'Invalid OTP' });
        const user = server.users.get(body.email);
        user.password = body.password;
        server.codes.delete(body.email);
        [...server.tokens.entries()].forEach(([t, e]) => e === user.email && server.tokens.delete(t));
        return respond(200, { success: true });
      }
      case 'POST /api/auth/delete-user': {
        if (!me) return respond(401, { message: 'Unauthorized' });
        if (me.password !== body.password) return respond(400, { code: 'INVALID_PASSWORD', message: 'Invalid password' });
        server.users.delete(me.email);
        server.backups.delete(me.id);
        [...server.tokens.entries()].forEach(([t, e]) => e === me.email && server.tokens.delete(t));
        return respond(200, { success: true, message: 'User deleted' });
      }
      case 'GET /api/me':
        if (!me) return respond(401, { error: 'Please log in to your Selah account' });
        return respond(200, { user: publicUser(me), premium: me.premium });
      case 'GET /api/backup':
      case 'PUT /api/backup': {
        if (!me) return respond(401, { error: 'Please log in to your Selah account' });
        if (!me.premium.active) return respond(402, { error: 'Cloud backup is part of Selah Premium', premium: false });
        if (method === 'PUT') {
          const savedAt = '2026-11-13T10:00:00.000Z';
          server.backups.set(me.id, { data: body.data, savedAt });
          return respond(200, { savedAt, size: JSON.stringify(body.data).length });
        }
        const saved = server.backups.get(me.id);
        return saved ? respond(200, saved) : respond(404, { error: 'There is no backup in your account yet' });
      }
      case 'DELETE /api/backup':
        if (!me) return respond(401, { error: 'Please log in to your Selah account' });
        return respond(200, { deleted: server.backups.delete(me.id) });
      case 'GET /api/lyrics':
        return respond(200, server.sharedLyrics ? { found: true, lyrics: server.sharedLyrics } : { found: false });
      case 'POST /api/lyrics':
        if (!me) return respond(401, { error: 'Please log in to your Selah account' });
        server.posted.push({ by: me.email, ...body });
        return respond(200, { id: server.posted.length });
      case 'POST /api/lyrics/report':
        if (!me) return respond(401, { error: 'Please log in to your Selah account' });
        server.reports.push({ by: me.email, ...body });
        return respond(200, { reported: true });
      default:
        return respond(404, { error: `No such address: ${method} ${path}` });
    }
  });

  return server;
}

module.exports = { createFakeServer, respond, BASE };
