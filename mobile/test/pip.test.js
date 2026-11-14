import path from 'path';
import fs from 'fs';
import {
  setPipModuleForTests,
  pipAvailable,
  setVideoPip,
  enterVideoPip,
  isInPip,
  onPipChange,
  onPipAction
} from '../src/services/pipService';

afterEach(() => setPipModuleForTests(null));

test('without picture-in-picture (iPhone, Expo Go) everything quietly does nothing', () => {
  setPipModuleForTests(null);
  expect(pipAvailable()).toBe(false);
  expect(() => setVideoPip({ video: true, playing: true })).not.toThrow();
  expect(enterVideoPip(true)).toBe(false);
  expect(isInPip()).toBe(false);
  expect(() => onPipChange(() => {}).remove()).not.toThrow();
  expect(() => onPipAction(() => {}).remove()).not.toThrow();
});

test('a failing call to the phone never crashes Selah', () => {
  const boom = () => {
    throw new Error('not now');
  };
  setPipModuleForTests({ setPictureInPictureParams: boom, enterPipMode: boom, isInPipMode: boom });
  expect(() => setVideoPip({ video: true, playing: false })).not.toThrow();
  expect(enterVideoPip(false)).toBe(false);
  expect(isInPip()).toBe(false);
});

test('the play and pause icons the small window uses are set up in app.json', () => {
  const plugin = require('../app.json').expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-pip');
  const icons = plugin[1].icons;
  expect(icons.map((i) => path.basename(i, '.png'))).toEqual(expect.arrayContaining(['pip_play', 'pip_pause']));
  icons.forEach((i) => expect(fs.existsSync(path.join(__dirname, '..', i))).toBe(true));
});
