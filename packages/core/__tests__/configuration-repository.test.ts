/**
 * Tests for ConfigurationRepository
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '@smmachine/utils';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { ConfigurationRepository } from '../src/infrastructure/configuration-repository';

describe('ConfigurationRepository', () => {
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

  describe('multi-project format', () => {
    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-'));
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
    });

    it('should load all projects', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-a');
      const projects = repo.getAllProjects();
      expect(projects).toHaveLength(2);
      expect(projects[0].github_repository).toBe('org/repo-a');
      expect(projects[1].github_repository).toBe('org/repo-b');
    });

    it('should get active configuration for the default project', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-a');
      const config = repo.getActiveConfiguration();
      expect(config.githubRepository).toBe('org/repo-a');
      expect(config.gitRepositoryLocation).toBe('/tmp/repo-a');
      expect(config.githubToken).toBe('token-a');
    });

    it('should default to first project when project is not specified', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir });
      const config = repo.getActiveConfiguration();
      expect(config.githubRepository).toBe('org/repo-a');
      expect(config.gitRepositoryLocation).toBe('/tmp/repo-a');
      expect(config.githubToken).toBe('token-a');
    });

    it('should find project by repository', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-a');
      const project = repo.getProjectByRepository('org/repo-b');
      expect(project).toBeDefined();
      expect(project?.github_repository).toBe('org/repo-b');
    });

    it('should return undefined for unknown repository', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-a');
      const project = repo.getProjectByRepository('nonexistent/repo');
      expect(project).toBeUndefined();
    });

    it('should find project by index', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-a');
      const project = repo.getProjectByIndex(1);
      expect(project).toBeDefined();
      expect(project?.github_repository).toBe('org/repo-b');
    });

    it('should return undefined for out-of-range index', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-a');
      expect(repo.getProjectByIndex(5)).toBeUndefined();
      expect(repo.getProjectByIndex(-1)).toBeUndefined();
    });

    it('should select project by name', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo-b');
      const config = repo.getActiveConfiguration();
      expect(config.githubRepository).toBe('org/repo-b');
    });

    it('should throw when project not found', () => {
      expect(
        () => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'nonexistent/repo')
      ).toThrow('Project "nonexistent/repo" not found');
    });
  });

  describe('missing projects array', () => {
    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-noprojects-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({
          github_repository: 'org/repo',
          git_repository_location: '/tmp/repo',
        }),
        'utf-8'
      );
    });

    it('should return empty projects list when projects array is missing', () => {
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo');
      expect(repo.getAllProjects()).toHaveLength(0);
    });
  });

  describe('empty projects array', () => {
    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-empty-'));
      writeFileSync(join(tempDir, 'smm_config.json'), JSON.stringify({ projects: [] }), 'utf-8');
    });

    it('should throw error when projects array is empty', () => {
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        'smm_config.json has empty projects array'
      );
    });
  });

  describe('no config file', () => {
    it('should handle missing config file gracefully', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-nofile-'));
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo');
      expect(repo.getAllProjects()).toHaveLength(0);
    });
  });

  describe('missing SMM_STORE_DATA_AT', () => {
    it('should throw error', () => {
      expect(() => new ConfigurationRepository({}, 'org/repo')).toThrow(
        'SMM_STORE_DATA_AT is required'
      );
    });
  });

  describe('config validation', () => {
    it('should throw when config file contains invalid JSON', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-invalidjson-'));
      writeFileSync(join(tempDir, 'smm_config.json'), '{ invalid json }', 'utf-8');
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /is not valid JSON/
      );
    });

    it('should throw when root is an array instead of object', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-rootarray-'));
      writeFileSync(join(tempDir, 'smm_config.json'), '[]', 'utf-8');
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /must be a JSON object, got array/
      );
    });

    it('should throw when root is a primitive', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-rootprim-'));
      writeFileSync(join(tempDir, 'smm_config.json'), '"hello"', 'utf-8');
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /must be a JSON object, got string/
      );
    });

    it('should throw when projects is not an array', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-projnotarray-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: 'not-an-array' }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /"projects" must be an array, got string/
      );
    });

    it('should throw when a project entry is not an object', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-projnotobj-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: ['not-an-object'] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\] must be a JSON object, got string/
      );
    });

    it('should throw when a project entry is null', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-projnull-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: [null] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\] must be a JSON object, got object/
      );
    });

    it('should throw when a project entry is an array', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-projarray-'));
      writeFileSync(join(tempDir, 'smm_config.json'), JSON.stringify({ projects: [[]] }), 'utf-8');
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\] must be a JSON object, got array/
      );
    });

    it('should throw when string field has wrong type', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-strfield-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: [{ github_repository: 123 }] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\]\.github_repository must be a string/
      );
    });

    it('should throw when store_logs is not a boolean', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-storelogs-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: [{ store_logs: 'yes' }] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\]\.store_logs must be a boolean/
      );
    });

    it('should throw when deployment_frequency_targets is not an array', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-deptarget-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: [{ deployment_frequency_targets: 'not-array' }] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\]\.deployment_frequency_targets must be an array/
      );
    });

    it('should throw when deployment_frequency_targets entry is not an object', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-deptargetobj-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: [{ deployment_frequency_targets: ['bad'] }] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\]\.deployment_frequency_targets\[0\] must be an object/
      );
    });

    it('should throw when deployment_frequency_targets entry missing pipeline', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-deptargetpipe-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: [{ deployment_frequency_targets: [{ job: 'deploy' }] }] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\]\.deployment_frequency_targets\[0\]\.pipeline must be a string/
      );
    });

    it('should throw when deployment_frequency_targets entry missing job', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-deptargetjob-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({ projects: [{ deployment_frequency_targets: [{ pipeline: 'ci' }] }] }),
        'utf-8'
      );
      expect(() => new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo')).toThrow(
        /projects\[0\]\.deployment_frequency_targets\[0\]\.job must be a string/
      );
    });

    it('should accept valid config with all fields', () => {
      tempDir = mkdtempSync(join(tmpdir(), 'smm-config-repo-valid-'));
      writeFileSync(
        join(tempDir, 'smm_config.json'),
        JSON.stringify({
          projects: [
            {
              git_provider: 'github',
              github_token: 'token',
              github_repository: 'org/repo',
              git_repository_location: '/tmp/repo',
              deployment_frequency_targets: [{ pipeline: 'ci', job: 'deploy' }],
              main_branch: 'main',
              log_level: 'DEBUG',
              store_logs: true,
              timezone: 'UTC',
            },
          ],
        }),
        'utf-8'
      );
      const repo = new ConfigurationRepository({ SMM_STORE_DATA_AT: tempDir }, 'org/repo');
      expect(repo.getAllProjects()).toHaveLength(1);
    });
  });
});
