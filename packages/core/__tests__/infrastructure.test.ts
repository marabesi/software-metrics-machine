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
          projects: [
            {
              github_repository: 'owner/repo',
              git_repository_location: '/tmp/repo',
              log_level: 'INFO',
              store_logs: true,
            },
          ],
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

    it('should load deployment frequency targets from object array configuration', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({
          projects: [
            {
              git_repository_location: '/tmp/repo',
              deployment_frequency_targets: [
                { pipeline: '.github/workflows/release.yml', job: 'deploy-production' },
                { pipeline: '.github/workflows/mobile.yml', job: 'deploy-mobile' },
              ],
            },
          ],
        }),
        'utf-8'
      );

      const config = new Configuration({ SMM_STORE_DATA_AT: tempDir });

      expect(config.getDeploymentFrequencyTargets()).toEqual([
        { pipeline: '.github/workflows/release.yml', job: 'deploy-production' },
        { pipeline: '.github/workflows/mobile.yml', job: 'deploy-mobile' },
      ]);
    });

    describe('multi-project support', () => {
      it('should load first project by default when more than one project exists and no project is specified', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(
          join(tempDir, 'smm_config.json'),
          JSON.stringify({
            projects: [
              {
                github_repository: 'org/repo-a',
                git_repository_location: '/tmp/repo-a',
                github_token: 'token-a',
              },
              {
                github_repository: 'org/repo-b',
                git_repository_location: '/tmp/repo-b',
                github_token: 'token-b',
              },
            ],
          }),
          'utf-8'
        );

        const config = new Configuration({ SMM_STORE_DATA_AT: tempDir });
        expect(config.githubRepository).toBe('org/repo-a');
        expect(config.gitRepositoryLocation).toBe('/tmp/repo-a');
        expect(config.githubToken).toBe('token-a');
      });

      it('should select project by constructor projectName (github_repository)', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(
          join(tempDir, 'smm_config.json'),
          JSON.stringify({
            projects: [
              {
                github_repository: 'org/repo-a',
                git_repository_location: '/tmp/repo-a',
              },
              {
                github_repository: 'org/repo-b',
                git_repository_location: '/tmp/repo-b',
              },
            ],
          }),
          'utf-8'
        );

        const config = new Configuration({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-b');
        expect(config.githubRepository).toBe('org/repo-b');
        expect(config.gitRepositoryLocation).toBe('/tmp/repo-b');
      });

      it('should load first project when there is only one project', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(
          join(tempDir, 'smm_config.json'),
          JSON.stringify({
            projects: [
              {
                github_repository: 'org/repo-a',
                git_repository_location: '/tmp/repo-a',
              },
            ],
          }),
          'utf-8'
        );

        const config = new Configuration({
          SMM_STORE_DATA_AT: tempDir,
        });
        expect(config.githubRepository).toBe('org/repo-a');
        expect(config.gitRepositoryLocation).toBe('/tmp/repo-a');
      });

      it('should throw error when selected project is not found', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(
          join(tempDir, 'smm_config.json'),
          JSON.stringify({
            projects: [
              {
                github_repository: 'org/repo-a',
                git_repository_location: '/tmp/repo-a',
              },
            ],
          }),
          'utf-8'
        );

        expect(
          () =>
            new Configuration(
              {
                SMM_STORE_DATA_AT: tempDir,
              },
              'nonexistent/repo'
            )
        ).toThrow('Project "nonexistent/repo" not found in smm_config.json');
      });

      it('should throw error when projects array is empty', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(join(tempDir, 'smm_config.json'), JSON.stringify({ projects: [] }), 'utf-8');

        expect(() => new Configuration({ SMM_STORE_DATA_AT: tempDir })).toThrow(
          'smm_config.json has empty projects array'
        );
      });

      it('should load from env vars when projects array is missing', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(
          join(tempDir, 'smm_config.json'),
          JSON.stringify({
            github_repository: 'org/repo',
            git_repository_location: '/tmp/repo',
          }),
          'utf-8'
        );

        const config = new Configuration({ SMM_STORE_DATA_AT: tempDir });
        expect(config.githubRepository).toBe('org/repo');
        expect(config.gitRepositoryLocation).toBe('/tmp/repo');
      });
    });
  });
});
