import { readFile, writeFile } from 'node:fs/promises';

export function releaseVersion(version, distance = 0) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Release version must be major.minor.patch');
  if (!Number.isSafeInteger(distance) || distance < 0) throw new Error('Invalid release distance');
  const parts = version.split('.').map(Number);
  if (parts.some(part => !Number.isSafeInteger(part))) throw new Error('Invalid release version components');
  const patch = parts[2] + distance;
  if (!Number.isSafeInteger(patch)) throw new Error('Release patch overflow');
  return `${parts[0]}.${parts[1]}.${patch}`;
}

export async function renderRelease({ distance = 0, commit = null } = {}) {
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  if (commit !== null && !/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid release commit');
  return `// Generated from package.json by tools/build-release.mjs.\nexport const APP_VERSION = ${JSON.stringify(releaseVersion(version, distance))};\nexport const BUILD_COMMIT = ${JSON.stringify(commit)};\n`;
}

export async function buildRelease(options) {
  await writeFile(new URL('../src/release.js', import.meta.url), await renderRelease(options));
}
