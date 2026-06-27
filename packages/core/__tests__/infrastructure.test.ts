/**
 * Tests for Infrastructure
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it, expect } from 'vitest';
import { ConfigurationRepository } from '../src/infrastructure/configuration-repository';
import { TimeZoneProvider } from '../src/infrastructure/timezone-provider';

describe('Infrastructure', () => {
  describe('TimeZoneProvider', () => {
    it('uses timezone day boundaries for date-only values', () => {
      const provider = new TimeZoneProvider('UTC');

      expect(provider.getStartOfDayBoundary('2026-01-05').toISOString()).toBe(
        '2026-01-05T00:00:00.000Z'
      );
      expect(provider.getEndOfDayBoundary('2026-01-05').toISOString()).toBe(
        '2026-01-05T23:59:59.999Z'
      );
    });

    it('keeps full datetime values as exact filter boundaries', () => {
      const provider = new TimeZoneProvider('UTC');

      expect(provider.getStartOfDayBoundary('2026-01-05T08:30:00+01:00').toISOString()).toBe(
        '2026-01-05T07:30:00.000Z'
      );
      expect(provider.getEndOfDayBoundary('2026-01-05T17:45:00+01:00').toISOString()).toBe(
        '2026-01-05T16:45:00.000Z'
      );
    });
  });

  describe('Configuration', () => {
    let tempDir: string | undefined;

    afterEach(() => {
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
        tempDir = undefined;
      }
    });

    it('should create configuration from environment variables', () => {
      const env = {
        SMM_STORE_DATA_AT: '/tmp',
        OWNER_REPO_GIT_PROVIDER: 'github',
        OWNER_REPO_GITHUB_TOKEN: 'gh_test',
        OWNER_REPO_LOGGING_LEVEL: 'DEBUG',
        OWNER_REPO_GIT_REPOSITORY_PATH: '/tmp/repo',
      };
      const config = new ConfigurationRepository(env, 'owner/repo').getActiveConfiguration();
      expect(config.githubRepository).toBe('owner/repo');
      expect(config.gitProvider).toBe('github');
      expect(config.githubToken).toBe('gh_test');
      expect(config.loggingLevel).toBe('DEBUG');
      expect(config.storeData).toBe('/tmp');
      expect(config.getLogPath()).toBe(join('/tmp', 'github_owner_repo', 'smm.log'));
    });

    it('should load store logs configuration', () => {
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

      const config = new ConfigurationRepository({
        SMM_STORE_DATA_AT: tempDir,
      }).getActiveConfiguration();

      expect(config.storeLogs).toBe(true);
      expect(config.getLogPath()).toBe(join(tempDir, 'github_owner_repo', 'smm.log'));
    });

    it('should use default values when env vars not set', () => {
      const config = new ConfigurationRepository({
        SMM_STORE_DATA_AT: '/tmp',
      }).getActiveConfiguration();
      expect(config.loggingLevel).toBe('CRITICAL');
      expect(config.storeData).toBe('/tmp');
    });

    it('should validate configuration', () => {
      const config = new ConfigurationRepository({
        SMM_STORE_DATA_AT: '/tmp',
        OWNER_REPO_GIT_REPOSITORY_PATH: '/tmp/repo',
      }, 'owner/repo').getActiveConfiguration();
      const validation = config.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
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

        const config = new ConfigurationRepository({
          SMM_STORE_DATA_AT: tempDir,
        }).getActiveConfiguration();
        expect(config.githubRepository).toBe('org/repo-a');
        expect(config.gitRepositoryLocation).toBe('/tmp/repo-a');
        expect(config.githubToken).toBe('token-a');
      });

      it('should use root github_token as default when selected project has no github_token', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(
          join(tempDir, 'smm_config.json'),
          JSON.stringify({
            github_token: 'default-token',
            projects: [
              {
                github_repository: 'org/repo-a',
                git_repository_location: '/tmp/repo-a',
              },
              {
                github_repository: 'org/repo-b',
                git_repository_location: '/tmp/repo-b',
                github_token: 'project-token',
              },
            ],
          }),
          'utf-8'
        );

        const config = new ConfigurationRepository(
          {
            SMM_STORE_DATA_AT: tempDir,
            GITHUB_TOKEN: 'env-token',
          },
          'org/repo-a'
        ).getActiveConfiguration();

        expect(config.githubToken).toBe('default-token');
      });

      it('should prefer project github_token over root github_token', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(
          join(tempDir, 'smm_config.json'),
          JSON.stringify({
            github_token: 'default-token',
            projects: [
              {
                github_repository: 'org/repo-a',
                git_repository_location: '/tmp/repo-a',
                github_token: 'project-token',
              },
            ],
          }),
          'utf-8'
        );

        const config = new ConfigurationRepository(
          { SMM_STORE_DATA_AT: tempDir },
          'org/repo-a'
        ).getActiveConfiguration();

        expect(config.githubToken).toBe('project-token');
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

        const config = new ConfigurationRepository(
          { SMM_STORE_DATA_AT: tempDir },
          'org/repo-b'
        ).getActiveConfiguration();
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

        const config = new ConfigurationRepository({
          SMM_STORE_DATA_AT: tempDir,
        }).getActiveConfiguration();
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
            new ConfigurationRepository(
              {
                SMM_STORE_DATA_AT: tempDir,
              },
              'nonexistent/repo'
            )
        ).toThrow('Project "nonexistent/repo" not found');
      });

      it('should throw error when projects array is empty', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'smm-config-'));
        writeFileSync(join(tempDir, 'smm_config.json'), JSON.stringify({ projects: [] }), 'utf-8');

        expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir })).toThrow(
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

        const config = new ConfigurationRepository({
          SMM_STORE_DATA_AT: tempDir,
        }).getActiveConfiguration();
        expect(config.githubRepository).toBe('org/repo');
        expect(config.gitRepositoryLocation).toBe('/tmp/repo');
      });
    });
  });
});
