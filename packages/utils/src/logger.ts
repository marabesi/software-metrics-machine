/**
 * Logger Utility
 * Migrated from: api/src/software_metrics_machine/core/infrastructure/logger.py
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export class Logger {
  private level: LogLevel;
  private name: string;

  constructor(name: string, level: LogLevel = 'INFO') {
    this.name = name;
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.name}] ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('DEBUG')) {
      console.info(this.formatMessage('DEBUG', message), data);
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('INFO')) {
      console.log(this.formatMessage('INFO', message), data);
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message), data);
    }
  }

  error(message: string, error?: Error | unknown): void {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message), error);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger('SMM', (process.env.LOG_LEVEL as LogLevel) || 'INFO');
