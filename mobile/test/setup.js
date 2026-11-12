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
  const YoutubePlayer = React.forwardRef((props) => {
    global.__youtubeProps = props; // lets tests see what the app tells the video to do
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
