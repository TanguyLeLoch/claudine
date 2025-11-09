import Store, { type Schema } from 'electron-store';

/**
 * Application configuration schema
 */
type ConfigSchema = {
  apiKey: string;
  provider: 'gemini' | 'gpt';
};

const schema: Schema<ConfigSchema> = {
  apiKey: {
    type: 'string',
    default: '',
  },
  provider: {
    type: 'string',
    default: 'gemini',
  },
};

/**
 * Configuration store for persisting app settings
 */
export class ConfigStore {
  private store: any; // Using any to bypass type issues with electron-store

  constructor() {
    this.store = new Store<ConfigSchema>({
      schema,
      // Encrypt the store for security
      encryptionKey: 'ai-shortcut-encryption-key-change-in-production',
    });
  }

  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.store.get('apiKey') as string;
  }

  /**
   * Set the API key
   */
  setApiKey(apiKey: string): void {
    this.store.set('apiKey', apiKey);
  }

  /**
   * Get the current provider
   */
  getProvider(): 'gemini' | 'gpt' {
    return this.store.get('provider') as 'gemini' | 'gpt';
  }

  /**
   * Set the provider
   */
  setProvider(provider: 'gemini' | 'gpt'): void {
    this.store.set('provider', provider);
  }

  /**
   * Check if API key is configured
   */
  hasApiKey(): boolean {
    const apiKey = this.getApiKey();
    return apiKey !== null && apiKey !== undefined && apiKey.trim() !== '';
  }
}

// Export a singleton instance
export const configStore = new ConfigStore();
