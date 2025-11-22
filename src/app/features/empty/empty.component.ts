import { Component } from '@angular/core';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [MessageModule],
  template: `
    <div class="flex items-center justify-center h-full w-full p-4">
      <p-message severity="warn" text="Route not found / Empty State"></p-message>
    </div>
  `,
  styles: [':host { display: block; height: 100%; width: 100%; }']
})
export class EmptyComponent {}
