/**
 * Global shortcuts management
 */

import { globalShortcut } from 'electron';
import { processText } from '../text-processor/processor';

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
};

/**
 * Unregister all global shortcuts
 */
export const unregisterShortcuts = (): void => {
  globalShortcut.unregisterAll();
};
