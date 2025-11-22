import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any) {
    if (window.electronAPI) {
      window.electronAPI.log(level, message, meta);
    } else {
      // Fallback for non-Electron environment (e.g. pure browser dev)
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'info':
        case 'debug':
          console.log(formattedMessage, meta || '');
          break;
        case 'warn':
          console.warn(formattedMessage, meta || '');
          break;
        case 'error':
          console.error(formattedMessage, meta || '');
          break;
      }
    }
  }
}
