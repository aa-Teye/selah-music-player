/* Fake secure storage (Keychain / Keystore), kept in memory. */
const store = new Map();

module.exports = {
  __store: store,
  getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
  setItemAsync: jest.fn(async (key, value) => {
    store.set(key, String(value));
  }),
  deleteItemAsync: jest.fn(async (key) => {
    store.delete(key);
  })
};
