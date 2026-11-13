/* Fake RevenueCat (Google Play purchases). Tests change __state to act like the store. */
const state = {
  packages: [],
  purchaseResult: 'bought', // 'bought' | 'cancelled' | 'failed'
  onPurchase: null
};

function reset() {
  state.packages = [
    {
      identifier: '$rc_monthly',
      packageType: 'MONTHLY',
      product: { identifier: 'selah_premium_monthly', title: 'Selah Premium', priceString: 'GH₵15.00' }
    },
    {
      identifier: '$rc_annual',
      packageType: 'ANNUAL',
      product: { identifier: 'selah_premium_yearly', title: 'Selah Premium (yearly)', priceString: 'GH₵150.00' }
    }
  ];
  state.purchaseResult = 'bought';
  state.onPurchase = null;
  Purchases.configure.mockClear();
  Purchases.logIn.mockClear();
  Purchases.logOut.mockClear();
  Purchases.purchasePackage.mockClear();
}

const Purchases = {
  configure: jest.fn(),
  logIn: jest.fn(async (id) => ({ customerInfo: { originalAppUserId: id }, created: false })),
  logOut: jest.fn(async () => ({})),
  getOfferings: jest.fn(async () => ({ current: { availablePackages: state.packages } })),
  purchasePackage: jest.fn(async (pkg) => {
    if (state.purchaseResult === 'cancelled') {
      const err = new Error('Purchase was cancelled.');
      err.userCancelled = true;
      throw err;
    }
    if (state.purchaseResult === 'failed') throw new Error('Payment declined.');
    if (state.onPurchase) await state.onPurchase(pkg);
    return { productIdentifier: pkg.product.identifier, customerInfo: {} };
  }),
  restorePurchases: jest.fn(async () => ({})),
  isConfigured: jest.fn(async () => true),
  __state: state,
  __reset: reset
};

module.exports = Purchases;
module.exports.default = Purchases;
module.exports.__esModule = true;
