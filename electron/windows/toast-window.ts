import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'node:path';

let toastWindow: BrowserWindow | null = null;
let toastShownAt: number | null = null;
let processingComplete = false;
let pendingMessage: { message: string; options?: any } | null = null;
let destroyTimer: NodeJS.Timeout | null = null;
let isAngularReady = false;

const MIN_DISPLAY_DURATION = 3000; // 3 seconds minimum
const DESTROY_AFTER_INACTIVITY = 60000; // 60 seconds
const TOAST_WIDTH = 500;
const TOAST_HEIGHT = 300;
const TOAST_PADDING = 20;

export const createToastWindow = (): void => {
  if (toastWindow) {
    return; // Already created
  }

  // Get the display where the cursor currently is
  const cursorPoint = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width, height } = currentDisplay.workArea;

  // Create a small window in the top-right corner of the display containing the cursor
  toastWindow = new BrowserWindow({
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
    x: x + width - TOAST_WIDTH - TOAST_PADDING,
    y: y + TOAST_PADDING,
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
    isAngularReady = false;
    pendingMessage = null;
  });
};

export const showToast = (message: string, options?: {
  severity?: 'info' | 'success' | 'error' | 'warn',
  sticky?: boolean,
  type?: 'loading' | 'simple'
}): void => {
  // Reset the 60-second destruction timer on any toast activity
  resetDestroyTimer();

  // Buffer the message
  pendingMessage = { message, options };

  // Create window if it doesn't exist (lazy creation)
  if (!toastWindow) {
    createToastWindow();
    // Window is being created, Angular will send 'toast-component-ready' when ready
    // The handshake will send the buffered message
    return;
  }

  // If Angular is ready, send the message immediately
  if (isAngularReady) {
    toastShownAt = Date.now();
    processingComplete = false;
    toastWindow.webContents.send('show-toast', message, options);
    toastWindow.showInactive();
    pendingMessage = null; // Clear buffer after sending
  }
  // If Angular is not ready, the message is buffered and will be sent via handshake
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

const resetDestroyTimer = (): void => {
  // Clear existing timer
  if (destroyTimer) {
    clearTimeout(destroyTimer);
    destroyTimer = null;
  }

  // Start new 60-second timer
  destroyTimer = setTimeout(() => {
    if (toastWindow) {
      toastWindow.close();
      toastWindow = null;
      isAngularReady = false;
      pendingMessage = null;
    }
    destroyTimer = null;
  }, DESTROY_AFTER_INACTIVITY);
};

export const destroyToastWindow = (): void => {
  if (destroyTimer) {
    clearTimeout(destroyTimer);
    destroyTimer = null;
  }
  if (toastWindow) {
    toastWindow.close();
    toastWindow = null;
  }
};

// Setup IPC listener for the Angular handshake
ipcMain.on('toast-component-ready', () => {
  isAngularReady = true;

  // If there's a buffered message, send it now
  if (pendingMessage && toastWindow) {
    toastShownAt = Date.now();
    processingComplete = false;
    toastWindow.webContents.send('show-toast', pendingMessage.message, pendingMessage.options);
    toastWindow.showInactive();
    pendingMessage = null; // Clear buffer after sending
  }
});
