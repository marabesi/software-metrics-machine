/**
 * Tests for Infrastructure
 */

import { describe, it, expect } from 'vitest';
import { Configuration } from '../src/infrastructure/configuration';

describe('Infrastructure', () => {
  describe('Configuration', () => {
    it('should create configuration from environment variables', () => {
      const env = {
        SMM_STORE_DATA_AT: '/tmp',
        GITHUB_TOKEN: 'gh_test',
        LOGGING_LEVEL: 'DEBUG',
        GIT_REPOSITORY_PATH: '/tmp/repo',
      };
      const config = new Configuration(env);
      expect(config.githubToken).toBe('gh_test');
      expect(config.loggingLevel).toBe('DEBUG');
      expect(config.storeData).toBe('/tmp');
    });

    it('should use default values when env vars not set', () => {
      const config = new Configuration({ SMM_STORE_DATA_AT: '/tmp' });
      expect(config.loggingLevel).toBe('CRITICAL');
      expect(config.storeData).toBe('/tmp');
    });

    it('should validate configuration', () => {
      const config = new Configuration({
        SMM_STORE_DATA_AT: '/tmp',
        GIT_REPOSITORY_PATH: '/tmp/repo',
      });
      const validation = config.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
