// ═════════════════════════════════════════════════════════════════════════
//  SELAH PREMIUM — buying it through Google Play (or the App Store)
//  RevenueCat handles the store; Selah's server checks it before a backup.
//  Needs the RevenueCat public keys in app.json:
//    expo.extra.revenueCatAndroidKey  /  expo.extra.revenueCatIosKey
//  Real purchases only work in the app installed from Google Play (not Expo Go).
// ═════════════════════════════════════════════════════════════════════════
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';

let configuredFor = undefined; // the account RevenueCat was set up with

export function storeKey() {
  const extra = Constants.expoConfig?.extra || {};
  return (Platform.OS === 'ios' ? extra.revenueCatIosKey : extra.revenueCatAndroidKey) || '';
}

export const isStoreReady = () => Boolean(storeKey());

/** Connects the store to the logged-in account, so a purchase belongs to that account */
export async function connectStore(userId) {
  if (!isStoreReady() || !userId) return false;
  try {
    if (configuredFor === undefined) {
      Purchases.configure({ apiKey: storeKey(), appUserID: userId });
    } else if (configuredFor !== userId) {
      await Purchases.logIn(userId);
    }
    configuredFor = userId;
    return true;
  } catch (err) {
    console.log('Store notice:', err?.message || err);
    return false;
  }
}

export async function disconnectStore() {
  if (configuredFor === undefined || configuredFor === null) return;
  try {
    await Purchases.logOut();
  } catch {}
  configuredFor = null;
}

const PERIODS = {
  WEEKLY: 'per week',
  MONTHLY: 'per month',
  TWO_MONTH: 'every 2 months',
  THREE_MONTH: 'every 3 months',
  SIX_MONTH: 'every 6 months',
  ANNUAL: 'per year',
  LIFETIME: 'one time'
};

/** The plans set up in RevenueCat (current offering), with prices from the store */
export async function premiumPlans() {
  const offerings = await Purchases.getOfferings();
  const packages = (offerings && offerings.current && offerings.current.availablePackages) || [];
  return packages.map((pkg) => ({
    id: pkg.identifier,
    title: pkg.packageType === 'ANNUAL' ? 'Yearly' : pkg.packageType === 'MONTHLY' ? 'Monthly' : pkg.product?.title || 'Premium',
    price: pkg.product?.priceString || '',
    period: PERIODS[pkg.packageType] || '',
    pkg
  }));
}

/** true when bought, false when you changed your mind */
export async function buyPlan(plan) {
  try {
    await Purchases.purchasePackage(plan.pkg);
    return true;
  } catch (err) {
    if (err && err.userCancelled) return false;
    throw new Error(err?.message || 'The purchase did not go through. You were not charged.');
  }
}

export async function restorePurchases() {
  await Purchases.restorePurchases();
}

export function manageSubscription() {
  const url =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
  return Linking.openURL(url).catch(() => {});
}
