/**
 * Safely converts API response data to an array suitable for charts.
 * Handles wrapped responses, null/undefined, and already-formatted arrays.
 */
export function ensureArray<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.result !== undefined) {
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
