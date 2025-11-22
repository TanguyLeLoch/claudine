import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ToastModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss' // Keep styleUrl for potential overrides or empty file
})
export class ToastComponent implements OnInit {
  seconds = 0;
  private loadingInterval: any;

  constructor(
    private ngZone: NgZone,
    private messageService: MessageService,
    private logger: LoggerService
  ) {
  }

  ngOnInit() {
    if (window.electronAPI) {
      // Register all IPC listeners first
      window.electronAPI.onShowToast((message: string, options: any = {}) => {
        this.ngZone.run(() => {
          this.logger.debug(`Toast received: ${message}`, options);

          // Handle loading toast with custom template
          if (options.type === 'loading') {
            this.seconds = 0; // Reset the counter
            const key = 'loading-toast';

            // Clear any existing loading interval
            if (this.loadingInterval) {
              clearInterval(this.loadingInterval);
            }

            // Add the toast ONCE (it stays visible because sticky: true)
            this.messageService.add({
              key: key,
              severity: 'info',
              summary: 'Processing',
              detail: message,
              sticky: true // Toast stays until we clear it
            });

            // Start interval that only updates the seconds variable
            // The template will automatically show the updated value
            this.loadingInterval = setInterval(() => {
              this.seconds++;
            }, 1000);

          } else {
            // Standard toast (success, error, info)
            // Stop any loading toast when showing success/error
            this.stopLoading();

            this.messageService.add({
              severity: options.severity || 'info',
              summary: options.severity === 'error' ? 'Error' : (options.severity === 'success' ? 'Success' : 'Info'),
              detail: message,
              life: options.sticky ? undefined : 3000
            });
          }
        });
      });

      window.electronAPI.onHideToast(() => {
        this.ngZone.run(() => {
          this.logger.debug('Toast hide received. Clearing messages.');
          this.stopLoading();
          this.messageService.clear(); // Clear all messages
        });
      });

      // Send handshake to Main process after all listeners are registered
      // This tells Electron that Angular is ready to receive toast messages
      window.electronAPI.sendMessage('toast-component-ready', null);
      this.logger.debug('Toast component ready signal sent to Main process');
    } else {
      this.logger.warn('Toast: window.electronAPI not available');
    }
  }

  /**
   * Stop the loading toast and clear its interval
   */
  private stopLoading(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
    // Clear the loading toast specifically by its key
    this.messageService.clear('loading-toast');
  }
}