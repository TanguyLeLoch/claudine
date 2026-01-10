/**
 * Re-export shared types for Angular application
 * This file also extends the global Window interface with electronAPI
 */
export {
  ShortcutConfig,
  SelectionArea,
  DisplayBounds,
  ToastOptions,
  IElectronAPI,
} from '@shared/ipc-types';

import { IElectronAPI } from '@shared/ipc-types';

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
