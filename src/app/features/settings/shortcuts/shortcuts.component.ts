import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular CDK Imports
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDragHandle, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

// Components & Types
import { ShortcutEditorComponent } from './shortcut-editor/shortcut-editor.component';
import { type ShortcutConfig } from '../../../../types';

@Component({
  selector: 'app-shortcuts',
  standalone: true,
  imports: [
    CommonModule,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    Card,
    Button,
    Tag,
    Toast,
    ConfirmDialog,
    TooltipModule,
    ShortcutEditorComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss'
})
export class ShortcutsComponent implements OnInit {
  shortcuts: ShortcutConfig[] = [];

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
        console.log(this.shortcuts)
      } catch (err) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load shortcuts'
        });
      }
    }
  }

  /**
   * Auto-save shortcuts to Electron store
   * Triggers live reload in Electron main process
   */
  private async saveToElectron() {
    if (!window.electronAPI) return;

    try {
      await window.electronAPI.setShortcuts(this.shortcuts);
      console.log('Shortcuts auto-saved to Electron store');
    } catch (error) {
      console.error('Failed to save shortcuts:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Save Error',
        detail: 'Failed to save shortcuts'
      });
    }
  }

  // --- CRUD Operations with Auto-Save ---

  openAddDialog() {
    this.selectedShortcutForEdit = null;
    this.editIndex = -1;
    this.isEditorVisible = true;
  }

  openEditDialog(shortcut: ShortcutConfig, index: number) {
    this.selectedShortcutForEdit = { ...shortcut }; // Clone to avoid reference issues
    this.editIndex = index;
    this.isEditorVisible = true;
  }

  async handleSave(formValue: ShortcutConfig) {
    if (this.editIndex === -1) {
      // Create new shortcut
      this.shortcuts = [...this.shortcuts, formValue];
      this.messageService.add({
        severity: 'success',
        summary: 'Added',
        detail: `Shortcut "${formValue.description}" added`
      });
    } else {
      // Update existing shortcut
      const updated = [...this.shortcuts];
      updated[this.editIndex] = formValue;
      this.shortcuts = updated;
      this.messageService.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Shortcut "${formValue.description}" updated`
      });
    }

    this.isEditorVisible = false;

    // Auto-save after add/edit
    await this.saveToElectron();
  }

  confirmDelete(shortcut: ShortcutConfig, index: number) {
    this.confirmationService.confirm({
      message: `Delete "${shortcut.description}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        this.shortcuts = this.shortcuts.filter((_, i) => i !== index);
        this.messageService.add({
          severity: 'warn',
          summary: 'Deleted',
          detail: 'Shortcut removed'
        });

        // Auto-save after delete
        await this.saveToElectron();
      }
    });
  }

  // --- Reordering Logic ---

  async drop(event: CdkDragDrop<ShortcutConfig[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.shortcuts, event.previousIndex, event.currentIndex);

      this.messageService.add({
        severity: 'info',
        summary: 'Reordered',
        detail: 'Shortcut order updated'
      });

      // Auto-save after reorder
      await this.saveToElectron();
    }
  }
}
