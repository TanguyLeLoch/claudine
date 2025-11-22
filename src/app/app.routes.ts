import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    children: [
      {
        path: '',
        redirectTo: 'shortcuts',
        pathMatch: 'full'
      },
      {
        path: 'shortcuts',
        loadComponent: () => import('./features/settings/shortcuts/shortcuts.component').then(m => m.ShortcutsComponent)
      },
      {
        path: 'api',
        loadComponent: () => import('./features/settings/settings-api/settings-api.component').then(m => m.SettingsApiComponent)
      },
    ]
  },
  {
    path: 'overlay',
    loadComponent: () => import('./features/overlay/overlay.component').then(m => m.OverlayComponent)
  },
  {
    path: 'toast',
    loadComponent: () => import('./features/toast/toast.component').then(m => m.ToastComponent)
  },
  {
    path: 'launcher',
    loadComponent: () => import('./features/launcher/launcher.component').then(m => m.LauncherComponent)
  },
  {
    path: '',
    loadComponent: () => import('./features/empty/empty.component').then(m => m.EmptyComponent)
  }
];