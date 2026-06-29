import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getApplicationVersion } from '../src/app-version';

interface PackageJson {
  name: string;
  version: string;
}

function readPackageJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageJson;
}

describe('getApplicationVersion', () => {
  const originalCwd = process.cwd();
  const rootPackageJson = readPackageJson(resolve(__dirname, '../../../package.json'));
  const utilsPackageJson = readPackageJson(resolve(__dirname, '../package.json'));

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('returns the root launcher package version', () => {
    expect(rootPackageJson.name).toBe('@smmachine/launcher');
    expect(getApplicationVersion()).toBe(rootPackageJson.version);
  });

  it('does not use the nearest workspace package version', () => {
    process.chdir(resolve(__dirname, '..'));

    expect(utilsPackageJson.name).toBe('@smmachine/utils');
    expect(getApplicationVersion()).toBe(rootPackageJson.version);
    expect(getApplicationVersion()).not.toBe(utilsPackageJson.version);
  });
});
