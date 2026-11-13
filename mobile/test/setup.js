/* Test setup: stand-ins for the phone's native features so the whole app can run in tests. */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = React.forwardRef(() => React.createElement(View, { testID: 'webview' }));
  return { __esModule: true, default: WebView, WebView };
});

jest.mock('react-native-youtube-iframe', () => {
  const React = require('react');
  const { View } = require('react-native');
  const YoutubePlayer = React.forwardRef((props, ref) => {
    global.__youtubeProps = props; // lets tests see what the app tells the video to do
    React.useImperativeHandle(ref, () => {
      if (!global.__youtubeRef) {
        global.__youtubeRef = {
          seekTo: jest.fn(),
          getCurrentTime: jest.fn(async () => global.__youtubeTime || 0),
          getDuration: jest.fn(async () => 0)
        };
      }
      return global.__youtubeRef;
    });
    return React.createElement(View, { testID: 'youtube-player' });
  });
  return { __esModule: true, default: YoutubePlayer, getYoutubeMeta: jest.fn(async () => ({})) };
});

jest.mock('expo-audio', () => require('./mocks/audio'));
jest.mock('expo-media-library/legacy', () => require('./mocks/mediaLibrary'));
jest.mock('expo-media-library', () => require('./mocks/mediaLibrary'));
jest.mock('expo-file-system', () => require('./mocks/fileSystem'));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: [] }))
}));
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => 'file:///cache/lyric-card.png')
}));
jest.mock('expo-notifications', () => require('./mocks/notifications'));
jest.mock('expo-secure-store', () => require('./mocks/secureStore'));
jest.mock('react-native-purchases', () => require('./mocks/purchases'));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {})
}));
