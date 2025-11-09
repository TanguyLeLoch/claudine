/**
 * System tray management
 */

import { app, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { createSettingsWindow } from '../windows/settings-window';

let tray: Tray | null = null;

/**
 * Create the system tray icon and menu
 */
export const createTray = (): void => {
  // Resolve icon path for both dev and production
  const isDev = !app.isPackaged;
  const iconPath = isDev
    ? path.join(__dirname, '../../../assets', 'icon64.png')  // dev: dist/electron/tray -> root/assets
    : path.join(process.resourcesPath, 'assets', 'icon64.png');  // production

  const icon = nativeImage.createFromPath(iconPath);

  // Debug logging
  console.log('Tray icon path:', iconPath);
  console.log('Icon is empty:', icon.isEmpty());

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click: () => {
        createSettingsWindow();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Shortcuts',
      submenu: [
        { label: 'Alt+F1: Fix Typos', enabled: true },
        { label: 'Alt+F2: Translate to English', enabled: true },
        { label: 'Alt+F3: Translate to French', enabled: true },
      ],
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('AI Shortcut');
  tray.setContextMenu(contextMenu);
};

/**
 * Get the tray instance
 */
export const getTray = (): Tray | null => {
  return tray;
};
