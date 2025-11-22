/**
 * Text processing with AI provider
 */

import { clipboard, dialog } from 'electron';
import { Key, keyboard } from '@nut-tree-fork/nut-js';
import { configStore } from '../services/config-store';
import { AIProviderFactory } from '../services/ai-provider';
import { sleep } from '../utils/helpers';
import { createSettingsWindow } from '../windows/settings-window';
import { showToast } from '../windows/toast-window';
import { logger } from '../utils/logger';

/**
 * Operation is now a string key matching the shortcut's 'name' field in config
 */
export type TextOperation = string;

/**
 * Process selected text with AI provider using data-driven dispatch
 * @param operationName The operation name (matches shortcut config 'name' field)
 */
export const processText = async (operationName: string): Promise<void> => {
  try {
    // Check if API key is configured
    if (!configStore.hasApiKey()) {
      dialog.showErrorBox('API Key Missing', 'Please configure your API key in settings');
      createSettingsWindow();
      return;
    }

    // Look up shortcut configuration
    const shortcuts = configStore.getShortcuts();
    const shortcut = shortcuts.find(s => s.name === operationName && s.inputType === 'text');

    if (!shortcut) {
      logger.error(`Unknown text operation: ${operationName}`);
      showToast('Operation not found', { severity: 'error' });
      return;
    }

    // Save original clipboard
    const originalClipboard = clipboard.readText();
    logger.debug("originalClipboard: " + originalClipboard);
    // Simulate copy (Cmd+C on Mac, Ctrl+C elsewhere)
    const modifierKey = process.platform === 'darwin' ? Key.LeftSuper : Key.LeftControl;
    await keyboard.type(modifierKey, Key.C);

    // Wait and verify clipboard changed
    await sleep(100);
    let attempts = 0;
    while (clipboard.readText() === originalClipboard && attempts < 10) {
      await sleep(50);
      attempts++;
    }

    const selectedText = clipboard.readText();

    if (!selectedText || selectedText.trim() === '') {
      dialog.showErrorBox('No Text Selected', 'Please select some text first');
      return;
    }

    // Show toast notification using description from config
    showToast(shortcut.description, { type: 'loading' });

    // Create AI provider
    const provider = AIProviderFactory.createProvider({
      apiKey: configStore.getApiKey(),
      provider: configStore.getProvider(),
    });

    // Process the text using the prompt from config
    const result = await provider.processText(shortcut.prompt, selectedText);

    logger.debug("AI Result: " + result);

    // Write result to clipboard
    clipboard.writeText(result);

    // Auto-paste the result
    await sleep(100);
    logger.info(`Auto-pasting response (attempting ${process.platform === 'darwin' ? 'Cmd' : 'Ctrl'} + V)`);
    await keyboard.type(modifierKey, Key.V);

    // Restore original clipboard after a delay
    await sleep(500);
    clipboard.writeText(originalClipboard);

    // Show success (PrimeNG auto-dismisses after 3 seconds via life: 3000)
    showToast('Done!', { severity: 'success' });

  } catch (error) {
    // Show error (PrimeNG auto-dismisses after 3 seconds via life: 3000)
    showToast('Error processing text', { severity: 'error' });

    logger.error('Processing Error', error);
    // dialog.showErrorBox('Processing Error', error instanceof Error ? error.message : 'Unknown error');
  }
};
