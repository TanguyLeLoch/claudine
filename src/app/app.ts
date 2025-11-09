import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Card } from 'primeng/card';
import { FloatLabel } from 'primeng/floatlabel';

declare global {
  interface Window {
    electronAPI: {
      getApiKey: () => Promise<string>;
      setApiKey: (apiKey: string) => Promise<void>;
      getProvider: () => Promise<'gemini' | 'gpt'>;
      setProvider: (provider: string) => Promise<void>;
      closeSettings: () => void;
    };
  }
}

interface Provider {
  label: string;
  value: 'gemini' | 'gpt';
  disabled?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FormsModule,
    InputText,
    Select,
    Button,
    Message,
    Card,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'Claudine - AI Text Processor';

  apiKey: string = '';
  selectedProvider: Provider | undefined;

  providers: Provider[] = [
    { label: 'Google Gemini', value: 'gemini' },
    { label: 'OpenAI GPT (Coming soon)', value: 'gpt', disabled: true }
  ];

  shortcuts = [
    { key: 'Alt+F1', description: 'Fix typos and grammar' },
    { key: 'Alt+F2', description: 'Translate to English' },
    { key: 'Alt+F3', description: 'Translate to French' }
  ];

  async ngOnInit() {
    // Load current settings
    if (window.electronAPI) {
      const apiKey = await window.electronAPI.getApiKey();
      const provider = await window.electronAPI.getProvider();

      this.apiKey = apiKey || '';
      this.selectedProvider = this.providers.find(p => p.value === provider);
    }
  }

  async onSave() {
    console.log('save api key', this.apiKey);
    if (window.electronAPI) {
      await window.electronAPI.setApiKey(this.apiKey);
      if (this.selectedProvider) {
        await window.electronAPI.setProvider(this.selectedProvider.value);
      }
      window.electronAPI.closeSettings();
    }
  }

  onCancel() {
    if (window.electronAPI) {
      window.electronAPI.closeSettings();
    }
  }
}
