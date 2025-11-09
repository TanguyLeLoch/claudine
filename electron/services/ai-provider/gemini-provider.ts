import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './types';

/**
 * Gemini AI Provider implementation
 */
export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async fixTypos(text: string): Promise<string> {
    console.log('fixTypos(text)', text);
    const prompt = `Fix any typos and grammar mistakes in the following text. Return ONLY the corrected text without any explanations or additional comments:\n\n${text}`;

    try {
      const result = await this.model.generateContent(prompt);
      console.log('result' , result);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error fixing typos:', error);
      throw new Error(`Failed to fix typos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async translateToEnglish(text: string): Promise<string> {
    const prompt = `Translate the following text to English. Return ONLY the translated text without any explanations or additional comments:\n\n${text}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error translating to English:', error);
      throw new Error(`Failed to translate to English: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async translateToFrench(text: string): Promise<string> {
    const prompt = `Translate the following text to French. Return ONLY the translated text without any explanations or additional comments:\n\n${text}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error translating to French:', error);
      throw new Error(`Failed to translate to French: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
