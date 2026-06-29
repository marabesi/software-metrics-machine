import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT_PACKAGE_NAME = '@smmachine/launcher';
const FALLBACK_VERSION = '0.0.0';

let cachedVersion: string | undefined;

interface PackageJson {
  name?: string;
  version?: string;
}

function readPackageJson(filePath: string): PackageJson | undefined {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as PackageJson;
  } catch {
    return undefined;
  }
}

function findLauncherPackageJson(startAt: string): PackageJson | undefined {
  let currentDirectory = resolve(startAt);

  while (true) {
    const packageJsonPath = join(currentDirectory, 'package.json');

    if (existsSync(packageJsonPath)) {
      const packageJson = readPackageJson(packageJsonPath);
      if (packageJson?.name === ROOT_PACKAGE_NAME) {
        return packageJson;
      }
    }

    const parentDirectory = dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return undefined;
    }

    currentDirectory = parentDirectory;
  }
}

export function getApplicationVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  const packageJson = findLauncherPackageJson(__dirname) ?? findLauncherPackageJson(process.cwd());
  cachedVersion = packageJson?.version ?? process.env.npm_package_version ?? FALLBACK_VERSION;

  return cachedVersion;
}
