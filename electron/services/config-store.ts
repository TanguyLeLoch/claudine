import Store, { type Schema } from 'electron-store';
import { ShortcutConfig } from '../../shared/ipc-types';
import { logger } from '../utils/logger';

// Re-export ShortcutConfig for backward compatibility
export type { ShortcutConfig } from '../../shared/ipc-types';

/**
 * Application configuration schema
 */
type ConfigSchema = {
  apiKey: string;
  provider: 'gemini' | 'gpt';
  shortcuts: ShortcutConfig[];
};

/**
 * Default shortcuts with hardcoded UUIDs (generated 2026-01-11)
 */
const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  {
    id: '019bac10-5c17-7a85-a1f8-e8e5c6db33c6',
    key: 'F1',
    name: 'Open Launcher',
    prompt: '',
    inputType: 'launcher',
    locked: true
  },
  {
    id: '019bac10-5c1a-7fc0-8b21-5c77287d109f',
    key: 'Alt+F1',
    name: 'Fix typos and grammar',
    prompt: 'Fix any typos and grammar mistakes in the following text. Return ONLY the corrected text without any explanations or additional comments:',
    inputType: 'text'
  },
  {
    id: '019bac10-5c1a-7fc0-8b21-5c78a1ef7a2f',
    key: 'Alt+F2',
    name: 'Translate to English',
    prompt: 'Translate the following text to ENGLISH. Return ONLY the translated text without any explanations or additional comments:',
    inputType: 'text'
  },
  {
    id: '019bac10-5c1a-7fc0-8b21-5c7957f77846',
    key: 'Alt+F3',
    name: 'Translate to French',
    prompt: 'Translate the following text to FRENCH. Return ONLY the translated text without any explanations or additional comments:',
    inputType: 'text'
  },
  {
    id: '019bac10-5c1a-7fc0-8b21-5c7a5f6d6bc8',
    key: 'Alt+Shift+F2',
    name: 'Extract text from screenshot',
    prompt: 'Extract all text from this image. Return ONLY the extracted text, maintaining the original layout and structure as much as possible.',
    inputType: 'image'
  },
  {
    id: '019bac10-5c1a-7fc0-8b21-5c7bf01d2d63',
    key: 'Alt+Shift+F3',
    name: 'Translate to Thai',
    prompt: 'Translate the following text to Thai. I am a man. Return ONLY the translated text without any explanations or additional comments:',
    inputType: 'text'
  },
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
        id: {type: 'string'},
        key: {type: 'string'},
        name: {type: 'string'},
        prompt: {type: 'string'},
        inputType: {type: 'string', enum: ['text', 'image', 'launcher']},
        locked: {type: 'boolean'}
      }
    }
  }
};

/**
 * Configuration store for persisting app settings
 * Uses Observer Pattern (callback-based) for live reload functionality
 */
export class ConfigStore {
  private store: any; // Using any to bypass type issues with electron-store
  private shortcutsChangeListeners: Array<(shortcuts: ShortcutConfig[]) => void> = [];

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
   * Resets to defaults if stored shortcuts don't have IDs (migration)
   */
  getShortcuts(): ShortcutConfig[] {
    const shortcuts = this.store.get('shortcuts') as ShortcutConfig[];

    logger.debug(`getShortcuts: retrieved ${shortcuts?.length ?? 0} shortcuts from store`);

    // Migration: if shortcuts exist but don't have IDs, reset to defaults
    if (!shortcuts || shortcuts.length === 0 || !shortcuts[0]?.id) {
      logger.info(`getShortcuts: Migration triggered (count=${shortcuts?.length ?? 0}, hasId=${!!shortcuts?.[0]?.id})`);
      this.logDefaultShortcuts();
      this.store.set('shortcuts', DEFAULT_SHORTCUTS);
      return DEFAULT_SHORTCUTS;
    }
    return shortcuts;
  }

  /**
   * Reset shortcuts to default configuration
   * Returns the default shortcuts for convenience
   */
  resetToDefaults(): ShortcutConfig[] {
    logger.info('Resetting shortcuts to defaults');
    this.logDefaultShortcuts();
    this.store.set('shortcuts', DEFAULT_SHORTCUTS);
    this.notifyShortcutsListeners(DEFAULT_SHORTCUTS);
    return DEFAULT_SHORTCUTS;
  }

  /**
   * Log default shortcuts summary for debugging
   */
  private logDefaultShortcuts(): void {
    const summary = DEFAULT_SHORTCUTS.map(s => ({ id: s.id, key: s.key, name: s.name }));
    logger.debug(`Default shortcuts: ${JSON.stringify(summary)}`);
  }

  /**
   * Set shortcuts configuration
   * Notifies all listeners when shortcuts change
   */
  setShortcuts(shortcuts: ShortcutConfig[]): void {
    this.store.set('shortcuts', shortcuts);
    this.notifyShortcutsListeners(shortcuts);
  }

  /**
   * Subscribe to shortcuts configuration changes
   * @param listener Callback function invoked when shortcuts change
   */
  onShortcutsChange(listener: (shortcuts: ShortcutConfig[]) => void): void {
    this.shortcutsChangeListeners.push(listener);
  }

  /**
   * Notify all listeners about shortcuts changes
   * @private
   */
  private notifyShortcutsListeners(shortcuts: ShortcutConfig[]): void {
    this.shortcutsChangeListeners.forEach(listener => {
      try {
        listener(shortcuts);
      } catch (error) {
        console.error('Error in shortcuts change listener:', error);
      }
    });
  }
}

// Export a singleton instance
export const configStore = new ConfigStore();
