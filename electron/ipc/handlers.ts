/**
 * IPC handlers for main-renderer communication
 */

import { ipcMain } from 'electron';
import { configStore } from '../services/config-store';
import { getSettingsWindow } from '../windows/settings-window';

/**
 * Set up IPC handlers for communication with renderer processes
 */
export const setupIpcHandlers = (): void => {
  ipcMain.handle('get-api-key', () => {
    return configStore.getApiKey();
  });

  ipcMain.handle('set-api-key', (_, apiKey: string) => {
    configStore.setApiKey(apiKey);
  });

  ipcMain.handle('get-provider', () => {
    return configStore.getProvider();
  });

  ipcMain.handle('set-provider', (_, provider: 'gemini' | 'gpt') => {
    configStore.setProvider(provider);
  });

  ipcMain.on('close-settings', () => {
    const settingsWindow = getSettingsWindow();
    if (settingsWindow) {
      settingsWindow.close();
    }
  });
};
