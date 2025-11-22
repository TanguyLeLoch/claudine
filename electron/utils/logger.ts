import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const isDev = !app.isPackaged || process.argv.includes('--dev');

let logDir: string;

if (isDev) {
  // In development, put logs in the project root 'logs' folder
  logDir = path.join(process.cwd(), 'logs');
} else {
  // In production, use the system's user data directory
  logDir = path.join(app.getPath('userData'), 'logs');
}

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'claudine.log');

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFile })
  ]
});

logger.info(`Logger initialized. Writing to ${logFile}`);
