/**
 * Launcher window management
 */

import { BrowserWindow, app, screen } from 'electron';
import path from 'node:path';

let launcherWindow: BrowserWindow | null = null;

/**
 * Create or show the launcher window
 */
export const showLauncherWindow = (): void => {
  if (launcherWindow && !launcherWindow.isDestroyed()) {
    if (launcherWindow.isVisible()) {
      launcherWindow.hide();
    } else {
      // Center on the display where the mouse is
      const point = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(point);
      
      const width = 800;
      const height = 600;
      
      const x = display.bounds.x + (display.bounds.width - width) / 2;
      const y = display.bounds.y + (display.bounds.height - height) / 2;

      launcherWindow.setBounds({ x: Math.floor(x), y: Math.floor(y), width, height });
      launcherWindow.show();
      launcherWindow.focus();
    }
    return;
  }

  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  
  launcherWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    x: display.bounds.x + (display.bounds.width - 800) / 2,
    y: display.bounds.y + (display.bounds.height - 600) / 2,
  });

  // Load Angular app
  const isDev = !app.isPackaged || process.argv.includes('--dev');

  if (isDev) {
    launcherWindow.loadURL('http://localhost:4200/#/launcher');
  } else {
    const indexPath = path.join(__dirname, '../../claudine/browser/index.html');
    launcherWindow.loadFile(indexPath, { hash: 'launcher' });
  }

  // Hide instead of close on blur? For now, let's just let it stay open until action
  // But standard launcher behavior is to hide on blur.
  launcherWindow.on('blur', () => {
    if (launcherWindow && !launcherWindow.isDestroyed()) {
      launcherWindow.hide();
    }
  });

  launcherWindow.on('closed', () => {
    launcherWindow = null;
  });

  launcherWindow.show();
};

/**
 * Hide the launcher window
 */
export const hideLauncherWindow = (): void => {
  if (launcherWindow && !launcherWindow.isDestroyed()) {
    launcherWindow.hide();
  }
};
