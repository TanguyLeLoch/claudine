import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  
  constructor() {}

  get isElectron(): boolean {
    return !!(window && window.electronAPI);
  }

  public send(channel: string, data?: any): void {
    if (this.isElectron) {
      window.electronAPI.sendMessage(channel, data);
    }
  }

  public on(channel: string, func: (...args: any[]) => void): void {
    if (this.isElectron) {
      window.electronAPI.on(channel, func);
    }
  }

  // Expose other API methods as needed
  public get api() {
    return window.electronAPI;
  }
}