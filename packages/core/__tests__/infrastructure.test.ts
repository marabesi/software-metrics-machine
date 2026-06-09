/**
 * Tests for Infrastructure
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger, logger } from '@smmachine/utils';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { Configuration } from '../src/infrastructure/configuration';

describe('Infrastructure', () => {
  describe('Configuration', () => {
    let tempDir: string | undefined;

    beforeEach(() => {
      Logger.configureDefaults({ level: 'INFO', filePath: undefined });
    });

    afterEach(() => {
      Logger.configureDefaults({ level: 'INFO', filePath: undefined });
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
        tempDir = undefined;
      }
    });

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
      expect(config.getLogPath()).toBe(join('/tmp', 'github_', 'smm.log'));
      expect(logger.getFilePath()).toBe(config.getLogPath());
    });

    it('should store logs in smm.log only when store logs is enabled', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({
          github_repository: 'owner/repo',
          git_repository_location: '/tmp/repo',
          log_level: 'INFO',
          store_logs: true,
        }),
        'utf-8'
      );

      const config = new Configuration({ SMM_STORE_DATA_AT: tempDir });
      logger.info('Stored configuration log');

      expect(config.storeLogs).toBe(true);
      expect(config.getLogPath()).toBe(join(tempDir, 'github_owner_repo', 'smm.log'));
      expect(existsSync(config.getLogPath())).toBe(true);
      expect(readFileSync(config.getLogPath(), 'utf8')).toContain('Stored configuration log');
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
