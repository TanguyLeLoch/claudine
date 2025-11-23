import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { DEFAULT_TOOLTIP_OPTIONS } from '../../constants/tooltip.constants';

interface InputTypeConfig {
  icon: string;
  severity: 'info' | 'warn' | 'secondary';
  label: string;
  tooltip: string;
}

const INPUT_TYPE_CONFIG: Record<'text' | 'image' | 'launcher', InputTypeConfig> = {
  text: {
    icon: 'pi pi-file-edit',
    severity: 'info',
    label: 'Text',
    tooltip: 'Uses Clipboard Text'
  },
  image: {
    icon: 'pi pi-camera',
    severity: 'warn',
    label: 'Image',
    tooltip: 'Uses Screenshot'
  },
  launcher: {
    icon: 'pi pi-desktop',
    severity: 'secondary',
    label: 'Launcher',
    tooltip: 'Opens Launcher'
  }
};

@Component({
  selector: 'app-input-type-badge',
  standalone: true,
  imports: [TagModule, Tooltip],
  templateUrl: './input-type-badge.component.html',
  styleUrl: './input-type-badge.component.scss'
})
export class InputTypeBadgeComponent {
  @Input() inputType: 'text' | 'image' | 'launcher' = 'text';

  readonly tooltipOptions = DEFAULT_TOOLTIP_OPTIONS;

  get config(): InputTypeConfig {
    return INPUT_TYPE_CONFIG[this.inputType];
  }
}
