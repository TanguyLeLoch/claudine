/**
 * Main entry point for the Electron app
 */

import { app, BrowserWindow } from 'electron';
// @ts-ignore - No types available for electron-squirrel-startup
import started from 'electron-squirrel-startup';
import { configStore } from './services/config-store';
import { createSettingsWindow } from './windows/settings-window';
import { createTray } from './tray/tray-manager';
import { registerShortcuts, unregisterShortcuts } from './shortcuts/shortcuts-manager';
import { setupIpcHandlers } from './ipc/handlers';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (started) {
  app.quit();
}

// App initialization when Electron is ready
app.whenReady().then(() => {
  createTray();
  registerShortcuts();
  setupIpcHandlers();
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
  });

  // Show settings on first run if no API key
  if (!configStore.hasApiKey()) {
    createSettingsWindow();
  }
});

// Prevent app from quitting when all windows are closed (tray app behavior)
app.on('window-all-closed', () => {
  // Don't quit - app should stay running in the tray
  // User can quit via tray menu
});

// Cleanup shortcuts on quit
app.on('will-quit', () => {
  unregisterShortcuts();
});

// macOS specific: open settings if no windows
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSettingsWindow();
  }
});
