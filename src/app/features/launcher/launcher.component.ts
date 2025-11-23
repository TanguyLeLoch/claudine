import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { type ShortcutConfig } from '../../../types';
import { InputTypeBadgeComponent } from '../../shared/components/input-type-badge/input-type-badge.component';

@Component({
  selector: 'app-launcher',
  standalone: true,
  imports: [CommonModule, CardModule, InputTypeBadgeComponent],
  templateUrl: './launcher.component.html',
  styleUrl: './launcher.component.scss'
})
export class LauncherComponent implements OnInit {
  displayShortcuts: ShortcutConfig[] = [];
  isLoading = true;
  selectedIndex = 0;

  async ngOnInit() {
    await this.loadShortcuts();
  }

  async loadShortcuts() {
    if (window.electronAPI) {
      try {
        const allShortcuts = await window.electronAPI.getShortcuts();
        // Filter out the launcher itself
        this.displayShortcuts = allShortcuts.filter(s => s.inputType !== 'launcher');
      } catch (error) {
        console.error('Failed to load shortcuts:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent) {
    // Prevent default for navigation keys
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
      event.preventDefault();
    }

    // Close launcher on Escape
    if (event.key === 'Escape') {
      if (window.electronAPI) {
        window.electronAPI.closeLauncher();
      }
      return;
    }

    // Check for number keys 1-9
    const keyNumber = parseInt(event.key);
    if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 9) {
      const index = keyNumber - 1;
      if (index < this.displayShortcuts.length) {
        this.triggerShortcut(this.displayShortcuts[index]);
      }
      return;
    }

    // Arrow navigation
    if (event.key === 'ArrowDown') {
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.displayShortcuts.length - 1);
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    } else if (event.key === 'Enter') {
      if (this.displayShortcuts[this.selectedIndex]) {
        this.triggerShortcut(this.displayShortcuts[this.selectedIndex]);
      }
    }
  }

  triggerShortcut(shortcut: ShortcutConfig) {
    console.log('Triggered shortcut:', shortcut.name, shortcut.key);
    // Future: window.electronAPI.executeShortcut(shortcut.name);
  }

  onShortcutClick(shortcut: ShortcutConfig, index: number) {
    this.selectedIndex = index;
    this.triggerShortcut(shortcut);
  }

  trackByName(index: number, shortcut: ShortcutConfig): string {
    return shortcut.name;
  }
}
