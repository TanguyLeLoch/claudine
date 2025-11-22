import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG Imports
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';

import { type ShortcutConfig } from '../../../../../types';
import { PrimeTemplate } from 'primeng/api';
import { ShortcutRecorderComponent } from './shortcut-recorder/shortcut-recorder.component';

// Define the type for the form controls
interface ShortcutFormControls {
  key: FormControl<string>;
  name: FormControl<string>;
  prompt: FormControl<string>;
  inputType: FormControl<'text' | 'image'>;
}

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
    PrimeTemplate,
    ShortcutRecorderComponent
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

  form: FormGroup<ShortcutFormControls>;
  isNew = true;

  inputTypeOptions = [
    { label: 'Text Selection', value: 'text' },
    { label: 'Screenshot', value: 'image' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group<ShortcutFormControls>({
      key: new FormControl('', { nonNullable: true, validators: Validators.required }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, this.uniqueNameValidator.bind(this)] }),
      prompt: new FormControl('', { nonNullable: true, validators: Validators.required }),
      inputType: new FormControl('text', { nonNullable: true, validators: Validators.required })
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
      // patchValue for FormGroup<T> expects Partial<T>, where T is the value type, not the controls type
      this.form.patchValue(this.shortcutData);
    } else {
      this.isNew = true;
      this.form.reset({
        key: '',
        name: '',
        prompt: '',
        inputType: 'text'
      });
    }
  }

  uniqueNameValidator(control: any) {
    const name = control.value;
    if (!name) return null;
    
    // If editing, allow the current name
    if (!this.isNew && this.shortcutData && name === this.shortcutData.name) {
      return null;
    }

    if (this.existingNames.includes(name)) {
      return { unique: true };
    }
    return null;
  }

  onSubmit() {
    if (this.form.valid) {
      // form.value with FormGroup<ShortcutFormControls> correctly infers ShortcutConfig
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

