/**
 * Screenshot OCR processing with multi-monitor support
 */

import { BrowserWindow, screen, clipboard, dialog, ipcMain, nativeImage, app } from 'electron';
// import { screen as nutScreen } from '@nut-tree-fork/nut-js';
import { imageToJimp } from '@nut-tree-fork/shared';
import { desktopCapturer } from 'electron';

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { configStore } from '../services/config-store';
import { AIProviderFactory } from '../services/ai-provider';
import { createSettingsWindow } from '../windows/settings-window';
import { showToast, hideToast } from '../toast/toast-window-manager';
import Rectangle = Electron.Rectangle;

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
        console.log('display bounds', {
          id,
          offsetX: bounds.x,
          offsetY: bounds.y,
          width: bounds.width,
          height: bounds.height,
          scaleFactor
        });
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

    if (!selection) {
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

    console.log('Capturing display:', {
      id: displayForSelection.id,
      bounds: displayForSelection.bounds,
      scaleFactor,
      selection: { x: selection.x, y: selection.y, width: selection.width, height: selection.height }
    });

    // Capture the ENTIRE display (no coordinate issues!)
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: displayForSelection.bounds.width * scaleFactor,
        height: displayForSelection.bounds.height * scaleFactor
      }
    });
    const source = sources.find(s => s.display_id == String(selection.displayId));
    const screenshot = source!.thumbnail; // This is a NativeImage
    const res = screenshot.toPNG()
    fs.writeFileSync( `/Users/tanguy.leloch/dev/claudine/temp/${Date.now()}.png`, res);


    const rect  : Rectangle= selection;
    rect.x *= scaleFactor;
    rect.y  *= scaleFactor;
    rect.width *= scaleFactor;
    rect.height  *= scaleFactor;


    const cropped = screenshot.crop(rect)
    // fs.writeFileSync( `/Users/tanguy.leloch/dev/claudine/temp/cropped${Date.now()}.png`, cropped.toPNG());
    // const imageBuffer = screenshot.toPNG();


    console.log('Image cropped and converted to PNG');

    // Save screenshot for debugging
    const screenshotDir = path.join(os.homedir(), 'claudine-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // const screenshotPath = path.join(screenshotDir, `screenshot-${timestamp}.png`);
    // fs.writeFileSync(screenshotPath, cropped.toPNG());
    // console.log('Screenshot saved to:', screenshotPath);

    console.log('Screenshot captured, sending to AI...');

    // Show toast notification
    showToast('Extracting text from image...');

    // Create AI provider
    const provider = AIProviderFactory.createProvider({
      apiKey: configStore.getApiKey(),
      provider: configStore.getProvider(),
    });

    // Extract text from image
    const extractedText = await provider.extractTextFromImage(cropped.toPNG());

    console.log('Extracted text:', extractedText);

    // Copy to clipboard
    clipboard.writeText(extractedText);

    // Hide toast notification
    hideToast();

    // Show success notification
    dialog.showMessageBox({
      type: 'info',
      title: 'OCR Complete',
      message: 'Text extracted and copied to clipboard!',
      buttons: ['OK'],
    });

  } catch (error) {
    hideToast();
    console.error('Screenshot OCR error:', error);
    dialog.showErrorBox('OCR Error', error instanceof Error ? error.message : 'Unknown error');
  }
};