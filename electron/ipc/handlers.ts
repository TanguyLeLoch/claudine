/**
 * IPC handlers for main-renderer communication
 */

import { ipcMain, app } from 'electron';
import { configStore } from '../services/config-store';
import { getSettingsWindow, createSettingsWindow } from '../windows/settings-window';
import { hideLauncherWindow } from '../windows/launcher-window';
import { IPC_CHANNELS, ShortcutConfig } from '../../shared/ipc-types';
import { logger } from '../utils/logger';
import { resumeGlobalShortcuts, suspendGlobalShortcuts, triggerShortcutAction } from '../shortcuts/shortcuts-manager';
import { sleep } from '../utils/helpers';

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

  ipcMain.handle(IPC_CHANNELS.GET_SHORTCUTS, () => {
    return configStore.getShortcuts();
  });

  ipcMain.handle(IPC_CHANNELS.SET_SHORTCUTS, (_, shortcuts: ShortcutConfig[]) => {
    configStore.setShortcuts(shortcuts);
  });

  ipcMain.handle(IPC_CHANNELS.RESET_SHORTCUTS, () => {
    logger.info('IPC: Reset shortcuts requested');
    return configStore.resetToDefaults();
  });

  ipcMain.handle(IPC_CHANNELS.SUSPEND_SHORTCUTS, () => {
    suspendGlobalShortcuts();
  });

  ipcMain.handle(IPC_CHANNELS.RESUME_SHORTCUTS, () => {
    resumeGlobalShortcuts();
  });

  ipcMain.on(IPC_CHANNELS.CLOSE_SETTINGS, () => {
    const settingsWindow = getSettingsWindow();
    if (settingsWindow) {
      settingsWindow.close();
    }
  });

  ipcMain.on(IPC_CHANNELS.OPEN_SETTINGS, () => {
    hideLauncherWindow();
    createSettingsWindow();
  });

  ipcMain.on(IPC_CHANNELS.EXIT_APP, () => {
    app.quit();
  });

  ipcMain.on(IPC_CHANNELS.LAUNCHER_ACTION, async (_, actionId?: string) => {
    hideLauncherWindow();

    if (actionId) {
      // Wait for window to hide and focus to be restored to previous app
      await sleep(100);

      const shortcuts = configStore.getShortcuts();
      const shortcut = shortcuts.find(s => s.id === actionId);

      if (shortcut) {
        logger.info(`Executing launcher action: ${shortcut.name} (${actionId})`);
        triggerShortcutAction(shortcut);
      } else {
        logger.warn(`Launcher action not found: ${actionId}`);
      }
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
