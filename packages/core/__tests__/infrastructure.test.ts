/**
 * Tests for Infrastructure
 */

import { describe, it, expect } from 'vitest';
import { Configuration } from '../src/infrastructure/configuration';

describe('Infrastructure', () => {
  describe('Configuration', () => {
    it('should create configuration from environment variables', () => {
      const env = {
        GITHUB_TOKEN: 'gh_test',
        LOG_LEVEL: 'DEBUG',
        OUTPUT_DIR: '/tmp/output',
      };
      const config = new Configuration(env);
      expect(config.githubToken).toBe('gh_test');
      expect(config.loggingLevel).toBe('DEBUG');
      expect(config.outputDir).toBe('/tmp/output');
    });

    it('should use default values when env vars not set', () => {
      const config = new Configuration({});
      expect(config.outputDir).toBe('./outputs');
      expect(config.inputDir).toBe('./inputs');
      expect(config.loggingLevel).toBe('INFO');
    });

    it('should validate configuration', () => {
      const config = new Configuration({});
      const validation = config.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
