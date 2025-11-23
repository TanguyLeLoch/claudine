export interface ShortcutConfig {
  key: string;
  name: string;
  prompt: string;
  inputType: 'text' | 'image' | 'launcher';
  locked?: boolean;
}

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
  closeLauncher: () => void;

  // Shortcuts
  getShortcuts: () => Promise<ShortcutConfig[]>;
  setShortcuts: (shortcuts: ShortcutConfig[]) => Promise<void>;
  suspendShortcuts: () => Promise<void>;
  resumeShortcuts: () => Promise<void>;

  // Overlay / Screenshot
  sendSelection: (selection: SelectionArea) => void;
  cancelSelection: () => void;
  requestDisplayBounds: () => void;
  onDisplayBounds: (callback: (bounds: DisplayBounds) => void) => void;

  // Toast
  onShowToast: (callback: (message: string, options?: {
    severity?: 'info' | 'success' | 'error' | 'warn',
    sticky?: boolean,
    type?: 'loading' | 'simple'
  }) => void) => void;
  onHideToast: (callback: () => void) => void;

  // Logging
  log: (level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any) => void;

  // General
  sendMessage: (channel: string, data: any) => void;
  on: (channel: string, func: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
