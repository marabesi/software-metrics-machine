/**
 * Tests for Logger
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Logger } from '../src/logger';

describe('Logger', () => {
  let logger: Logger;
  let tempDir: string | undefined;

  beforeEach(() => {
    logger = new Logger('TestLogger', 'DEBUG');
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  function createTempLogPath(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'smm-logger-'));
    return join(tempDir, 'logs', 'smm.log');
  }

  it('should create logger with name and level', () => {
    expect(logger.getLevel()).toBe('DEBUG');
  });

  it('should log debug messages', () => {
    expect(() => {
      logger.debug('Debug message');
    }).not.toThrow();
  });

  it('should log info messages', () => {
    expect(() => {
      logger.info('Info message');
    }).not.toThrow();
  });

  it('should log warning messages', () => {
    expect(() => {
      logger.warn('Warning message');
    }).not.toThrow();
  });

  it('should log error messages', () => {
    expect(() => {
      logger.error('Error message', new Error('test error'));
    }).not.toThrow();
  });

  it('should log critical messages', () => {
    expect(() => {
      logger.critical('Critical message', new Error('test error'));
    }).not.toThrow();
  });

  it('should allow setting log level', () => {
    logger.setLevel('ERROR');
    expect(logger.getLevel()).toBe('ERROR');
  });

  it('should create logger with options', () => {
    const logPath = createTempLogPath();
    logger = new Logger('OptionsLogger', { level: 'WARN', filePath: logPath, storeLogs: true });

    expect(logger.getLevel()).toBe('WARN');
    expect(logger.getFilePath()).toBe(logPath);
  });

  it('should append log messages to a file when file path is configured', () => {
    const logPath = createTempLogPath();
    logger = new Logger('FileLogger', { level: 'DEBUG', filePath: logPath, storeLogs: true });

    logger.info('Info message', { source: 'test' });
    logger.error('Error message', new Error('test error'));

    const contents = readFileSync(logPath, 'utf8');
    expect(contents).toContain('[INFO] [FileLogger] Info message {"source":"test"}');
    expect(contents).toContain('[ERROR] [FileLogger] Error message Error: test error');
  });

  it('should respect log level when writing to a file', () => {
    const logPath = createTempLogPath();
    logger = new Logger('FilteredFileLogger', {
      level: 'WARN',
      filePath: logPath,
      storeLogs: true,
    });

    logger.info('Info message');
    logger.warn('Warning message');

    const contents = readFileSync(logPath, 'utf8');
    expect(contents).not.toContain('Info message');
    expect(contents).toContain('[WARN] [FilteredFileLogger] Warning message');
  });

  it('should not write to a file unless storeLogs is true', () => {
    const logPath = createTempLogPath();
    logger = new Logger('DisabledFileLogger', { level: 'DEBUG', filePath: logPath });

    logger.info('Disabled file path message');

    expect(existsSync(logPath)).toBe(false);
  });

  it('should allow file path changes after creation', () => {
    const logPath = createTempLogPath();
    logger = new Logger('TestLogger', { level: 'INFO', storeLogs: true });
    logger.setFilePath(logPath);

    logger.info('Runtime file path message');

    const contents = readFileSync(logPath, 'utf8');
    expect(contents).toContain('[INFO] [TestLogger] Runtime file path message');
  });

  it('should use INFO level when no level is configured', () => {
    const logPath = createTempLogPath();
    logger = new Logger('DefaultFileLogger', { filePath: logPath, storeLogs: true });

    logger.debug('Default file path message');
    logger.info('Info file path message');

    const contents = readFileSync(logPath, 'utf8');
    expect(logger.getFilePath()).toBe(logPath);
    expect(logger.getLevel()).toBe('INFO');
    expect(contents).not.toContain('Default file path message');
    expect(contents).toContain('[INFO] [DefaultFileLogger] Info file path message');
  });
});
