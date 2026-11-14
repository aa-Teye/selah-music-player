// Release settings that keep updates safe (see RELEASING.md)
const app = require('../app.json').expo;
const eas = require('../eas.json');

test('an instant update only reaches phones running the same version it was made for', () => {
  expect(app.runtimeVersion).toEqual({ policy: 'appVersion' });
  expect(app.updates.url).toBe(`https://u.expo.dev/${app.extra.eas.projectId}`);
  expect(app.updates.fallbackToCacheTimeout).toBe(0); // never slows down opening the app
  expect(app.version).toMatch(/^\d+\.\d+\.\d+$/);
});

test('each kind of build listens to its own update channel; Play Store builds are app bundles', () => {
  expect(eas.build.production.channel).toBe('production');
  expect(eas.build.preview.channel).toBe('preview');
  expect(eas.build.production.android.buildType).toBe('app-bundle');
  expect(eas.build.production.autoIncrement).toBe(true);
  expect(eas.build.preview.android.buildType).toBe('apk');
  expect(eas.cli.appVersionSource).toBe('remote');
  expect(eas.cli.requireCommit).toBe(true);
});
