/**
 * Provides timezone-aware date operations using the built-in Intl API.
 *
 * All date grouping, filtering, and boundary calculations should go through
 * this provider so that dates are consistently interpreted in the configured
 * IANA timezone (e.g. "Europe/Madrid", "UTC").
 */
export class TimeZoneProvider {
  readonly timezone: string;

  constructor(timezone: string = 'UTC') {
    // Validate the timezone identifier at construction time
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      throw new Error(`Invalid IANA timezone identifier: "${timezone}"`);
    }
    this.timezone = timezone;
  }

  // ---------------------------------------------------------------------------
  // Date key helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the "YYYY-MM-DD" key for a date interpreted in the configured timezone.
   */
  getDateKey(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', { timeZone: this.timezone });
  }

  /**
   * Returns "YYYY-MM" for a date in the configured timezone.
   */
  getMonthKey(date: string | Date): string {
    const key = this.getDateKey(date);
    return key.substring(0, 7);
  }

  /**
   * Returns the ISO-8601 week key "YYYY-Www" for a date in the configured timezone.
   */
  getWeekKey(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    // Get the date components in the target timezone
    const parts = this.getDateParts(d);
    const { year, month, day } = parts;

    // Reconstruct a UTC date from the timezone-local components so that
    // the ISO-week calculation below operates on the correct calendar day.
    const localUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    // ISO week calculation (same algorithm used elsewhere in the codebase)
    const temp = new Date(localUtc);
    const dayOfWeek = temp.getUTCDay();
    const diff = temp.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const firstDay = new Date(temp.setUTCDate(diff));

    const week = Math.ceil(
      (firstDay.getTime() - new Date(Date.UTC(firstDay.getUTCFullYear(), 0, 1)).getTime()) /
        604800000
    );
    const isoYear = firstDay.getUTCFullYear();

    return `${isoYear}-W${String(week).padStart(2, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // Day / week / month interval keys
  // ---------------------------------------------------------------------------

  /**
   * Returns the period key for a date string in the configured timezone.
   *
   * @param dateString - ISO 8601 date or date-time string
   * @param interval   - "day" → "YYYY-MM-DD", "week" → "YYYY-Www", "month" → "YYYY-MM"
   */
  getIntervalKey(dateString: string | undefined, interval: 'day' | 'week' | 'month'): string {
    if (!dateString) return 'unknown';

    if (interval === 'day') return this.getDateKey(dateString);
    if (interval === 'month') return this.getMonthKey(dateString);
    return this.getWeekKey(dateString);
  }

  // ---------------------------------------------------------------------------
  // Boundary helpers (start / end of day as UTC Date)
  // ---------------------------------------------------------------------------

  /**
   * Returns a `Date` whose UTC value equals midnight on `dateStr` in the
   * configured timezone.
   *
   * Example: with timezone "Europe/Madrid" and `dateStr = "2025-03-15"`,
   * returns the UTC instant corresponding to `2025-03-15T00:00:00+01:00`.
   */
  getStartOfDayBoundary(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);

    // Use noon UTC as a reference point to determine the UTC offset for this
    // calendar day.  Noon is safely away from DST transition boundaries.
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const offsetMinutes = this.getUTCOffsetMinutes(noonUtc);

    // midnight in the target timezone  →  midnight_utc - offset
    const midnightUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
    return new Date(midnightUtc - offsetMinutes * 60 * 1000);
  }

  /**
   * Returns a `Date` whose UTC value equals 23:59:59.999 on `dateStr` in the
   * configured timezone.
   */
  getEndOfDayBoundary(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);

    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const offsetMinutes = this.getUTCOffsetMinutes(noonUtc);

    const endOfDayUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
    return new Date(endOfDayUtc - offsetMinutes * 60 * 1000);
  }

  // ---------------------------------------------------------------------------
  // Comparison helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns true when `date1` and `date2` fall on the same calendar day in
   * the configured timezone.
   */
  isSameDay(date1: string | Date, date2: string | Date): boolean {
    return this.getDateKey(date1) === this.getDateKey(date2);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private getDateParts(date: Date): { year: number; month: number; day: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '01';
    return {
      year: Number(get('year')),
      month: Number(get('month')),
      day: Number(get('day')),
    };
  }

  /**
   * Computes the UTC offset (in minutes) for a given instant in the configured
   * timezone.  Positive values mean the timezone is ahead of UTC.
   */
  private getUTCOffsetMinutes(date: Date): number {
    const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = date.toLocaleString('en-US', { timeZone: this.timezone });
    const utcDate = new Date(utcStr);
    const tzDate = new Date(tzStr);
    return Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60));
  }
}
