import type { JsonObject, JsonValue } from './mcp-types';

const SECRET_KEY_PARTS = ['token', 'password', 'secret', 'credential', 'api_key', 'apikey'];

function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SECRET_KEY_PARTS.some((part) => normalized.includes(part));
}

export function redactSecrets<T extends JsonValue | undefined>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }

  if (value && typeof value === 'object') {
    const redacted: JsonObject = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      redacted[key] = isSecretKey(key) && nestedValue ? '[REDACTED]' : redactSecrets(nestedValue);
    }

    return redacted as T;
  }

  return value;
}
