import { contextBridge, ipcRenderer } from 'electron';

// Define the IPC channels manually to avoid importing from a module that might not be resolvable
// in the sandboxed preload environment without a bundler.
const IPC_CHANNELS = {
  GET_API_KEY: 'get-api-key',
  SET_API_KEY: 'set-api-key',
  GET_PROVIDER: 'get-provider',
  SET_PROVIDER: 'set-provider',
  CLOSE_SETTINGS: 'close-settings',
  SELECTION_MADE: 'selection-made',
  SELECTION_CANCELLED: 'selection-cancelled',
  DISPLAY_BOUNDS: 'display-bounds',
  LOG_MESSAGE: 'log-message'
} as const;

// Redefine types locally for the preload script
interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId: number;
}

interface DisplayBounds {
  id: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  scaleFactor: number;
}

/**
 * Expose safe IPC methods to the renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings operations
  getApiKey: () => ipcRenderer.invoke(IPC_CHANNELS.GET_API_KEY),
  setApiKey: (apiKey: string) => ipcRenderer.invoke(IPC_CHANNELS.SET_API_KEY, apiKey),
  getProvider: () => ipcRenderer.invoke(IPC_CHANNELS.GET_PROVIDER),
  setProvider: (provider: string) => ipcRenderer.invoke(IPC_CHANNELS.SET_PROVIDER, provider),
  closeSettings: () => ipcRenderer.send(IPC_CHANNELS.CLOSE_SETTINGS),

  // Overlay / Screenshot operations
  sendSelection: (selection: SelectionArea) => ipcRenderer.send(IPC_CHANNELS.SELECTION_MADE, selection),
  cancelSelection: () => ipcRenderer.send(IPC_CHANNELS.SELECTION_CANCELLED),
  onDisplayBounds: (callback: (bounds: DisplayBounds) => void) => {
    ipcRenderer.on(IPC_CHANNELS.DISPLAY_BOUNDS, (_event, bounds) => callback(bounds));
  },

  // Toast operations
  onShowToast: (callback: (message: string) => void) => {
    ipcRenderer.on('show-toast', (_event, message) => callback(message));
  },
  onHideToast: (callback: () => void) => {
    ipcRenderer.on('hide-toast', () => callback());
  },

  // Logging
  log: (level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any) => {
    ipcRenderer.send(IPC_CHANNELS.LOG_MESSAGE, { level, message, meta });
  },

  // Generic (for custom/future use)
  sendMessage: (channel: string, data: any) => ipcRenderer.send(channel, data),
  on: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => func(...args));
  },
});
