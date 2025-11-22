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
    width: 400,
    height: 150,
    x: width - 420,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the toast overlay app
  const isDev = !app.isPackaged || process.argv.includes('--dev');

  if (isDev) {
    // Development mode - use Angular dev server on port 4200
    toastWindow.loadURL('http://localhost:4200/#/toast');
    // toastWindow.webContents.openDevTools();
  } else {
    // Production mode - use built files
    const indexPath = path.join(__dirname, '../../claudine/browser/index.html');
    toastWindow.loadFile(indexPath, { hash: 'toast' });
  }

  toastWindow.on('closed', () => {
    toastWindow = null;
  });
};

export const showToast = (message: string, options?: { severity?: 'info' | 'success' | 'error' | 'warn', sticky?: boolean, type?: 'loading' | 'simple' }): void => {
  if (!toastWindow) {
    createToastWindow();
  }

  if (toastWindow) {
    // Reposition window to current primary display
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width } = primaryDisplay.workArea;
    
    // Calculate position: Top-right of work area
    toastWindow.setBounds({
        x: x + width - 420, // 400px width approx + 20px padding
        y: y + 20,
        width: 400,         // Resize to be smaller/fitter
        height: 150         // Resize to be smaller/fitter
    });

    const send = () => {
        toastShownAt = Date.now();
        processingComplete = false;
        toastWindow?.webContents.send('show-toast', message, options);
        toastWindow?.showInactive();
    };

    if (toastWindow.webContents.isLoading()) {
        toastWindow.webContents.once('did-finish-load', send);
    } else {
        send();
    }
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
