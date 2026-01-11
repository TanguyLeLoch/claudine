/**
 * Shared IPC types - Single source of truth for Electron and Angular
 *
 * This file is bundled into preload.js by esbuild and imported by both
 * Electron main process and Angular renderer process.
 */

// =============================================================================
// IPC Channel Names
// =============================================================================

export const IPC_CHANNELS = {
  GET_API_KEY: 'get-api-key',
  SET_API_KEY: 'set-api-key',
  GET_PROVIDER: 'get-provider',
  SET_PROVIDER: 'set-provider',
  GET_SHORTCUTS: 'get-shortcuts',
  SET_SHORTCUTS: 'set-shortcuts',
  RESET_SHORTCUTS: 'reset-shortcuts',
  CLOSE_SETTINGS: 'close-settings',
  OPEN_SETTINGS: 'open-settings',
  LAUNCHER_ACTION: 'launcher-action',
  SELECTION_MADE: 'selection-made',
  SELECTION_CANCELLED: 'selection-cancelled',
  DISPLAY_BOUNDS: 'display-bounds',
  REQUEST_DISPLAY_BOUNDS: 'request-display-bounds',
  LOG_MESSAGE: 'log-message',
  SUSPEND_SHORTCUTS: 'suspend-shortcuts',
  RESUME_SHORTCUTS: 'resume-shortcuts',
  EXIT_APP: 'exit-app',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

// =============================================================================
// Shared Interfaces
// =============================================================================

/**
 * Screen selection area coordinates
 */
export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId: number;
}

/**
 * Display bounds information
 */
export interface DisplayBounds {
  id: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  scaleFactor: number;
}

/**
 * Keyboard shortcut configuration
 */
export interface ShortcutConfig {
  id: string;
  key: string;
  name: string;
  prompt: string;
  inputType: 'text' | 'image' | 'launcher';
  locked?: boolean;
}

/**
 * Toast notification options
 */
export interface ToastOptions {
  severity?: 'info' | 'success' | 'error' | 'warn';
  sticky?: boolean;
  type?: 'loading' | 'simple';
}

// =============================================================================
// Electron API Interface (exposed to renderer via contextBridge)
// =============================================================================

export interface IElectronAPI {
  // Settings
  getApiKey: () => Promise<string>;
  setApiKey: (key: string) => Promise<void>;
  getProvider: () => Promise<'gemini' | 'gpt'>;
  setProvider: (provider: 'gemini' | 'gpt') => Promise<void>;
  closeSettings: () => void;
  openSettings: () => void;
  exitApp: () => void;
  submitLauncherAction: (actionId?: string) => void;

  // Shortcuts
  getShortcuts: () => Promise<ShortcutConfig[]>;
  setShortcuts: (shortcuts: ShortcutConfig[]) => Promise<void>;
  resetShortcuts: () => Promise<ShortcutConfig[]>;
  suspendShortcuts: () => Promise<void>;
  resumeShortcuts: () => Promise<void>;

  // Overlay / Screenshot
  sendSelection: (selection: SelectionArea) => void;
  cancelSelection: () => void;
  requestDisplayBounds: () => void;
  onDisplayBounds: (callback: (bounds: DisplayBounds) => void) => void;

  // Toast
  onShowToast: (callback: (message: string, options?: ToastOptions) => void) => void;
  onHideToast: (callback: () => void) => void;

  // Logging
  log: (level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: unknown) => void;

  // General
  sendMessage: (channel: string, data: unknown) => void;
  on: (channel: string, func: (...args: unknown[]) => void) => void;
}
