import { DisplayBounds, SelectionArea } from '../text-processor/screenshot-processor';

/**
 * Type definitions for Electron IPC API
 */
export interface ElectronAPI {
  getApiKey: () => Promise<string>;
  setApiKey: (apiKey: string) => Promise<void>;
  getProvider: () => Promise<'gemini' | 'gpt'>;
  setProvider: (provider: string) => Promise<void>;
  closeSettings: () => void;
  sendSelection: (selection: SelectionArea) => void;
  cancelSelection: () => void;
  onDisplayBounds: (dp: DisplayBounds) => void;

}
declare global {
  interface Window {
    electronAPI: ElectronAPI;

  }
}
