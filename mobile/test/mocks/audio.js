/* Fake audio player: records what the app asks it to do.
   Tests can set __behaviour.failWhen = (source) => true to act like a file the phone can't open. */
const players = [];
const behaviour = { failWhen: null };

function createAudioPlayer(source) {
  const listeners = {};
  const fails = Boolean(behaviour.failWhen && behaviour.failWhen(source));
  const player = {
    source,
    volume: 1,
    loop: false,
    isLoaded: !fails,
    playing: false,
    currentTime: 0,
    play: jest.fn(function play() {
      if (!fails) this.playing = true;
    }),
    pause: jest.fn(function pause() {
      this.playing = false;
    }),
    remove: jest.fn(),
    seekTo: jest.fn(async () => {}),
    setPlaybackRate: jest.fn(),
    setActiveForLockScreen: jest.fn(),
    addListener: jest.fn((event, cb) => {
      (listeners[event] = listeners[event] || []).push(cb);
      return { remove: jest.fn() };
    }),
    emit: (event, payload) => (listeners[event] || []).forEach((cb) => cb(payload))
  };
  players.push(player);
  return player;
}

module.exports = {
  createAudioPlayer: jest.fn(createAudioPlayer),
  setAudioModeAsync: jest.fn(async () => {}),
  requestNotificationPermissionsAsync: jest.fn(async () => ({ granted: true })),
  __players: players,
  __behaviour: behaviour
};
