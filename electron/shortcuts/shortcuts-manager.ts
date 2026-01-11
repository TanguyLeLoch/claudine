/**
 * Global shortcuts management with dynamic registration and live reloading
 */

import { globalShortcut } from 'electron';
import { processText } from '../processor-engine/text-processor';
import { captureAndExtractText } from '../processor-engine/screenshot-processor';
import { configStore, type ShortcutConfig } from '../services/config-store';
import { logger } from '../utils/logger';
import { showLauncherWindow } from '../windows/launcher-window';

// Flag to prevent race conditions during reload
let isReloading = false;

/**
 * Execute the action associated with a shortcut
 */
export const triggerShortcutAction = (shortcut: ShortcutConfig): void => {
  // Dispatch based on input type
  if (shortcut.inputType === 'text') {
    processText(shortcut.id).catch(err =>
      logger.error('Text processing error:', err)
    );
  } else if (shortcut.inputType === 'image') {
    captureAndExtractText(shortcut.id).catch(err =>
      logger.error('Image processing error:', err)
    );
  } else if (shortcut.inputType === 'launcher') {
    showLauncherWindow();
  } else {
    logger.warn(`Unknown input type for shortcut ${shortcut.name} (${shortcut.id}): ${shortcut.inputType}`);
  }
};

/**
 * Unregister all global shortcuts
 * Safe to call even if no shortcuts are registered
 */
export const unregisterShortcuts = (): void => {
  globalShortcut.unregisterAll();
  logger.info('Global shortcuts unregistered.');
};

/**
 * Register global keyboard shortcuts dynamically from configuration
 */
export const registerShortcuts = (): void => {
  try {
    const shortcuts = configStore.getShortcuts();

    if (!shortcuts || shortcuts.length === 0) {
      logger.warn('No shortcuts found in configuration.');
      return;
    }

    let registeredCount = 0;

    shortcuts.forEach(shortcut => {
      // Validate shortcut has required fields
      if (!shortcut.key) {
        logger.warn('Skipping invalid shortcut config: missing key');
        return;
      }

      try {
        // Attempt to register the shortcut
        const isRegistered = globalShortcut.register(shortcut.key, () => {
          logger.info(`Shortcut triggered: ${shortcut.key} → ${shortcut.name} (${shortcut.id})`);
          triggerShortcutAction(shortcut);
        });

        if (isRegistered) {
          registeredCount++;
          logger.debug(`Registered: ${shortcut.key} → ${shortcut.name} (${shortcut.id})`);
        } else {
          logger.warn(`Failed to register: ${shortcut.key}. It might be used by another app.`);
        }

      } catch (innerError) {
        logger.error(`Error registering specific shortcut ${shortcut.key}:`, innerError);
      }
    });

    logger.info(`Successfully registered ${registeredCount}/${shortcuts.length} shortcuts.`);

  } catch (error) {
    logger.error('Critical error in registerShortcuts:', error);
  }
};

/**
 * Set up live reloading for shortcuts configuration changes
 * Subscribes to config store and re-registers shortcuts when they change
 */
export const setupShortcutsReloading = (): void => {
  configStore.onShortcutsChange((newShortcuts) => {
    // Prevent race conditions if multiple saves happen simultaneously
    if (isReloading) {
      logger.debug('Already reloading shortcuts, skipping...');
      return;
    }

    isReloading = true;
    logger.info(`Shortcuts configuration changed (${newShortcuts.length} shortcuts). Reloading...`);

    try {
      unregisterShortcuts();
      registerShortcuts();
      logger.info('Shortcuts reloaded successfully.');
    } catch (error) {
      logger.error('Failed to reload shortcuts:', error);
    } finally {
      isReloading = false;
    }
  });

      logger.info('Shortcuts live reloading enabled.');
  };
  
  /**
   * Temporarily unregister all shortcuts (e.g., during recording)
   */
  export const suspendGlobalShortcuts = (): void => {
    logger.info('Suspending all global shortcuts...');
    globalShortcut.unregisterAll();
  };
  
  /**
   * Resume shortcuts by re-registering them from the store
   */
  export const resumeGlobalShortcuts = (): void => {
    logger.info('Resuming global shortcuts...');
    registerShortcuts();
  };
