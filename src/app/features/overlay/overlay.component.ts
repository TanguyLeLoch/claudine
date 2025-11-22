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
  startX = 0;
  startY = 0;
  currentX = 0;
  currentY = 0;
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
    } else {
      this.logger.warn('Overlay: window.electronAPI not available');
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return; // Only left click

    this.isSelecting = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.currentX = event.clientX;
    this.currentY = event.clientY;
    this.updateSelectionBox();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isSelecting) return;

    this.currentX = event.clientX;
    this.currentY = event.clientY;
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
    if (!this.displayId) {
      this.logger.error('Overlay: No display ID available for selection. Display bounds might not have been received yet.');
      return;
    }

    if (this.selectionBox.width < 5 || this.selectionBox.height < 5) {
        this.logger.debug('Overlay: Selection too small, ignoring.');
        return;
    }
    
    const selection: SelectionArea = {
      x: Math.round(this.selectionBox.left),
      y: Math.round(this.selectionBox.top),
      width: Math.round(this.selectionBox.width),
      height: Math.round(this.selectionBox.height),
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
