

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Card } from 'primeng/card';
import { CommonModule } from '@angular/common';

interface Provider {
  label: string;
  value: 'gemini' | 'gpt';
  disabled?: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, Button, Select, Card, Message, FormsModule, InputText],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss' // Use styleUrl instead of styleUrls for a single file
})
export class SettingsComponent implements OnInit {
  apiKey: string = '';
  selectedProvider: Provider | undefined;

  providers: Provider[] = [
    { label: 'Google Gemini', value: 'gemini' },
    { label: 'OpenAI GPT (Coming soon)', value: 'gpt', disabled: true }
  ];

  async ngOnInit() {
    if (window.electronAPI) {
      const apiKey = await window.electronAPI.getApiKey();
      const provider = await window.electronAPI.getProvider();

      this.apiKey = apiKey || '';
      this.selectedProvider = this.providers.find(p => p.value === provider);
    }
  }

  async onSave() {
    if (window.electronAPI) {
      await window.electronAPI.setApiKey(this.apiKey);
      if (this.selectedProvider) {
        await window.electronAPI.setProvider(this.selectedProvider.value);
      }
    }
  }
}