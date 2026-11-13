import {
  signUp,
  logIn,
  logOut,
  loadAccount,
  sendResetCode,
  resetPassword,
  deleteAccount,
  isEmail
} from '../src/services/accountService';
import { setApiUrlForTests, resetTokenCacheForTests, getToken } from '../src/services/apiClient';
import { connectStore, disconnectStore, premiumPlans, buyPlan, isStoreReady } from '../src/services/premiumService';

const { createFakeServer, BASE } = require('./fakeServer');
const secureStore = require('./mocks/secureStore');
const Purchases = require('./mocks/purchases');

let server;

beforeEach(() => {
  secureStore.__store.clear();
  resetTokenCacheForTests();
  setApiUrlForTests(BASE);
  server = createFakeServer();
  global.fetch = server.fetch;
  Purchases.__reset();
});

afterAll(() => setApiUrlForTests(null));

test('sign up keeps the login token in secure storage; my account loads', async () => {
  const user = await signUp({ name: ' Ama ', email: ' Ama@Example.com ', password: 'worship123' });
  expect(user).toMatchObject({ name: 'Ama', email: 'ama@example.com' });
  expect(secureStore.__store.get('selah_login_token')).toMatch(/^token-/);

  const account = await loadAccount();
  expect(account.user.email).toBe('ama@example.com');
  expect(account.premium).toEqual({ active: false, until: null, source: null });

  // every request says it comes from the Selah app (the server needs this when the phone sends cookies)
  server.fetch.mock.calls.forEach(([, options]) => expect(options.headers.Origin).toBe('selah://'));
  const meCall = server.fetch.mock.calls.find(([u]) => String(u).endsWith('/api/me'));
  expect(meCall[1].headers.Authorization).toBe(`Bearer ${secureStore.__store.get('selah_login_token')}`);
});

test('clear messages before and after asking the server', async () => {
  await expect(signUp({ name: '', email: 'a@b.co', password: 'worship123' })).rejects.toThrow('Please enter your name.');
  await expect(signUp({ name: 'Ama', email: 'not-an-email', password: 'worship123' })).rejects.toThrow('Please check the email address.');
  await expect(signUp({ name: 'Ama', email: 'a@b.co', password: 'short' })).rejects.toThrow('Use at least 8 characters for your password.');

  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  await expect(signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' })).rejects.toThrow(
    'There is already an account with this email. Log in instead.'
  );
  await expect(logIn({ email: 'ama@example.com', password: 'wrong-pass' })).rejects.toThrow('That email or password is not right.');
  expect(isEmail('ama@example.com')).toBe(true);
  expect(isEmail('ama@example')).toBe(false);
});

test('log out forgets the token; logging in again brings it back', async () => {
  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  await logOut();
  expect(await getToken()).toBeNull();
  expect(await loadAccount()).toBeNull();
  await logIn({ email: 'ama@example.com', password: 'worship123' });
  expect((await loadAccount()).user.name).toBe('Ama');
});

test('forgot password: code by email, new password, then log in', async () => {
  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  await logOut();
  await sendResetCode('ama@example.com');
  expect(server.emails).toEqual([{ to: 'ama@example.com', code: '123456' }]);
  await expect(resetPassword({ email: 'ama@example.com', code: '12', password: 'newpass123' })).rejects.toThrow(
    'Enter the 6-digit code from the email.'
  );
  await expect(resetPassword({ email: 'ama@example.com', code: '000000', password: 'newpass123' })).rejects.toThrow(
    'That code is not right. Check the email and try again.'
  );
  await resetPassword({ email: 'ama@example.com', code: '123456', password: 'newpass123' });
  await expect(logIn({ email: 'ama@example.com', password: 'worship123' })).rejects.toThrow('That email or password is not right.');
  await logIn({ email: 'ama@example.com', password: 'newpass123' });
});

test('delete account: needs the right password, then forgets the login', async () => {
  await signUp({ name: 'Ama', email: 'ama@example.com', password: 'worship123' });
  await expect(deleteAccount('')).rejects.toThrow('Enter your password to delete your account.');
  await expect(deleteAccount('wrong-pass')).rejects.toThrow('That password is not right.');
  await deleteAccount('worship123');
  expect(await getToken()).toBeNull();
  expect(server.users.has('ama@example.com')).toBe(false);
});

test('Premium store: off until a RevenueCat key is set; plans and purchases when it is', async () => {
  expect(isStoreReady()).toBe(false);
  expect(await connectStore('user-1')).toBe(false);
  expect(Purchases.configure).not.toHaveBeenCalled();

  const Constants = require('expo-constants').default;
  const savedExtra = Constants.expoConfig.extra;
  Constants.expoConfig.extra = { ...(savedExtra || {}), revenueCatAndroidKey: 'goog_test_key', revenueCatIosKey: 'appl_test_key' };
  try {
    expect(await connectStore('user-1')).toBe(true);
    expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: expect.stringMatching(/_test_key$/), appUserID: 'user-1' });
    expect(await connectStore('user-2')).toBe(true); // another account on the same phone
    expect(Purchases.logIn).toHaveBeenCalledWith('user-2');

    const plans = await premiumPlans();
    expect(plans.map((p) => `${p.title}: ${p.price} ${p.period}`)).toEqual(['Monthly: GH₵15.00 per month', 'Yearly: GH₵150.00 per year']);
    expect(await buyPlan(plans[0])).toBe(true);
    Purchases.__state.purchaseResult = 'cancelled';
    expect(await buyPlan(plans[0])).toBe(false); // changed their mind: no error
    Purchases.__state.purchaseResult = 'failed';
    await expect(buyPlan(plans[0])).rejects.toThrow('Payment declined.');

    await disconnectStore();
    expect(Purchases.logOut).toHaveBeenCalled();
  } finally {
    Constants.expoConfig.extra = savedExtra;
  }
});
