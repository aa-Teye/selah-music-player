/* Fake phone notifications: remembers what Selah scheduled. */
const N = {
  __scheduled: [],
  __permission: { granted: true, canAskAgain: true },
  __reset() {
    N.__scheduled.length = 0;
    N.__permission = { granted: true, canAskAgain: true };
  },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ ...N.__permission })),
  requestPermissionsAsync: jest.fn(async () => ({ ...N.__permission })),
  scheduleNotificationAsync: jest.fn(async (request) => {
    N.__scheduled.push({ identifier: request.identifier, content: request.content, trigger: request.trigger });
    return request.identifier;
  }),
  getAllScheduledNotificationsAsync: jest.fn(async () => N.__scheduled.slice()),
  cancelScheduledNotificationAsync: jest.fn(async (id) => {
    const i = N.__scheduled.findIndex((n) => n.identifier === id);
    if (i >= 0) N.__scheduled.splice(i, 1);
  })
};

module.exports = N;
