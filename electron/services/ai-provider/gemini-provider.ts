import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './types';
import { logger } from '../../utils/logger';
/**
 * Gemini AI Provider implementation
 * Uses data-driven dispatch with configurable prompts
 */
export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }

  /**
   * Process text using a dynamic prompt from configuration
   */
  async processText(fullPrompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini text processing error:', error);
      throw new Error(`Failed to process text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process an image using a dynamic prompt from configuration
   */
  async processImage(prompt: string, imageBuffer: Buffer): Promise<string> {
    try {
      // Convert buffer to base64 for Gemini API
      const base64Image = imageBuffer.toString('base64');

      // Send prompt and image to Gemini
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/png'
          }
        }
      ]);

      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini image processing error:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
