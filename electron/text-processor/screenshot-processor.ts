/**
 * Screenshot OCR processing with multi-monitor support
 */

import { BrowserWindow, screen, clipboard, dialog, ipcMain, nativeImage, app } from 'electron';
import { screen as nutScreen, Region } from '@nut-tree-fork/nut-js';
import path from 'node:path';
import { configStore } from '../services/config-store';
import { AIProviderFactory } from '../services/ai-provider';
import { createSettingsWindow } from '../windows/settings-window';

export type SelectionArea = {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId: number; // ID of the display where selection was made
};
export type DisplayBounds = {
  id: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  scaleFactor: number;
};

/**
 * Capture a screenshot area and extract text using OCR
 */
export const captureAndExtractText = async (): Promise<void> => {
  console.log('Capturing text with multi-monitor support');
  try {
    // Check if API key is configured
    if (!configStore.hasApiKey()) {
      dialog.showErrorBox('API Key Missing', 'Please configure your API key in settings');
      createSettingsWindow();
      return;
    }

    // Get all displays
    const allDisplays = screen.getAllDisplays();
    console.log('Displays found:', allDisplays.length);

    // Create one overlay window per display
    const selectionWindows: BrowserWindow[] = [];

    // HTML path for overlay
    const htmlPath = app.isPackaged
      ? path.join(__dirname, 'electron/text-processor/selection-overlay.html')
      : path.join(__dirname, '../../electron/text-processor/selection-overlay.html');

    for (const display of allDisplays) {
      const { bounds, id, scaleFactor } = display;
      console.log(`Creating overlay for display ${id}:`, bounds);

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
        fullscreen: false,
        webPreferences: {
          preload: app.isPackaged
            ? path.join(process.resourcesPath, 'electron/text-processor/selection-preload.js')
            : path.join(__dirname, 'selection-preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Send this display's info to the renderer
      selectionWindow.webContents.on('did-finish-load', () => {
        selectionWindow.webContents.send('display-bounds', {
          id,
          offsetX: bounds.x,
          offsetY: bounds.y,
          width: bounds.width,
          height: bounds.height,
          scaleFactor
        });
      });

      await selectionWindow.loadFile(htmlPath);
      selectionWindow.show();
      selectionWindows.push(selectionWindow);
    }

    console.log(`${selectionWindows.length} overlay windows shown`);

    // Wait for selection using IPC events from any window
    const selection = await new Promise<SelectionArea | null>((resolve) => {
      const cleanup = () => {
        ipcMain.removeListener('selection-made', handleSelection);
        ipcMain.removeListener('selection-cancelled', handleCancel);
        // Close all overlay windows
        selectionWindows.forEach(win => {
          if (!win.isDestroyed()) {
            win.close();
          }
        });
      };

      const handleSelection = (_event: any, selection: SelectionArea) => {
        console.log('Got selection via IPC:', selection);
        cleanup();
        resolve(selection);
      };

      const handleCancel = () => {
        console.log('Selection cancelled via IPC');
        cleanup();
        resolve(null);
      };

      // Listen for IPC events
      ipcMain.once('selection-made', handleSelection);
      ipcMain.once('selection-cancelled', handleCancel);

      // Handle window close - if any window is closed, cancel selection
      selectionWindows.forEach(win => {
        win.on('closed', () => {
          if (!win.isDestroyed()) {
            cleanup();
            resolve(null);
          }
        });
      });
    });

    if (!selection || selection.width < 10 || selection.height < 10) {
      console.log('No valid selection');
      return;
    }

    console.log('Screenshot selection:', selection);

    // Find the display where the selection was made
    const displayForSelection = allDisplays.find(d => d.id === selection.displayId);
    if (!displayForSelection) {
      console.error('Display not found for selection:', selection.displayId);
      return;
    }

    const scaleFactor = displayForSelection.scaleFactor || 1;
    const displayBounds = displayForSelection.bounds;

    // Convert window-relative coordinates to absolute screen coordinates
    // Selection x,y are relative to the overlay window (0,0 at top-left of display)
    // We need to add the display's offset to get absolute screen coordinates
    const absoluteX = selection.x + displayBounds.x;
    const absoluteY = selection.y + displayBounds.y;

    console.log('Selection is on display:', {
      id: displayForSelection.id,
      bounds: displayBounds,
      scaleFactor,
      absoluteCoords: { x: absoluteX, y: absoluteY }
    });

    // Create region with proper scaling
    const region = new Region(
      Math.round(absoluteX * scaleFactor),
      Math.round(absoluteY * scaleFactor),
      Math.round(selection.width * scaleFactor),
      Math.round(selection.height * scaleFactor)
    );

    console.log('Capturing region:', region);

    // Capture the selected area using nut.js
    const screenshot = await nutScreen.grabRegion(region);

    console.log('Screenshot captured:', {
      width: screenshot.width,
      height: screenshot.height,
      pixelDensity: screenshot.pixelDensity
    });

    // Create nativeImage from raw pixel buffer
    const image = nativeImage.createFromBuffer(
      Buffer.from(screenshot.data),
      {
        width: screenshot.width,
        height: screenshot.height,
        scaleFactor: screenshot.pixelDensity?.scaleX || 1
      }
    );

    // Convert to PNG buffer
    const imageBuffer = image.toPNG();

    console.log('Screenshot captured, sending to AI...');

    // Create AI provider
    const provider = AIProviderFactory.createProvider({
      apiKey: configStore.getApiKey(),
      provider: configStore.getProvider(),
    });

    // Extract text from image
    const extractedText = await provider.extractTextFromImage(imageBuffer);

    console.log('Extracted text:', extractedText);

    // Copy to clipboard
    clipboard.writeText(extractedText);

    // Show success notification
    dialog.showMessageBox({
      type: 'info',
      title: 'OCR Complete',
      message: 'Text extracted and copied to clipboard!',
      buttons: ['OK'],
    });

  } catch (error) {
    console.error('Screenshot OCR error:', error);
    dialog.showErrorBox('OCR Error', error instanceof Error ? error.message : 'Unknown error');
  }
};