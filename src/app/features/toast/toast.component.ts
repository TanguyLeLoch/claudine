import { Component, OnInit, NgZone } from '@angular/core';
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
  private loadingInterval: any;

  constructor(
    private ngZone: NgZone,
    private messageService: MessageService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    if (window.electronAPI) {
      window.electronAPI.onShowToast((message: string, options: any = {}) => {
        this.ngZone.run(() => {
          this.logger.debug(`Toast received: ${message}`, options);
          
          // Clear previous interval if any
          if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
            this.messageService.clear();
          }

          if (options.type === 'loading') {
            let seconds = 0;
            const key = 'loading-toast';
            
            this.messageService.add({
              key: key,
              severity: 'info',
              summary: 'Processing',
              detail: `${message} (0s)`,
              sticky: true
            });

            this.loadingInterval = setInterval(() => {
              seconds++;
              this.messageService.add({
                key: key,
                severity: 'info',
                summary: 'Processing',
                detail: `${message} (${seconds}s)`,
                sticky: true
              });
            }, 1000);

          } else {
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
          if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
          }
          this.messageService.clear(); // Clear all messages
        });
      });
    } else {
      this.logger.warn('Toast: window.electronAPI not available');
    }
  }
}