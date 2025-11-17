import { BrowserWindow, screen, app } from 'electron';
import * as path from 'node:path';

let toastWindow: BrowserWindow | null = null;
let toastShownAt: number | null = null;
let processingComplete = false;

const MIN_DISPLAY_DURATION = 3000; // 3 seconds minimum

export const createToastWindow = (): void => {
  if (toastWindow) {
    return; // Already created
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create a small window in the bottom-right corner
  toastWindow = new BrowserWindow({
    width: 800,
    height: 450,
    x: width - 420, // 20px padding from right
    y: height - 170, // 20px padding from bottom
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the toast overlay app
  const isDev = !app.isPackaged || process.argv.includes('--dev');

  if (isDev) {
    // Development mode - use Angular dev server on port 4201
    toastWindow.loadURL('http://localhost:4201');
    // toastWindow.webContents.openDevTools();
  } else {
    // Production mode - use built files
    toastWindow.loadFile(path.join(__dirname, '../toast/browser/index.html'));
  }

  toastWindow.on('closed', () => {
    toastWindow = null;
  });
};

export const showToast = (message: string): void => {
  if (!toastWindow) {
    createToastWindow();
  }

  if (toastWindow) {
    toastShownAt = Date.now();
    processingComplete = false;

    toastWindow.webContents.send('show-toast', message);
    toastWindow.show();
  }
};

export const hideToast = (): void => {
  processingComplete = true;

  if (!toastWindow || !toastShownAt) {
    return;
  }

  const elapsed = Date.now() - toastShownAt;
  const remainingTime = MIN_DISPLAY_DURATION - elapsed;

  if (remainingTime > 0) {
    // Wait for minimum display duration
    setTimeout(() => {
      if (toastWindow && processingComplete) {
        toastWindow.webContents.send('hide-toast');
        toastWindow.hide();
        toastShownAt = null;
      }
    }, remainingTime);
  } else {
    // Minimum time already elapsed, hide immediately
    toastWindow.webContents.send('hide-toast');
    toastWindow.hide();
    toastShownAt = null;
  }
};

export const destroyToastWindow = (): void => {
  if (toastWindow) {
    toastWindow.close();
    toastWindow = null;
  }
};
