import Store, { type Schema } from 'electron-store';

/**
 * Shortcut configuration interface
 */
export interface ShortcutConfig {
  key: string;
  name: string;
  description: string;
  prompt: string;
  inputType: 'text' | 'image';
}

/**
 * Application configuration schema
 */
type ConfigSchema = {
  apiKey: string;
  provider: 'gemini' | 'gpt';
  shortcuts: ShortcutConfig[];
};

/**
 * Default shortcuts configuration
 */
const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'Alt+F1',
    name: 'fixTypos',
    description: 'Fix typos and grammar',
    prompt: 'Fix any typos and grammar mistakes in the following text. Return ONLY the corrected text without any explanations or additional comments:',
    inputType: 'text'
  },
  {
    key: 'Alt+F2',
    name: 'translateToEnglish',
    description: 'Translate to English',
    prompt: 'Translate the following text to ENGLISH. Return ONLY the translated text without any explanations or additional comments:',
    inputType: 'text'
  },
  {
    key: 'Alt+F3',
    name: 'translateToFrench',
    description: 'Translate to French',
    prompt: 'Translate the following text to FRENCH. Return ONLY the translated text without any explanations or additional comments:',
    inputType: 'text'
  },
  {
    key: 'Alt+Shift+F2',
    name: 'screenshotOCR',
    description: 'Screenshot OCR - Extract text from screen area',
    prompt: 'Extract all text from this image. Return ONLY the extracted text, maintaining the original layout and structure as much as possible.',
    inputType: 'image'
  }
];

const schema: Schema<ConfigSchema> = {
  apiKey: {
    type: 'string',
    default: '',
  },
  provider: {
    type: 'string',
    default: 'gemini',
  },
  shortcuts: {
    type: 'array',
    default: DEFAULT_SHORTCUTS,
    items: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        prompt: { type: 'string' },
        inputType: { type: 'string', enum: ['text', 'image'] }
      }
    }
  }
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

  /**
   * Get shortcuts configuration
   */
  getShortcuts(): ShortcutConfig[] {
    return this.store.get('shortcuts') as ShortcutConfig[];
  }

  /**
   * Set shortcuts configuration
   */
  setShortcuts(shortcuts: ShortcutConfig[]): void {
    this.store.set('shortcuts', shortcuts);
  }
}

// Export a singleton instance
export const configStore = new ConfigStore();
