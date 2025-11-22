/**
 * Screenshot OCR processing with multi-monitor support
 */

import { screen, clipboard, dialog, desktopCapturer } from 'electron';
import { configStore } from '../services/config-store';
import { AIProviderFactory } from '../services/ai-provider';
import { createSettingsWindow } from '../windows/settings-window';
import { showToast, hideToast } from '../windows/toast-window';
import { logger } from '../utils/logger';
import { selectScreenArea, SelectionArea } from '../windows/overlay-window';
import Rectangle = Electron.Rectangle;

/**
 * Capture a screenshot area and extract text using OCR
 */
export const captureAndExtractText = async (): Promise<void> => {
  logger.info('Starting captureAndExtractText...');
  try {
    // Check if API key is configured
    if (!configStore.hasApiKey()) {
      logger.warn('API Key missing. Opening settings.');
      dialog.showErrorBox('API Key Missing', 'Please configure your API key in settings');
      createSettingsWindow();
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

    // Show toast notification
    showToast('Extracting text from image...');

    // Create AI provider
    const provider = AIProviderFactory.createProvider({
      apiKey: configStore.getApiKey(),
      provider: configStore.getProvider(),
    });

    // Extract text from image
    const extractedText = await provider.extractTextFromImage(cropped.toPNG());

    logger.info('Text extraction complete.');
    logger.debug(`Extracted text: ${extractedText.substring(0, 50)}...`);

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
    logger.error('Error in captureAndExtractText:', error);
    if (error instanceof Error) {
         logger.error(error.stack);
    }
    dialog.showErrorBox('OCR Error', error instanceof Error ? error.message : 'Unknown error');
  }
};
