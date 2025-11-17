import { Component, OnInit } from '@angular/core';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// declare global {
//   interface Window {
//     electronAPI: {
//       onShowToast: (callback: (message: string) => void) => void;
//       onHideToast: (callback: () => void) => void;
//     };
//   }
// }

@Component({
  selector: 'toast-app',
  standalone: true,
  imports: [Toast],
  providers: [MessageService],
  template: `<p-toast/>`,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ToastApp implements OnInit {
  constructor(private messageService: MessageService) {}

  ngOnInit() {
    // Listen for IPC messages to show toast
    if (window.electronAPI) {
      window.electronAPI.onShowToast((message: string) => {
        this.messageService.add({
          severity: 'info',
          summary: 'Processing',
          detail: message,
          life: 60000 // Long life, we'll clear it manually
        });
      });

      window.electronAPI.onHideToast(() => {
        this.messageService.clear();
      });
    }
  }
}
