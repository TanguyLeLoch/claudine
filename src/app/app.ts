import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

declare global {
  interface Window {
    electronAPI: {
      toggleShortcut: (shortcut: string, enabled: boolean) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CheckboxModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Claudine';
  
  shortcut2Enabled = false;
  shortcut3Enabled = false;
  shortcut4Enabled = false;

  onShortcut2Change(event: any) {
    this.shortcut2Enabled = event.checked;
    if (window.electronAPI) {
      window.electronAPI.toggleShortcut('Alt+F2', this.shortcut2Enabled);
    }
  }

  onShortcut3Change(event: any) {
    this.shortcut3Enabled = event.checked;
    if (window.electronAPI) {
      window.electronAPI.toggleShortcut('Alt+F3', this.shortcut3Enabled);
    }
  }

  onShortcut4Change(event: any) {
    this.shortcut4Enabled = event.checked;
    if (window.electronAPI) {
      window.electronAPI.toggleShortcut('Alt+F4', this.shortcut4Enabled);
    }
  }
}
