/**
 * Safely converts API response data to an array suitable for charts.
 * Handles wrapped responses, null/undefined, and already-formatted arrays.
 */
type WrappedResult = {
  result: unknown;
};

function hasWrappedResult(data: unknown): data is WrappedResult {
  return typeof data === 'object' && data !== null && 'result' in data;
}

export function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (hasWrappedResult(data)) {
    if (Array.isArray(data.result)) {
      return data.result;
    }
    // If result is not an array, try to extract it
    return Array.isArray(data.result) ? data.result : [];
  }
  if (data === null || data === undefined) {
    return [];
  }
  // If it's an object that's not an array, return empty
  return [];
}
