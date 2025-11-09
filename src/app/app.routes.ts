import { Routes } from '@angular/router';
import { ShortcutsComponent } from './shortcuts/shortcuts.component';
import { SettingsComponent } from './settings/settings.component';
import { LogsComponent } from './logs/logs.component';

export const routes: Routes = [
  { path: '', redirectTo: 'shortcuts', pathMatch: 'full' },
  { path: 'shortcuts', component: ShortcutsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'logs', component: LogsComponent }
];
