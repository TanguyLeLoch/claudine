/**
 * Text processing with AI provider
 */

import { clipboard, dialog } from 'electron';
import { keyboard, Key } from '@nut-tree-fork/nut-js';
import { configStore } from '../services/config-store';
import { AIProviderFactory } from '../services/ai-provider';
import { sleep } from '../utils/helpers';
import { createSettingsWindow } from '../windows/settings-window';
import { showToast, hideToast } from '../toast/toast-window-manager';

export type TextOperation = 'fixTypos' | 'translateToEnglish' | 'translateToFrench';

/**
 * Process selected text with AI provider
 * @param operation The operation to perform
 */
export const processText = async (operation: TextOperation): Promise<void> => {
  try {
    // Check if API key is configured
    if (!configStore.hasApiKey()) {
      dialog.showErrorBox('API Key Missing', 'Please configure your API key in settings');
      createSettingsWindow();
      return;
    }

    // Save original clipboard
    const originalClipboard = clipboard.readText();
    console.log("originalClipboard", originalClipboard);
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

    // Show toast notification
    const operationMessages: Record<TextOperation, string> = {
      fixTypos: 'Fixing typos and grammar...',
      translateToEnglish: 'Translating to English...',
      translateToFrench: 'Translating to French...',
    };
    showToast(operationMessages[operation]);

    // Create AI provider
    const provider = AIProviderFactory.createProvider({
      apiKey: configStore.getApiKey(),
      provider: configStore.getProvider(),
    });

    // Process the text
    let result: string;
    switch (operation) {
      case 'fixTypos':
        result = await provider.fixTypos(selectedText);
        break;
      case 'translateToEnglish':
        result = await provider.translateToEnglish(selectedText);
        break;
      case 'translateToFrench':
        result = await provider.translateToFrench(selectedText);
        break;
    }

    console.log(result);

    // Write result to clipboard
    clipboard.writeText(result);

    // Auto-paste the result
    await sleep(100);
    console.log(`will try to ${process.platform === 'darwin' ? 'Cmd' : 'Ctrl'} + v the response ${result}`);
    await keyboard.type(modifierKey, Key.V);

    // Restore original clipboard after a delay
    await sleep(500);
    clipboard.writeText(originalClipboard);

    // Hide toast notification
    hideToast();

  } catch (error) {
    hideToast();
    dialog.showErrorBox('Processing Error', error instanceof Error ? error.message : 'Unknown error');
  }
};
