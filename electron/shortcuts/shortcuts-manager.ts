/**
 * Global shortcuts management
 */

import { globalShortcut } from 'electron';
import { processText } from '../text-processor/processor';
import { captureAndExtractText } from '../text-processor/screenshot-processor';

/**
 * Register global keyboard shortcuts
 */
export const registerShortcuts = (): void => {
  // Alt+F1: Fix typos
  globalShortcut.register('Alt+F1', () => {
    processText('fixTypos');
  });

  // Alt+F2: Translate to English
  globalShortcut.register('Alt+F2', () => {
    processText('translateToEnglish');
  });

  // Alt+F3: Translate to French
  globalShortcut.register('Alt+F3', () => {
    processText('translateToFrench');
  });

  // Alt+Shift+F2: Screenshot OCR
  globalShortcut.register('Alt+Shift+F2', () => {
    captureAndExtractText();
  });
};

/**
 * Unregister all global shortcuts
 */
export const unregisterShortcuts = (): void => {
  globalShortcut.unregisterAll();
};
