import { describe, expect, it } from 'vitest';
import { redactSecrets } from '../src/redaction';

describe('redactSecrets', () => {
  it('redacts nested token-like fields while preserving non-secret values', () => {
    const redacted = redactSecrets({
      github_repository: 'owner/repo',
      github_token: 'secret-token',
      nested: {
        api_key: 'secret-key',
        timezone: 'UTC',
      },
      projects: [
        {
          sonar_token: 'sonar-secret',
          git_provider: 'github',
        },
      ],
    });

    expect(redacted).toEqual({
      github_repository: 'owner/repo',
      github_token: '[REDACTED]',
      nested: {
        api_key: '[REDACTED]',
        timezone: 'UTC',
      },
      projects: [
        {
          sonar_token: '[REDACTED]',
          git_provider: 'github',
        },
      ],
    });
  });
});
