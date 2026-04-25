/**
 * Logger Utility
 * Migrated from: api/src/software_metrics_machine/core/infrastructure/logger.py
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export declare class Logger {
    private level;
    private name;
    constructor(name: string, level?: LogLevel);
    private shouldLog;
    private formatMessage;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, error?: Error | unknown): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
}
/**
 * Global logger instance
 */
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map