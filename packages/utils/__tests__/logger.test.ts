/**
 * Tests for Logger
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Logger } from '../src/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestLogger', 'DEBUG');
  });

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

  it('should allow setting log level', () => {
    logger.setLevel('ERROR');
    expect(logger.getLevel()).toBe('ERROR');
  });
});
