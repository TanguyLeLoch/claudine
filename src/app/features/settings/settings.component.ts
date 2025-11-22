import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, Menu],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Shortcuts',
      icon: 'pi pi-bolt',
      routerLink: ['/settings', 'shortcuts']
    },
    {
      label: 'API Configuration',
      icon: 'pi pi-key',
      routerLink: ['/settings', 'api']
    },
  ];
}