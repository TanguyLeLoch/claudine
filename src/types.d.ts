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

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
