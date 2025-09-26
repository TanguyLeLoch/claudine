const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleShortcut: (shortcut, enabled) => ipcRenderer.invoke('toggle-shortcut', shortcut, enabled)
});