import { envLoader } from '../config/envLoader';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogger {
  debug(message: string, ...optionalParams: unknown[]): void;
  info(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  error(message: string, error?: unknown, ...optionalParams: unknown[]): void;
}

class Logger implements ILogger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = envLoader.get('NODE_ENV') === 'production';
  }

  public debug(message: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      console.log(`[DEBUG] [ChadWallet] ${message}`, ...optionalParams);
    }
  }

  public info(message: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      console.info(`[INFO] [ChadWallet] ${message}`, ...optionalParams);
    }
  }

  public warn(message: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      console.warn(`[WARN] [ChadWallet] ${message}`, ...optionalParams);
    }
  }

  public error(message: string, error?: unknown, ...optionalParams: unknown[]): void {
    // In production, we could send these to Sentry/Crashlytics, but console logs are disabled.
    if (!this.isProduction) {
      console.error(`[ERROR] [ChadWallet] ${message}`, error, ...optionalParams);
    }
  }
}

export const logger = new Logger();
