// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose safe IPC methods to the renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings operations
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),
  getProvider: () => ipcRenderer.invoke('get-provider'),
  setProvider: (provider: string) => ipcRenderer.invoke('set-provider', provider),

  // Window operations
  closeSettings: () => ipcRenderer.send('close-settings'),
});
