/**
 * EoN Browser — Electron Preload Script
 * Safely exposes Electron APIs to the renderer process.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
  isElectron: true,

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Notifications
  notify: (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
});
