import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Menu } from 'primeng/menu';
import { MenuItem, ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, Menu, ConfirmPopupModule, ButtonModule],
  providers: [ConfirmationService],
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

  constructor(private confirmationService: ConfirmationService) {}

  confirmExit(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to exit Claudine?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Exit App',
      acceptIcon: 'pi pi-power-off',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectLabel: 'Close Settings',
      rejectIcon: 'pi pi-times',
      rejectButtonStyleClass: 'p-button-primary p-button-sm',
      accept: () => {
        window.electronAPI.exitApp();
      },
      reject: () => {
        window.electronAPI.closeSettings();
      }
    });
  }
}
