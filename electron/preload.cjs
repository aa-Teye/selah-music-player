const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onMediaKey: (callback) => ipcRenderer.on('media-key', (_event, action) => callback(action))
});
