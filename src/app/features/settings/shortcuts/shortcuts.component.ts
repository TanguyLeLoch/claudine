import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';

interface Shortcut {
  key: string;
  description: string;
}

@Component({
  selector: 'app-shortcuts',
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss'
})
export class ShortcutsComponent {
  shortcuts: Shortcut[] = [
    { key: 'Alt+F1', description: 'Fix typos and grammar' },
    { key: 'Alt+F2', description: 'Translate to English' },
    { key: 'Alt+F3', description: 'Translate to French' },
    { key: 'Alt+Shift+F2', description: 'Screenshot OCR - Extract text from screen area' }
  ];
}
