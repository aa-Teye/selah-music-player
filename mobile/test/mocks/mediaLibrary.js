/* Fake Android media index. Tests put songs in __state.audio / __state.other. */
const state = { audio: [], other: [], permission: 'granted' };

function page(list, first = 20, after) {
  const start = after ? Number(after) : 0;
  const assets = list.slice(start, start + first);
  const end = start + assets.length;
  return { assets, endCursor: String(end), hasNextPage: end < list.length, totalCount: list.length };
}

module.exports = {
  __state: state,
  MediaType: { audio: 'audio', unknown: 'unknown', photo: 'photo', video: 'video' },
  getPermissionsAsync: jest.fn(async () => ({
    granted: state.permission === 'granted',
    status: state.permission,
    canAskAgain: true
  })),
  requestPermissionsAsync: jest.fn(async () => ({
    granted: state.permission === 'granted',
    status: state.permission,
    canAskAgain: true
  })),
  getAssetsAsync: jest.fn(async ({ mediaType, first, after } = {}) =>
    page(mediaType === 'audio' ? state.audio : state.other, first, after)
  ),
  getAlbumsAsync: jest.fn(async () => [])
};
