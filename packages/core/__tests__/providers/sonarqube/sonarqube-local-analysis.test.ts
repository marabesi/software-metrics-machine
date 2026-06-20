import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { SonarqubeLocalAnalysis } from '../../../src';
import { MockLoggerBuilder } from '../../mock-logger-builder';

type GetProjectKeyAccessor = {
  getProjectKey(scannerOptions: string): string;
};

function buildAnalysis(
  configOverrides: Record<string, unknown> = {},
  sonarqubePath = '/tmp/unused-sonarqube-path'
): SonarqubeLocalAnalysis {
  const configuration = {
    getSonarqubePath: () => sonarqubePath,
    ...configOverrides,
  };
  const logger = new MockLoggerBuilder().build();

  return new SonarqubeLocalAnalysis(configuration as never, undefined, logger);
}

describe('SonarqubeLocalAnalysis', () => {
  describe('getProjectKey', () => {
    it('extracts a double-quoted -Dsonar.projectKey value', () => {
      const analysis = buildAnalysis();

      const projectKey = (analysis as unknown as GetProjectKeyAccessor).getProjectKey(
        '-Dsonar.projectKey="my-quoted-project"'
      );

      expect(projectKey).toBe('my-quoted-project');
    });

    it('extracts a single-quoted -Dsonar.projectKey value', () => {
      const analysis = buildAnalysis();

      const projectKey = (analysis as unknown as GetProjectKeyAccessor).getProjectKey(
        "-Dsonar.projectKey='my-single-quoted-project'"
      );

      expect(projectKey).toBe('my-single-quoted-project');
    });

    it('extracts a bare -Dsonar.projectKey value', () => {
      const analysis = buildAnalysis();

      const projectKey = (analysis as unknown as GetProjectKeyAccessor).getProjectKey(
        '-Dsonar.projectKey=my-bare-project'
      );

      expect(projectKey).toBe('my-bare-project');
    });

    it('falls back to config.sonarProject when no match is found', () => {
      const analysis = buildAnalysis({ sonarProject: 'fallback-project' });

      const projectKey = (analysis as unknown as GetProjectKeyAccessor).getProjectKey('');

      expect(projectKey).toBe('fallback-project');
    });

    it('falls back to a transformed config.githubRepository when sonarProject is absent', () => {
      const analysis = buildAnalysis({ githubRepository: 'owner/my.repo' });

      const projectKey = (analysis as unknown as GetProjectKeyAccessor).getProjectKey('');

      expect(projectKey).toBe('owner_my_repo');
    });

    it('falls back to an empty string when nothing is configured', () => {
      const analysis = buildAnalysis();

      const projectKey = (analysis as unknown as GetProjectKeyAccessor).getProjectKey('');

      expect(projectKey).toBe('');
    });
  });

  describe('readLocalServerUrl', () => {
    it('returns undefined when the local data file does not exist', async () => {
      const sonarqubePath = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-sq-local-'));
      const analysis = buildAnalysis({}, sonarqubePath);

      expect(analysis.readLocalServerUrl()).toBeUndefined();
    });

    it('returns the serverUrl when the local data file holds valid JSON', async () => {
      const sonarqubePath = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-sq-local-'));
      await fs.writeFile(
        path.join(sonarqubePath, 'local_sonarqube_data.json'),
        JSON.stringify({ serverUrl: 'http://localhost:9000' })
      );
      const analysis = buildAnalysis({}, sonarqubePath);

      expect(analysis.readLocalServerUrl()).toBe('http://localhost:9000');
    });

    it('returns undefined when the local data file holds invalid JSON', async () => {
      const sonarqubePath = await fs.mkdtemp(path.join(os.tmpdir(), 'smm-sq-local-'));
      await fs.writeFile(
        path.join(sonarqubePath, 'local_sonarqube_data.json'),
        '{ not valid json'
      );
      const analysis = buildAnalysis({}, sonarqubePath);

      expect(analysis.readLocalServerUrl()).toBeUndefined();
    });
  });

  describe('getToken', () => {
    it('returns the configured sonarLocalRunnerToken without making an HTTP request', async () => {
      const analysis = buildAnalysis({ sonarLocalRunnerToken: 'reused-token' });

      const token = await analysis.getToken('http://localhost:9000', 'admin', 'password');

      expect(token).toBe('reused-token');
    });
  });
});
