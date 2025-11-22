import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { type ShortcutConfig } from '../../../../types';

@Component({
  selector: 'app-shortcuts',
  standalone: true,
  imports: [CommonModule, Card, Tag, Tooltip],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss'
})
export class ShortcutsComponent implements OnInit {
  shortcuts: ShortcutConfig[] = [];

  async ngOnInit() {
    if (window.electronAPI) {
      try {
        this.shortcuts = await window.electronAPI.getShortcuts();
        console.log('Shortcuts loaded:', this.shortcuts);
      } catch (error) {
        console.error('Failed to load shortcuts:', error);
      }
    }
  }
}
