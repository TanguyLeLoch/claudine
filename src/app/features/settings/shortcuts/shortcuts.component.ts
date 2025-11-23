import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular CDK Imports
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService, PrimeTemplate, TooltipOptions } from 'primeng/api';

// Components & Types
import { ShortcutEditorComponent } from './shortcut-editor/shortcut-editor.component';
import { type ShortcutConfig } from '../../../../types';

@Component({
  selector: 'app-shortcuts',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    Card,
    Button,
    Tag,
    Toast,
    ConfirmPopupModule,
    TooltipModule,
    ShortcutEditorComponent,
    PrimeTemplate
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss'
})
export class ShortcutsComponent implements OnInit {
  shortcuts: ShortcutConfig[] = [];
  tooltipOption: TooltipOptions = {
    tooltipPosition: 'bottom',
    tooltipStyleClass: '!min-w-10'
  };

  // Editor State
  isEditorVisible = false;
  selectedShortcutForEdit: ShortcutConfig | null = null;
  editIndex: number = -1;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
  }

  async ngOnInit() {
    await this.loadShortcuts();
  }

  async loadShortcuts() {
    if (window.electronAPI) {
      try {
        this.shortcuts = await window.electronAPI.getShortcuts();
      } catch (err) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load shortcuts' });
      }
    }
  }

  private async saveToElectron() {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.setShortcuts(this.shortcuts);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Save Error', detail: 'Failed to save shortcuts' });
    }
  }

  // --- CRUD Operations ---

  openAddDialog() {
    this.selectedShortcutForEdit = null;
    this.editIndex = -1;
    this.isEditorVisible = true;
  }

  openEditDialog(shortcut: ShortcutConfig, index: number) {
    this.selectedShortcutForEdit = { ...shortcut };
    this.editIndex = index;
    this.isEditorVisible = true;
  }

  async handleSave(formValue: ShortcutConfig) {
    if (this.editIndex === -1) {
      this.shortcuts = [...this.shortcuts, formValue];
      this.messageService.add({ severity: 'success', summary: 'Added', detail: `Shortcut "${formValue.name}" added` });
    } else {
      const updated = [...this.shortcuts];
      updated[this.editIndex] = formValue;
      this.shortcuts = updated;
      this.messageService.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Shortcut "${formValue.name}" updated`
      });
    }
    this.isEditorVisible = false;
    await this.saveToElectron();
  }

  confirmDelete(event: Event, shortcut: ShortcutConfig, index: number) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "${shortcut.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger' },
      accept: async () => {
        this.shortcuts = this.shortcuts.filter((_, i) => i !== index);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Shortcut removed' });
        await this.saveToElectron();
      }
    });
  }

  // --- Reordering Logic (SECURED) ---

  /**
   * SECURITY FAILSAFE 1: Predicate
   * This strictly forbids dropping ANY item into Index 0.
   * It relies purely on the index, not on the data object.
   */
  sortPredicate = (index: number, drag: CdkDrag<ShortcutConfig>, drop: CdkDropList<ShortcutConfig[]>) => {
    return index !== 0;
  };

  /**
   * SECURITY FAILSAFE 2: Drop Handler
   * Even if the predicate is bypassed, we enforce data integrity here.
   */
  async drop(event: CdkDragDrop<ShortcutConfig[]>) {
    let targetIndex = event.currentIndex;

    // Strict Rule: Nothing goes into Index 0.
    if (targetIndex === 0) {
      console.warn('Attempted to drop into locked Index 0. Reverting to Index 1.');
      targetIndex = 1;
    }

    if (event.previousIndex !== targetIndex) {
      moveItemInArray(this.shortcuts, event.previousIndex, targetIndex);
      await this.saveToElectron();
    }
  }

  // --- Reset ---

  confirmResetToDefault(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Reset all shortcuts to default?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger' },
      accept: async () => {
        await this.resetToDefault();
      }
    });
  }

  async resetToDefault() {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.setShortcuts([]);
      await this.loadShortcuts();
      this.messageService.add({ severity: 'success', summary: 'Cleared', detail: 'Shortcuts reset.' });
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reset.' });
    }
  }
}
