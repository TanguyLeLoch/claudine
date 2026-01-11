import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { uuidv7 } from 'uuidv7';

// PrimeNG Imports
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { type ShortcutConfig } from '../../../../../types';
import { ShortcutRecorderComponent } from './shortcut-recorder/shortcut-recorder.component';

// Define the type for the form controls
interface ShortcutFormControls {
  key: FormControl<string>;
  name: FormControl<string>;
  prompt: FormControl<string>;
  inputType: FormControl<'text' | 'image' | 'launcher'>;
}

@Component({
  selector: 'app-shortcut-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
    InputText,
    TextareaModule,
    Select,
    ShortcutRecorderComponent
  ],
  templateUrl: './shortcut-editor.component.html',
  styleUrl: './shortcut-editor.component.scss'
})
export class ShortcutEditorComponent {
  form: FormGroup<ShortcutFormControls>;
  isNew = true;
  shortcutData: ShortcutConfig | null = null;
  existingShortcuts: ShortcutConfig[] = [];
  isRecorderRecording = false;

  inputTypeOptions = [
    { label: 'Text Selection', value: 'text' },
    { label: 'Screenshot', value: 'image' }
  ];

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig
  ) {
    // Get data from dialog config
    this.shortcutData = this.config.data?.shortcutData || null;
    this.existingShortcuts = this.config.data?.existingShortcuts || [];
    this.isNew = this.config.data?.isNew !== false;

    // Initialize form
    this.form = this.fb.group<ShortcutFormControls>({
      key: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, this.uniqueKeyValidator.bind(this)]
      }),
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, this.uniqueNameValidator.bind(this)]
      }),
      prompt: new FormControl('', { nonNullable: true }),
      inputType: new FormControl('text', { nonNullable: true, validators: Validators.required })
    });

    // Populate form with data
    this.resetForm();
  }

  private resetForm() {
    if (this.shortcutData) {
      this.isNew = false;
      // patchValue for FormGroup<T> expects Partial<T>, where T is the value type, not the controls type
      this.form.patchValue(this.shortcutData);

      if (this.shortcutData.locked) {
        this.form.controls.name.disable();
        this.form.controls.inputType.disable();
      } else {
        this.form.controls.name.enable();
        this.form.controls.inputType.enable();
      }
    } else {
      this.isNew = true;
      this.form.reset({
        key: '',
        name: '',
        prompt: '',
        inputType: 'text'
      });
      this.form.controls.name.enable();
      this.form.controls.inputType.enable();
    }

    // Update prompt validation based on inputType
    this.updatePromptValidation();
  }

  private updatePromptValidation() {
    const inputType = this.form.controls.inputType.value;
    const promptControl = this.form.controls.prompt;

    if (inputType === 'launcher') {
      // Launcher shortcuts don't need a prompt
      promptControl.clearValidators();
    } else {
      // Text and image shortcuts require a prompt
      promptControl.setValidators(Validators.required);
    }

    promptControl.updateValueAndValidity();
  }

  uniqueNameValidator(control: any) {
    const name = control.value;
    if (!name) return null;

    // If editing, allow the current name
    if (!this.isNew && this.shortcutData && name === this.shortcutData.name) {
      return null;
    }

    if (this.existingShortcuts.some(s => s.name === name)) {
      return { unique: true };
    }
    return null;
  }

  uniqueKeyValidator(control: any) {
    const key = control.value;
    if (!key) return null;

    // If editing, allow the current key
    if (!this.isNew && this.shortcutData && key === this.shortcutData.key) {
      return null;
    }

    // Check if key matches any existing shortcut's key
    if (this.existingShortcuts.some(s => s.key === key)) {
      return { uniqueKey: true };
    }
    return null;
  }

  onSubmit() {
    if (this.form.valid) {
      // form.value with FormGroup<ShortcutFormControls> correctly infers ShortcutConfig
      // Use getRawValue() to include disabled fields (like name/inputType for locked shortcuts)
      const formValue = this.form.getRawValue();
      const shortcutConfig: ShortcutConfig = {
        // Keep existing ID when editing, generate new one when creating
        id: this.shortcutData?.id ?? uuidv7(),
        ...formValue,
        locked: formValue.inputType === 'launcher'
      };
      this.ref.close(shortcutConfig);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel() {
    this.ref.close();
  }

  onRecorderRecordingChange(recordingStatus: boolean) {
    this.isRecorderRecording = recordingStatus;
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
