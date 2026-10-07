import { readFile, writeFile } from 'node:fs/promises';

export async function renderRelease() {
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Release version must be major.minor.patch');
  return `// Generated from package.json by tools/build-release.mjs.\nexport const APP_VERSION = ${JSON.stringify(version)};\n`;
}

export async function buildRelease() {
  await writeFile(new URL('../src/release.js', import.meta.url), await renderRelease());
}
