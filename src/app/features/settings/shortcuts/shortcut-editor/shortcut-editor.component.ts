import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG Imports
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';

import { type ShortcutConfig } from '../../../../../types';
import { PrimeTemplate } from 'primeng/api';

@Component({
  selector: 'app-shortcut-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    InputText,
    TextareaModule,
    Select,
    PrimeTemplate
  ],
  templateUrl: './shortcut-editor.component.html',
  styleUrl: './shortcut-editor.component.scss'
})
export class ShortcutEditorComponent implements OnChanges {
  @Input() visible = false;
  @Input() shortcutData: ShortcutConfig | null = null;
  @Input() existingNames: string[] = [];

  @Output() save = new EventEmitter<ShortcutConfig>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isNew = true;

  inputTypeOptions = [
    { label: 'Text Selection', value: 'text' },
    { label: 'Screenshot', value: 'image' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      key: ['', Validators.required],
      name: ['', [Validators.required, Validators.pattern(/^\S+$/)]],
      description: ['', Validators.required],
      prompt: ['', Validators.required],
      inputType: ['text', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  private resetForm() {
    if (this.shortcutData) {
      this.isNew = false;
      this.form.patchValue(this.shortcutData);
    } else {
      this.isNew = true;
      this.form.reset({ inputType: 'text' });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value as ShortcutConfig);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.dirty && field?.hasError(errorType));
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.dirty && field?.invalid);
  }
}
