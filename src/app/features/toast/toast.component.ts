import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit {
  message: string = 'Success';
  isVisible: boolean = false;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (window.electronAPI) {
      window.electronAPI.onShowToast((message: string) => {
        this.ngZone.run(() => {
          console.log('Toast received:', message);
          this.message = message;
          this.isVisible = true;
          this.cdr.detectChanges();
        });
      });

      window.electronAPI.onHideToast(() => {
        this.ngZone.run(() => {
          console.log('Toast hide received');
          this.isVisible = false;
          this.cdr.detectChanges();
        });
      });
    }
  }
}
