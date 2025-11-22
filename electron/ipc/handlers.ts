/**
 * IPC handlers for main-renderer communication
 */

import { ipcMain } from 'electron';
import { configStore } from '../services/config-store';
import { getSettingsWindow } from '../windows/settings-window';
import { IPC_CHANNELS } from './ipc-types';
import { logger } from '../utils/logger';

/**
 * Set up IPC handlers for communication with renderer processes
 */
export const setupIpcHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.GET_API_KEY, () => {
    return configStore.getApiKey();
  });

  ipcMain.handle(IPC_CHANNELS.SET_API_KEY, (_, apiKey: string) => {
    configStore.setApiKey(apiKey);
  });

  ipcMain.handle(IPC_CHANNELS.GET_PROVIDER, () => {
    return configStore.getProvider();
  });

  ipcMain.handle(IPC_CHANNELS.SET_PROVIDER, (_, provider: 'gemini' | 'gpt') => {
    configStore.setProvider(provider);
  });

  ipcMain.on(IPC_CHANNELS.CLOSE_SETTINGS, () => {
    const settingsWindow = getSettingsWindow();
    if (settingsWindow) {
      settingsWindow.close();
    }
  });

  // Handle logs from renderer
  ipcMain.on(IPC_CHANNELS.LOG_MESSAGE, (_, { level, message, meta }) => {
    const logMeta = { ...meta, source: 'renderer' };
    switch (level) {
      case 'info':
        logger.info(message, logMeta);
        break;
      case 'warn':
        logger.warn(message, logMeta);
        break;
      case 'error':
        logger.error(message, logMeta);
        break;
      case 'debug':
        logger.debug(message, logMeta);
        break;
      default:
        logger.info(message, logMeta);
    }
  });
};
