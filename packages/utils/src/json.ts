/**
 * JSON Utilities
 * Migrated from: api/src/software_metrics_machine/core/infrastructure/json.py
 */

/**
 * Custom JSON serializer that handles special values like NaN and Infinity
 */
class TypedDictEncoder {
  encode(value: unknown): string {
    return JSON.stringify(value, this.replacer.bind(this), 2);
  }

  private replacer(_key: string, value: unknown): unknown {
    // Convert NaN and Infinity to null for JSON compatibility
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        return null;
      }
    }
    return value;
  }
}

/**
 * Convert object to JSON string with special value handling
 * @param object Object to serialize
 * @returns JSON string with 2-space indentation
 */
export function asJsonString(object: unknown): string {
  const encoder = new TypedDictEncoder();
  return encoder.encode(object);
}

/**
 * Parse JSON string to object
 * @param json JSON string
 * @returns Parsed object
 */
export function parseJson<T = unknown>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Safe JSON stringify with error handling
 * @param value Value to stringify
 * @returns JSON string or error message
 */
export function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return JSON.stringify(
      {
        error: 'Failed to serialize',
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    );
  }
}
