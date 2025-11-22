import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-launcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './launcher.component.html',
  styleUrl: './launcher.component.scss' // Use styleUrl instead of styleUrls for a single file
})
export class LauncherComponent {}