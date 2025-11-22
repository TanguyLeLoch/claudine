import {
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  forwardRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PrimeIcons } from 'primeng/api';

@Component({
  selector: 'app-shortcut-recorder',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './shortcut-recorder.component.html',
  styleUrls: ['./shortcut-recorder.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShortcutRecorderComponent),
      multi: true,
    },
  ],
})
export class ShortcutRecorderComponent implements ControlValueAccessor {
  // Internal state
  value: string = '';
  isRecording = false;
  isDisabled = false;
  
  // To display keys visually split by '+'
  displayKeys = signal<string[]>([]);

  // CVA callbacks
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  // --- Interaction Logic ---

  startRecording(event: MouseEvent): void {
    if (this.isDisabled) return;
    
    event.stopPropagation(); // Prevent immediate closing if we had a click-outside logic
    this.isRecording = true;
    this.onTouched();
  }

  stopRecording(): void {
    this.isRecording = false;
  }

  clearShortcut(event: MouseEvent): void {
    event.stopPropagation();
    this.updateValue('');
    this.stopRecording();
  }

  // --- Event Handling ---

  /**
   * Listen to global keydown only when recording.
   * This allows us to capture system keys and prevent default browser actions.
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isRecording) return;

    event.preventDefault();
    event.stopPropagation();

    // 1. Identify Modifiers
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.metaKey) modifiers.push('CommandOrControl'); // Requirement: Map Meta
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');

    // 2. Identify the Trigger Key
    const key = event.key;
    
    // We only want to stop recording and save if a "non-modifier" key is pressed.
    // If the user is just holding "Ctrl", we wait.
    const isModifierKey = ['Control', 'Shift', 'Alt', 'Meta', 'OS'].includes(key);

    if (!isModifierKey) {
      // Normalize the key for Electron (e.g., ArrowUp -> Up, " " -> Space)
      const normalizedKey = this.normalizeKeyForElectron(key, event.code);
      
      // Combine modifiers + key
      const finalShortcut = [...modifiers, normalizedKey].join('+');
      
      this.updateValue(finalShortcut);
      this.stopRecording();
    }
  }

  /**
   * Handle click outside to cancel recording mode
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.isRecording) return;
    
    // If click is outside this component, stop recording
    if (!this.el.nativeElement.contains(event.target)) {
      this.stopRecording();
    }
  }

  // --- Data Logic ---

  updateValue(newValue: string): void {
    this.value = newValue;
    this.displayKeys.set(newValue ? newValue.split('+') : []);
    this.onChange(newValue);
  }

  normalizeKeyForElectron(key: string, code: string): string {
    // 1. Handle Function Keys (F1-F12) -> pass through as uppercase
    if (/^F\d+$/.test(key)) return key.toUpperCase();

    // 2. Handle Letters (a -> A)
    if (key.length === 1) return key.toUpperCase();

    // 3. Map Special Keys to Electron names
    const map: { [k: string]: string } = {
      ' ': 'Space',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Escape': 'Esc',
      'Insert': 'Insert',
      'Delete': 'Delete',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown',
      'Tab': 'Tab',
      'Enter': 'Return',
      'Backspace': 'Backspace',
      'Plus': 'Plus' // Be careful with NumpadAdd vs +
    };

    if (map[key]) return map[key];

    // Fallback: if code is "Digit1", return "1"
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    if (code.startsWith('Key')) return code.replace('Key', '').toUpperCase();

    return key.toUpperCase(); // Default fallback
  }

  // --- ControlValueAccessor Implementation ---

  writeValue(value: string): void {
    this.value = value || '';
    this.displayKeys.set(this.value ? this.value.split('+') : []);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}