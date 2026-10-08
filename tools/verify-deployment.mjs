import { readFile } from 'node:fs/promises';
const base = new URL(process.env.SITE_URL);
const expected = JSON.parse(await readFile(new URL('../dist/release.json', import.meta.url), 'utf8'));
const worker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
const module = await readFile(new URL('../dist/src/release.js', import.meta.url), 'utf8');
const request = async path => {
  const url = new URL(path, base);
  url.searchParams.set('verify', `${expected.commit}-${Date.now()}`);
  const response = await fetch(url, { signal:AbortSignal.timeout(15000), cache:'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
};
let failure;
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    const [receipt, actualWorker, actualModule] = await Promise.all([request('release.json'), request('sw.js'), request('src/release.js')]);
    const actual = JSON.parse(receipt);
    if (actual.commit !== expected.commit || actual.version !== expected.version || actualWorker !== worker || actualModule !== module) throw new Error('Published release/cache does not match the tested artifact');
    console.log(`Verified live ${actual.version} (${actual.commit}) and exact offline worker`);
    process.exit(0);
  } catch (error) { failure = error; }
  await new Promise(resolve => setTimeout(resolve, 3000));
}
throw failure;
