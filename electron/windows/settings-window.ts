/**
 * Settings window management
 */

import { app, BrowserWindow } from 'electron';
import path from 'node:path';

let settingsWindow: BrowserWindow | null = null;

/**
 * Create or focus the settings window
 */
export const createSettingsWindow = (): void => {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load Angular app
  const isDev = !app.isPackaged || process.argv.includes('--dev');

  if (isDev) {
    // Development mode - use Angular dev server for hot reloading
    settingsWindow.loadURL('http://localhost:4206/#/settings');
    // settingsWindow.webContents.openDevTools();
  } else {
    // Production mode - use built files
    // __dirname is app.asar/dist/electron/windows, so ../../ goes to app.asar/dist
    const indexPath = path.join(__dirname, '../../claudine/browser/index.html');
    settingsWindow.loadFile(indexPath, {hash: 'settings'});
  }


  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
};

/**
 * Get the settings window instance
 */
export const getSettingsWindow = (): BrowserWindow | null => {
  return settingsWindow;
};
