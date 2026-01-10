import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  SelectionArea,
  DisplayBounds,
  ShortcutConfig,
  ToastOptions,
} from '@shared/ipc-types';

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
  openSettings: () => ipcRenderer.send(IPC_CHANNELS.OPEN_SETTINGS),
  exitApp: () => ipcRenderer.send(IPC_CHANNELS.EXIT_APP),
  submitLauncherAction: (actionName?: string) => ipcRenderer.send(IPC_CHANNELS.LAUNCHER_ACTION, actionName),

  // Shortcuts operations
  getShortcuts: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SHORTCUTS),
  setShortcuts: (shortcuts: ShortcutConfig[]) => ipcRenderer.invoke(IPC_CHANNELS.SET_SHORTCUTS, shortcuts),
  suspendShortcuts: () => ipcRenderer.invoke(IPC_CHANNELS.SUSPEND_SHORTCUTS),
  resumeShortcuts: () => ipcRenderer.invoke(IPC_CHANNELS.RESUME_SHORTCUTS),

  // Overlay / Screenshot operations
  sendSelection: (selection: SelectionArea) => ipcRenderer.send(IPC_CHANNELS.SELECTION_MADE, selection),
  cancelSelection: () => ipcRenderer.send(IPC_CHANNELS.SELECTION_CANCELLED),
  requestDisplayBounds: () => ipcRenderer.send(IPC_CHANNELS.REQUEST_DISPLAY_BOUNDS),
  onDisplayBounds: (callback: (bounds: DisplayBounds) => void) => {
    ipcRenderer.on(IPC_CHANNELS.DISPLAY_BOUNDS, (_event, bounds) => callback(bounds));
  },

  // Toast operations
  onShowToast: (callback: (message: string, options?: ToastOptions) => void) => {
    ipcRenderer.on('show-toast', (_event, message, options) => callback(message, options));
  },
  onHideToast: (callback: () => void) => {
    ipcRenderer.on('hide-toast', () => callback());
  },

  // Logging
  log: (level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: unknown) => {
    ipcRenderer.send(IPC_CHANNELS.LOG_MESSAGE, { level, message, meta });
  },

  // Generic (for custom/future use)
  sendMessage: (channel: string, data: unknown) => ipcRenderer.send(channel, data),
  on: (channel: string, func: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => func(...args));
  },
});
