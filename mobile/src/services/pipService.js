// ═════════════════════════════════════════════════════════════════════════
//  SELAH — PICTURE-IN-PICTURE (Android)
//  While a YouTube video plays, leaving Selah keeps it playing in a small
//  window on top of your other apps: by itself on Android 12 and newer, or
//  with the small-window button on any Android 8+. The window has a
//  play/pause button. YouTube has to stay visible, so closing the small
//  window pauses the video (Selah never plays YouTube with nothing on screen).
//  Not in Expo Go or on iPhone: there everything here quietly does nothing.
// ═════════════════════════════════════════════════════════════════════════
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

export const PIP_PLAY_PAUSE = 'selah-play-pause';

let native = Platform.OS === 'android' ? requireOptionalNativeModule('ExpoPip') : null;

/** Tests use a stand-in for the phone's picture-in-picture */
export function setPipModuleForTests(fake) {
  native = fake;
}

export function pipAvailable() {
  return Boolean(native);
}

// Icons from app.json (expo-pip plugin): assets/pip/pip_play.png and pip_pause.png
const playPauseAction = (playing) => ({
  iconName: playing ? 'pip_pause' : 'pip_play',
  action: PIP_PLAY_PAUSE,
  title: playing ? 'Pause' : 'Play',
  description: playing ? 'Pause the video' : 'Play the video'
});

/** 16:9, like the video */
const videoWindow = (playing) => ({ width: 16, height: 9, actions: [playPauseAction(playing)] });

/**
 * Keep the small window in step with the video.
 * video: a YouTube video is the current song. playing: it is playing.
 * Leaving the app opens the small window only while a video plays.
 */
export function setVideoPip({ video, playing }) {
  if (!native) return;
  try {
    native.setPictureInPictureParams(
      video ? { ...videoWindow(playing), autoEnterEnabled: Boolean(playing) } : { autoEnterEnabled: false, actions: [] }
    );
  } catch {}
}

/** The small-window button: shrink Selah to the video now */
export function enterVideoPip(playing) {
  if (!native) return false;
  try {
    native.enterPipMode(videoWindow(playing));
    return true;
  } catch {
    return false;
  }
}

export function isInPip() {
  try {
    return Boolean(native && native.isInPipMode());
  } catch {
    return false;
  }
}

const noSubscription = { remove() {} };

export function onPipChange(listener) {
  if (!native || typeof native.addListener !== 'function') return noSubscription;
  return native.addListener('onPipModeChange', (event) => listener(Boolean(event && event.isInPipMode)));
}

export function onPipAction(listener) {
  if (!native || typeof native.addListener !== 'function') return noSubscription;
  return native.addListener('onPipActionPressed', (event) => listener(event && event.action));
}
