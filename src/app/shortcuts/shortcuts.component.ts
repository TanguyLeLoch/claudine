import { Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-shortcuts',
  imports: [Card],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss'
})
export class ShortcutsComponent {
  shortcuts = [
    { key: 'Alt+F1', description: 'Fix typos and grammar' },
    { key: 'Alt+F2', description: 'Translate to English' },
    { key: 'Alt+F3', description: 'Translate to French' }
  ];
}
