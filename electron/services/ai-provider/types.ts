/**
 * AI Provider interface for text processing operations
 * This abstraction allows switching between different AI providers (Gemini, GPT, etc.)
 */
export interface AIProvider {
  /**
   * Fix typos and grammar in the provided text
   * @param text The text to fix
   * @returns The corrected text
   */
  fixTypos(text: string): Promise<string>;

  /**
   * Translate text to English
   * @param text The text to translate
   * @returns The translated text in English
   */
  translateToEnglish(text: string): Promise<string>;

  /**
   * Translate text to French
   * @param text The text to translate
   * @returns The translated text in French
   */
  translateToFrench(text: string): Promise<string>;
}

/**
 * Configuration for AI providers
 */
export interface AIProviderConfig {
  apiKey: string;
  provider?: 'gemini' | 'gpt'; // Can be extended with more providers
}
