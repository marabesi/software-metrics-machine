/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { datetimeToLocal, getCurrentDateISO, parseISODate, formatToISO } from '../src/date-time';

describe('DateTime Utilities', () => {
  it('should convert ISO datetime to local format', () => {
    const iso = '2024-03-15T14:30:00Z';
    const result = datetimeToLocal(iso);
    expect(result).toMatch(/\d{2} [A-Z][a-z]{2} 2024, \d{2}:\d{2}/);
  });

  it('should get current date in ISO format', () => {
    const iso = getCurrentDateISO();
    expect(iso).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should parse ISO date string to Date object', () => {
    const iso = '2024-03-15T14:30:00Z';
    const date = parseISODate(iso);
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // March is 0-indexed
    expect(date.getDate()).toBe(15);
  });

  it('should format Date object to ISO string', () => {
    const date = new Date('2024-03-15T14:30:00Z');
    const iso = formatToISO(date);
    expect(iso).toMatch(/2024-03-15T14:30:00/);
  });

  it('should handle invalid date gracefully', () => {
    const invalid = 'not-a-date';
    const result = datetimeToLocal(invalid);
    expect(result).toBe(invalid);
  });
});
