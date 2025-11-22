import { Component, OnInit, HostListener, NgZone, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisplayBounds, SelectionArea } from '../../../types';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss'
})
export class OverlayComponent implements OnInit {
  isSelecting = false;
  // Visual coordinates (relative to window/viewport)
  startX = 0;
  startY = 0;
  currentX = 0;
  currentY = 0;
  
  // Screen coordinates (absolute global)
  startScreenX = 0;
  startScreenY = 0;
  currentScreenX = 0;
  currentScreenY = 0;

  selectionBox = { left: 0, top: 0, width: 0, height: 0 };
  
  displayId: number | null = null;
  displayBounds: DisplayBounds | null = null;

  @ViewChild('overlayContainer') overlayContainer!: ElementRef;

  constructor(
    private ngZone: NgZone, 
    private cdr: ChangeDetectorRef,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    if (window.electronAPI) {
      window.electronAPI.onDisplayBounds((bounds: DisplayBounds) => {
        this.ngZone.run(() => {
          this.logger.debug('Overlay: Received display bounds', bounds);
          this.displayBounds = bounds;
          this.displayId = bounds.id;
        });
      });
      // Request bounds immediately
      window.electronAPI.requestDisplayBounds();
    } else {
      this.logger.warn('Overlay: window.electronAPI not available');
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return; // Only left click

    this.isSelecting = true;
    // Capture visual coords
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.currentX = event.clientX;
    this.currentY = event.clientY;
    
    // Capture global screen coords
    this.startScreenX = event.screenX;
    this.startScreenY = event.screenY;
    this.currentScreenX = event.screenX;
    this.currentScreenY = event.screenY;

    this.updateSelectionBox();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isSelecting) return;

    this.currentX = event.clientX;
    this.currentY = event.clientY;
    
    this.currentScreenX = event.screenX;
    this.currentScreenY = event.screenY;

    this.updateSelectionBox();
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (!this.isSelecting) return;

    this.isSelecting = false;
    this.finishSelection();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancelSelection();
    }
  }

  updateSelectionBox() {
    const width = Math.abs(this.currentX - this.startX);
    const height = Math.abs(this.currentY - this.startY);
    const left = Math.min(this.currentX, this.startX);
    const top = Math.min(this.currentY, this.startY);

    this.selectionBox = { left, top, width, height };
  }

  finishSelection() {
    if (!this.displayId || !this.displayBounds) {
      this.logger.error('Overlay: No display ID/Bounds available for selection.');
      return;
    }

    if (this.selectionBox.width < 5 || this.selectionBox.height < 5) {
        this.logger.debug('Overlay: Selection too small, ignoring.');
        return;
    }
    
    // Calculate coordinates relative to the display using global screen coordinates
    const minScreenX = Math.min(this.startScreenX, this.currentScreenX);
    const minScreenY = Math.min(this.startScreenY, this.currentScreenY);
    const width = Math.abs(this.currentScreenX - this.startScreenX);
    const height = Math.abs(this.currentScreenY - this.startScreenY);

    const selection: SelectionArea = {
      x: Math.round(minScreenX - this.displayBounds.offsetX),
      y: Math.round(minScreenY - this.displayBounds.offsetY),
      width: Math.round(width),
      height: Math.round(height),
      displayId: this.displayId
    };

    this.logger.info('Overlay: Sending selection', selection);
    if (window.electronAPI) {
        window.electronAPI.sendSelection(selection);
    }
  }
  cancelSelection() {
    this.logger.info('Overlay: Selection cancelled.');
    if (window.electronAPI) {
      window.electronAPI.cancelSelection();
    }
  }
}
