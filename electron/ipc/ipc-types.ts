
export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId: number;
}

export interface DisplayBounds {
  id: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  scaleFactor: number;
}

export interface IElectronAPI {
  // Settings
  getApiKey: () => Promise<string>;
  setApiKey: (key: string) => Promise<void>;
  getProvider: () => Promise<'gemini' | 'gpt'>;
  setProvider: (provider: 'gemini' | 'gpt') => Promise<void>;
  closeSettings: () => void;

  // Overlay / Screenshot
  sendSelection: (selection: SelectionArea) => void;
  cancelSelection: () => void;
  onDisplayBounds: (callback: (bounds: DisplayBounds) => void) => void;

  // Toast
  onShowToast: (callback: (message: string) => void) => void;
  onHideToast: (callback: () => void) => void;

  // Logging
  log: (level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any) => void;

  // General
  sendMessage: (channel: string, data: any) => void;
  on: (channel: string, func: (...args: any[]) => void) => void;
}

export const IPC_CHANNELS = {
  GET_API_KEY: 'get-api-key',
  SET_API_KEY: 'set-api-key',
  GET_PROVIDER: 'get-provider',
  SET_PROVIDER: 'set-provider',
  CLOSE_SETTINGS: 'close-settings',
  SELECTION_MADE: 'selection-made',
  SELECTION_CANCELLED: 'selection-cancelled',
  DISPLAY_BOUNDS: 'display-bounds',
  REQUEST_DISPLAY_BOUNDS: 'request-display-bounds',
  LOG_MESSAGE: 'log-message',
} as const;
