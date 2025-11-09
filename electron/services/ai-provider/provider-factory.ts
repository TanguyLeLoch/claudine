import { AIProvider, AIProviderConfig } from './types';
import { GeminiProvider } from './gemini-provider';

/**
 * Factory for creating AI provider instances
 * This allows easy switching between different providers
 */
export class AIProviderFactory {
  /**
   * Create an AI provider instance based on configuration
   * @param config Provider configuration
   * @returns An AI provider instance
   */
  static createProvider(config: AIProviderConfig): AIProvider {
    const provider = config.provider || 'gemini';

    switch (provider) {
      case 'gemini':
        return new GeminiProvider(config.apiKey);
      case 'gpt':
        // Future implementation for GPT provider
        throw new Error('GPT provider not yet implemented');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
