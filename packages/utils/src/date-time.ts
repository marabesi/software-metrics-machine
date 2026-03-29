/**
 * Date and Time Utilities
 * Migrated from: api/src/software_metrics_machine/core/infrastructure/date_and_time.py
 */

import { format, parseISO } from 'date-fns';

/**
 * Convert ISO datetime string to local time format
 * @param date ISO format date string (e.g., "2024-01-15T14:30:00Z")
 * @returns Formatted date string "dd MMM yyyy, HH:mm"
 */
export function datetimeToLocal(date: string): string {
  try {
    const dt = parseISO(date);
    return format(dt, 'dd MMM yyyy, HH:mm');
  } catch (error) {
    console.warn(`Failed to parse date: ${date}`, error);
    return date;
  }
}

/**
 * Get current date in ISO format
 * @returns ISO format date string
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString();
}

/**
 * Parse ISO date string to Date object
 * @param date ISO format date string
 * @returns Date object
 */
export function parseISODate(date: string): Date {
  return parseISO(date);
}

/**
 * Format date to ISO string
 * @param date Date object
 * @returns ISO format date string
 */
export function formatToISO(date: Date): string {
  return date.toISOString();
}
