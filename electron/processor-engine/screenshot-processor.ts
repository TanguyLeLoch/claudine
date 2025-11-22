/**
 * Screenshot OCR processing with multi-monitor support
 */

import { clipboard, desktopCapturer, dialog, screen } from 'electron';
import { configStore } from '../services/config-store';
import { AIProviderFactory } from '../services/ai-provider';
import { createSettingsWindow } from '../windows/settings-window';
import { showToast } from '../windows/toast-window';
import { logger } from '../utils/logger';
import { selectScreenArea } from '../windows/overlay-window';
import Rectangle = Electron.Rectangle;

/**
 * Capture a screenshot area and process it with AI using data-driven dispatch
 * @param operationName The operation name (matches shortcut config 'name' field), defaults to 'Extract text from screenshot'
 */
export const captureAndExtractText = async (operationName: string = 'Extract text from screenshot'): Promise<void> => {
  logger.info(`Starting captureAndExtractText with operation: ${operationName}`);
  try {
    // Check if API key is configured
    if (!configStore.hasApiKey()) {
      logger.warn('API Key missing. Opening settings.');
      dialog.showErrorBox('API Key Missing', 'Please configure your API key in settings');
      createSettingsWindow();
      return;
    }

    // Look up shortcut configuration
    const shortcuts = configStore.getShortcuts();
    const shortcut = shortcuts.find(s => s.name === operationName && s.inputType === 'image');

    if (!shortcut) {
      logger.error(`Unknown image operation: ${operationName}`);
      showToast('Operation not found', { severity: 'error' });
      return;
    }

    // Get selection from user via overlay windows
    const selection = await selectScreenArea();

    if (!selection) {
      logger.info('No valid selection made (cancelled or failed).');
      return;
    }

    logger.info('Processing selection:', selection);

    // Get all displays to find the one for selection
    const allDisplays = screen.getAllDisplays();
    const displayForSelection = allDisplays.find(d => d.id === selection.displayId);
    if (!displayForSelection) {
      logger.error(`Display not found for selection ID: ${selection.displayId}`);
      return;
    }

    const scaleFactor = displayForSelection.scaleFactor || 1;

    logger.info('Capturing display source...');
    // Capture the ENTIRE display (no coordinate issues!)
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: displayForSelection.bounds.width * scaleFactor,
        height: displayForSelection.bounds.height * scaleFactor
      }
    });
    const source = sources.find(s => s.display_id == String(selection.displayId));

    if (!source) {
      logger.error(`Could not find screen source for display ${selection.displayId}`);
      return;
    }

    const screenshot = source.thumbnail; // This is a NativeImage

    const rect: Rectangle = {
      x: selection.x * scaleFactor,
      y: selection.y * scaleFactor,
      width: selection.width * scaleFactor,
      height: selection.height * scaleFactor
    };

    logger.info(`Cropping screenshot with rect: ${JSON.stringify(rect)}`);
    const cropped = screenshot.crop(rect);

    logger.info('Image cropped. Sending to AI...');

    // Show toast notification using name from config
    showToast(shortcut.name, { type: 'loading' });

    // Create AI provider
    const provider = AIProviderFactory.createProvider({
      apiKey: configStore.getApiKey(),
      provider: configStore.getProvider(),
    });

    // Process image using the prompt from config
    const extractedText = await provider.processImage(shortcut.prompt, cropped.toPNG());

    logger.info('Text extraction complete.');
    logger.debug(`Extracted text: ${extractedText.substring(0, 50)}...`);

    // Copy to clipboard
    clipboard.writeText(extractedText);

    // Show success (PrimeNG auto-dismisses after 3 seconds via life: 3000)
    showToast('Text extracted and copied!', { severity: 'success' });

  } catch (error) {
    // Show error (PrimeNG auto-dismisses after 3 seconds via life: 3000)
    showToast('OCR Failed', { severity: 'error' });

    logger.error('Error in captureAndExtractText:', error);
    if (error instanceof Error) {
      logger.error(error.stack);
    }
    // dialog.showErrorBox('OCR Error', error instanceof Error ? error.message : 'Unknown error');
  }
};
