import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ToastApp } from './toast-app.component';
import { MessageService } from 'primeng/api';

bootstrapApplication(ToastApp, {
  providers: [
    provideAnimations(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false
        }
      }
    })
  ]
}).catch(err => console.error(err));
