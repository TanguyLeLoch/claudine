import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular CDK Imports
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService, PrimeTemplate } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

// Components & Types
import { ShortcutEditorComponent } from './shortcut-editor/shortcut-editor.component';
import { InputTypeBadgeComponent } from '../../../shared/components/input-type-badge/input-type-badge.component';
import { type ShortcutConfig } from '../../../../types';
import { DEFAULT_TOOLTIP_OPTIONS } from '../../../shared/constants/tooltip.constants';

@Component({
  selector: 'app-shortcuts',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    Card,
    Button,
    Toast,
    ConfirmPopupModule,
    TooltipModule,
    PrimeTemplate,
    InputTypeBadgeComponent
  ],
  providers: [ConfirmationService, MessageService, DialogService],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss'
})
export class ShortcutsComponent implements OnInit {
  shortcuts: ShortcutConfig[] = [];
  readonly tooltipOptions = DEFAULT_TOOLTIP_OPTIONS;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private dialogService: DialogService
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
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to load shortcuts'});
      }
    }
  }

  private async saveToElectron() {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.setShortcuts(this.shortcuts);
    } catch (error) {
      this.messageService.add({severity: 'error', summary: 'Save Error', detail: 'Failed to save shortcuts'});
    }
  }

  // --- CRUD Operations ---

  openAddDialog() {
    const dialogConfig = {
      header: 'Add New Shortcut',
      width: '600px',
      modal: true,
      closable: false,
      closeOnEscape: false,
      dismissableMask: true,
      data: {
        shortcutData: null,
        existingShortcuts: this.shortcuts,
        isNew: true
      }
    };
    console.log('[ShortcutsComponent] Opening Add dialog with config:', dialogConfig);
    const ref: DynamicDialogRef | null = this.dialogService.open(ShortcutEditorComponent, dialogConfig);

    ref?.onClose.subscribe(async (formValue: ShortcutConfig) => {
      if (formValue) {
        this.shortcuts = [...this.shortcuts, formValue];
        this.messageService.add({
          severity: 'success',
          summary: 'Added',
          detail: `Shortcut "${formValue.name}" added`
        });
        await this.saveToElectron();
      }
    });
  }

  openEditDialog(shortcut: ShortcutConfig, index: number) {
    const dialogConfig = {
      header: 'Edit Shortcut',
      width: '600px',
      modal: true,
      closable: false,
      closeOnEscape: false, // Handled manually in ShortcutEditorComponent to check recording state
      dismissableMask: true,
      data: {
        shortcutData: {...shortcut},
        existingShortcuts: this.shortcuts,
        isNew: false
      }
    };
    console.log('[ShortcutsComponent] Opening Edit dialog with config:', dialogConfig);
    const ref: DynamicDialogRef | null = this.dialogService.open(ShortcutEditorComponent, dialogConfig);

    ref?.onClose.subscribe(async (formValue: ShortcutConfig) => {
      if (formValue) {
        const updated = [...this.shortcuts];
        updated[index] = formValue;
        this.shortcuts = updated;
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: `Shortcut "${formValue.name}" updated`
        });
        await this.saveToElectron();
      }
    });
  }

  confirmDelete(event: Event, shortcut: ShortcutConfig, index: number) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "${shortcut.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {severity: 'danger'},
      accept: async () => {
        this.shortcuts = this.shortcuts.filter((_, i) => i !== index);
        this.messageService.add({severity: 'success', summary: 'Deleted', detail: 'Shortcut removed'});
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
      acceptButtonProps: {severity: 'danger'},
      accept: async () => {
        await this.resetToDefault();
      }
    });
  }

  async resetToDefault() {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.resetShortcuts();
      await this.loadShortcuts();
      this.messageService.add({severity: 'success', summary: 'Reset', detail: 'Shortcuts reset to defaults.'});
    } catch (error) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to reset.'});
    }
  }
}
