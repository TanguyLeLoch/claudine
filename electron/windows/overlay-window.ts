import { BrowserWindow, screen, ipcMain, app } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS, DisplayBounds } from '../ipc/ipc-types';
import { logger } from '../utils/logger';

export type SelectionArea = {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId: number; // ID of the display where selection was made
};

/**
 * Create overlay windows on all displays and wait for user selection
 */
export const selectScreenArea = async (): Promise<SelectionArea | null> => {
    // Get all displays
    const allDisplays = screen.getAllDisplays();
    logger.info(`Found ${allDisplays.length} displays.`);

    // Create one overlay window per display
    const selectionWindows: BrowserWindow[] = [];
    const windowBoundsMap = new Map<number, DisplayBounds>();

    const isDev = !app.isPackaged || process.argv.includes('--dev');

    for (const display of allDisplays) {
      const { bounds, id, scaleFactor } = display;
      logger.info(`Creating overlay for display ${id} at bounds: ${JSON.stringify(bounds)}`);

      const selectionWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        webPreferences: {
          preload: path.join(__dirname, '../preload.js'), // Use main preload
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const displayBounds: DisplayBounds = {
        id,
        offsetX: bounds.x,
        offsetY: bounds.y,
        width: bounds.width,
        height: bounds.height,
        scaleFactor
      };
      
      windowBoundsMap.set(selectionWindow.webContents.id, displayBounds);

      if (isDev) {
        await selectionWindow.loadURL('http://localhost:4200/#/overlay');
      } else {
        const indexPath = path.join(__dirname, '../../claudine/browser/index.html');
        await selectionWindow.loadFile(indexPath, { hash: 'overlay' });
      }
      
      selectionWindow.show();
      selectionWindows.push(selectionWindow);
    }

    logger.info('All overlay windows created. Waiting for user selection...');

    // Handle requests for bounds from the renderer
    const boundsRequestHandler = (event: Electron.IpcMainEvent) => {
        const bounds = windowBoundsMap.get(event.sender.id);
        if (bounds) {
            logger.debug(`Sending bounds to window ${event.sender.id}`);
            event.sender.send(IPC_CHANNELS.DISPLAY_BOUNDS, bounds);
        } else {
            logger.warn(`Received bounds request from unknown window ${event.sender.id}`);
        }
    };
    ipcMain.on(IPC_CHANNELS.REQUEST_DISPLAY_BOUNDS, boundsRequestHandler);

    // Wait for selection using IPC events from any window
    return new Promise<SelectionArea | null>((resolve) => {
      const cleanup = () => {
        logger.info('Cleaning up overlay windows and listeners.');
        ipcMain.removeListener(IPC_CHANNELS.SELECTION_MADE, handleSelection);
        ipcMain.removeListener(IPC_CHANNELS.SELECTION_CANCELLED, handleCancel);
        ipcMain.removeListener(IPC_CHANNELS.REQUEST_DISPLAY_BOUNDS, boundsRequestHandler);
        
        // Close all overlay windows
        selectionWindows.forEach(win => {
          if (!win.isDestroyed()) {
            win.close();
          }
        });
      };

      const handleSelection = (_event: any, selection: SelectionArea) => {
        logger.info('IPC: Selection received:', selection);
        cleanup();
        resolve(selection);
      };

      const handleCancel = () => {
        logger.info('IPC: Selection cancelled.');
        cleanup();
        resolve(null);
      };

      // Listen for IPC events
      ipcMain.once(IPC_CHANNELS.SELECTION_MADE, handleSelection);
      ipcMain.once(IPC_CHANNELS.SELECTION_CANCELLED, handleCancel);

      // Handle window close - if any window is closed, cancel selection
      selectionWindows.forEach(win => {
        win.on('closed', () => {
          if (!win.isDestroyed()) {
             // If a window is manually closed, we might want to cancel
             // But for now we rely on explicit cancel IPC
          }
        });
      });
    });
};