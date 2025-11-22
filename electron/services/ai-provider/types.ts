/**
 * AI Provider interface for text and image processing operations
 * This abstraction allows switching between different AI providers (Gemini, GPT, etc.)
 * Uses data-driven dispatch with prompts from configuration
 */
export interface AIProvider {
  /**
   * Process text using a dynamic AI prompt
   * @param prompt The instruction prompt (loaded from config)
   * @param text The user's selected text
   * @returns The processed text
   */
  processText(prompt: string, text: string): Promise<string>;

  /**
   * Process an image using a dynamic AI prompt
   * @param prompt The instruction prompt (loaded from config)
   * @param imageBuffer The raw image buffer (screenshot)
   * @returns The extracted or processed text
   */
  processImage(prompt: string, imageBuffer: Buffer): Promise<string>;
}

/**
 * Configuration for AI providers
 */
export interface AIProviderConfig {
  apiKey: string;
  provider?: 'gemini' | 'gpt'; // Can be extended with more providers
}
