import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menu } from 'primeng/menu';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import type { MenuItem } from 'primeng/api';

declare global {
  interface Window {
    electronAPI: {
      getApiKey: () => Promise<string>;
      setApiKey: (apiKey: string) => Promise<void>;
      getProvider: () => Promise<'gemini' | 'gpt'>;
      setProvider: (provider: string) => Promise<void>;
      closeSettings: () => void;
      onShowToast: (callback: (message: string) => void) => void;
      onHideToast: (callback: () => void) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Menu,
    Button
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Claudine';

  menuItems: MenuItem[] = [
    {
      label: 'Shortcuts',
      icon: 'pi pi-bolt',
      routerLink: ['/shortcuts']
    },
    {
      label: 'API Settings',
      icon: 'pi pi-cog',
      routerLink: ['/settings']
    },
    {
      label: 'Logs',
      icon: 'pi pi-file',
      routerLink: ['/logs']
    }
  ];

  onClose() {
    if (window.electronAPI) {
      window.electronAPI.closeSettings();
    }
  }
}
