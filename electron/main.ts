/**
 * Main entry point for the Electron app
 */

import { app, BrowserWindow } from 'electron';
// @ts-ignore - No types available for electron-squirrel-startup
import started from 'electron-squirrel-startup';
import { configStore } from './services/config-store';
import { createSettingsWindow } from './windows/settings-window';
import { createTray } from './tray/tray-manager';
import { registerShortcuts, setupShortcutsReloading, unregisterShortcuts } from './shortcuts/shortcuts-manager';
import { setupIpcHandlers } from './ipc/handlers';
import { destroyToastWindow } from './windows/toast-window';
import { logger } from './utils/logger';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (started) {
  logger.info('App started via Squirrel, quitting immediately.');
  app.quit();
}

// Global error handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
});

// App initialization when Electron is ready
app.whenReady().then(() => {
  logger.info('App is ready. Initializing components...');

  // Hide dock icon on macOS for launcher behavior
  if (process.platform === 'darwin') {
    app?.dock?.hide();
  }

  createTray();
  registerShortcuts();
  setupShortcutsReloading(); // Enable live reload for shortcuts
  setupIpcHandlers();
  // Toast window now created lazily on first showToast() call
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
  });

  // Show settings on first run if no API key
  if (!configStore.hasApiKey()) {
    logger.info('No API key found. Opening settings window.');
    createSettingsWindow();
  }
  logger.info('App initialization complete.');
});

// Prevent app from quitting when all windows are closed (tray app behavior)
app.on('window-all-closed', () => {
  logger.info('All windows closed. App continuing in background.');
  // Don't quit - app should stay running in the tray
  // User can quit via tray menu
});

// Cleanup shortcuts and toast window on quit
app.on('will-quit', () => {
  logger.info('App will quit. Cleaning up...');
  unregisterShortcuts();
  destroyToastWindow();
  logger.info('Cleanup complete.');
});

// macOS specific: open settings if no windows
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    logger.info('App activated with no windows. Opening settings.');
    createSettingsWindow();
  }
});
