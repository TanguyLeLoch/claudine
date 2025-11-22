/**
 * Global shortcuts management
 */

import { globalShortcut } from 'electron';
import { processText } from '../processor-engine/text-processor';
import { captureAndExtractText } from '../processor-engine/screenshot-processor';
import { logger } from '../utils/logger';

/**
 * Register global keyboard shortcuts
 */
export const registerShortcuts = (): void => {
  // Alt+F1: Fix typos
  globalShortcut.register('Alt+F1', () => {
    logger.info('Shortcut triggered: Alt+F1 (Fix Typos)');
    processText('fixTypos');
  });

  // Alt+F2: Translate to English
  globalShortcut.register('Alt+F2', () => {
    logger.info('Shortcut triggered: Alt+F2 (Translate to English)');
    processText('translateToEnglish');
  });

  // Alt+F3: Translate to French
  globalShortcut.register('Alt+F3', () => {
    logger.info('Shortcut triggered: Alt+F3 (Translate to French)');
    processText('translateToFrench');
  });

  // Alt+Shift+F2: Screenshot OCR
  globalShortcut.register('Alt+Shift+F2', () => {
    logger.info('Shortcut triggered: Alt+Shift+F2 (Screenshot OCR)');
    captureAndExtractText();
  });

  globalShortcut.register('Alt+Shift+F3', () => {
    logger.info('Shortcut triggered: Alt+Shift+F3 (Translate to Thai)');
    processText('translateToThai');
  });

  logger.info('Global shortcuts registered.');
};

/**
 * Unregister all global shortcuts
 */
export const unregisterShortcuts = (): void => {
  globalShortcut.unregisterAll();
  logger.info('Global shortcuts unregistered.');
};
