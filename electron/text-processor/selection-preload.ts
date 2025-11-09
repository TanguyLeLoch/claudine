/**
 * Preload script for screenshot selection window
 */

import { contextBridge, ipcRenderer } from 'electron';
import { DisplayBounds, SelectionArea } from './screenshot-processor';

contextBridge.exposeInMainWorld('electronAPI', {
  sendSelection: (selection: SelectionArea) => {
    console.log('SelectionArea', selection);
    ipcRenderer.send('selection-made', selection);
  },
  cancelSelection: () => {
    console.log('Selection cancelled')
    ipcRenderer.send('selection-cancelled');
  },
  // Receive display bounds from main process
  onDisplayBounds: (callback:(bounds: DisplayBounds) => void) => {
    ipcRenderer.on('display-bounds', (_event, bounds) => {
      callback(bounds);
    });
  }
});

