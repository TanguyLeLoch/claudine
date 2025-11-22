import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular CDK Imports
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
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
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    Card,
    Button,
    Tag,
    Toast,
    ConfirmDialog,
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
        detail: `Shortcut "${formValue.name}" added`
      });
    } else {
      // Update existing shortcut
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

    // Auto-save after add/edit
    await this.saveToElectron();
  }

  confirmDelete(shortcut: ShortcutConfig, index: number) {
    this.confirmationService.confirm({
      message: `Delete "${shortcut.name}"?`,
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

  getExistingNames(): string[] {
    return this.shortcuts.map(s => s.name);
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

  confirmResetToDefault() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to reset all shortcuts to their default values? This action cannot be undone.',
      header: 'Confirm Reset',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        await this.resetToDefault();
      }
    });
  }

  async resetToDefault() {
    if (!window.electronAPI) return;

    try {
      await window.electronAPI.setShortcuts([]); // Send an empty array to clear shortcuts
      await this.loadShortcuts(); // Reload from store to reflect the cleared state
      this.messageService.add({
        severity: 'success',
        summary: 'Cleared',
        detail: 'All shortcuts have been cleared.'
      });
    } catch (error) {
      console.error('Failed to clear shortcuts:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to clear shortcuts.'
      });
    }
  }
}
