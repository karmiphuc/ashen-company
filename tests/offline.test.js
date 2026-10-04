import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { listOfflineAssets, renderServiceWorker } from '../tools/build-cache.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function runtimeMediaFiles(directory, extensions = /\.(png|jpg|mp3)$/i) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return runtimeMediaFiles(path, extensions);
    if (entry.isFile() && extensions.test(entry.name) && !/^contact[-_]sheet/i.test(entry.name)) {
      return ['./' + relative(ROOT, path).split(sep).join('/')];
    }
    return [];
  }));
  return paths.flat().sort();
}

function offlineAudioWorker(source, audioPath, bytes) {
  const listeners = new Map();
  const state = { fetches: 0, arrayBufferReads: 0, cachedResponse: null };
  const scope = 'https://ashen-company.test/';
  const cache = {
    async match(request) {
      if (!request.url.startsWith(scope) || !new URL(request.url).pathname.endsWith('.mp3')) return null;
      const response = new Response(bytes.slice(), { headers: { 'Content-Type': 'audio/mpeg', ETag: '"offline-audio"' } });
      const readArrayBuffer = response.arrayBuffer.bind(response);
      response.arrayBuffer = async () => {
        state.arrayBufferReads++;
        return readArrayBuffer();
      };
      state.cachedResponse = response;
      return response;
    },
  };
  const self = {
    registration: { scope },
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  runInNewContext(source, {
    self,
    caches: { async open() { return cache; } },
    URL,
    Request,
    Response,
    Headers,
    fetch() { state.fetches++; throw new Error('network access is unavailable in this test'); },
  });
  const listener = listeners.get('fetch');
  assert.equal(typeof listener, 'function', 'service worker fetch handler is missing');

  return {
    state,
    async request(range) {
      const request = new Request(new URL(audioPath.slice(2), scope), { headers: range ? { Range: range } : {} });
      const event = { request, respondWith(response) { this.response = response; } };
      listener(event);
      return event.response;
    },
  };
}

test('offline list contains every runtime media asset and required app file', async () => {
  const assets = await listOfflineAssets();
  assert.equal(new Set(assets).size, assets.length);
  for (const path of ['./', './index.html', './src/app.js', './src/audio.js', './src/engine.js', './src/additional-items.js', './src/map.js', './src/portraits.js', './src/style.css', './manifest.webmanifest', './assets/icon.svg', './assets/world/figure_undead_host.svg']) {
    assert.ok(assets.includes(path), `${path} is missing`);
  }
  for(const path of await runtimeMediaFiles(join(ROOT,'src'), /\.(js|css)$/i)) assert.ok(assets.includes(path),path+' runtime source is missing from offline cache');
  assert.ok(assets.some(path => path.startsWith('./assets/audio/') && path.endsWith('.mp3')), 'offline audio files are missing');
  for (const path of ['./src/combat-skills.js', './src/tactical-ai.js', './src/area-safety.js']) assert.ok(assets.includes(path), `${path} is missing`);
  assert.deepEqual(assets.filter(path => /\.(png|jpg|mp3)$/i.test(path)).sort(), await runtimeMediaFiles(join(ROOT, 'assets')));
  assert.ok(assets.every(path => !path.includes('contact-sheet') && !path.includes('ASSET-CREDITS')));
  for (const path of assets) {
    await assert.doesNotReject(readFile(join(ROOT, path === './' ? 'index.html' : path.slice(2))));
  }
});

test('generated service worker matches current content and serves local requests from cache', async () => {
  const source = await readFile(join(ROOT, 'sw.js'), 'utf8');
  const manifest = source.match(/^const ASSETS = (\[[\s\S]*?\]);$/m);
  assert.ok(manifest, 'generated asset list is missing');
  assert.deepEqual(JSON.parse(manifest[1]), await listOfflineAssets());
  assert.equal(source, await renderServiceWorker(), 'run node tools/build-cache.mjs after changing app files or art');
  assert.match(source, /cache\.addAll\(urls\.map\(url => new Request\(url, \{ cache: 'reload' \}\)\)\)/);
  assert.match(source, /await caches\.delete\(CACHE\)/);
  assert.match(source, /count: present\.filter\(Boolean\)\.length/);
  assert.doesNotMatch(source, /fetch\(event\.request\)/);
});

test('cached MP3 requests support byte ranges without network or unnecessary full-body reads', async () => {
  const assets = await listOfflineAssets();
  const audioPath = assets.find(path => path.startsWith('./assets/audio/') && path.endsWith('.mp3'));
  assert.ok(audioPath, 'offline audio files are missing');
  const bytes = Uint8Array.from([10, 20, 30, 40, 50, 60]);
  const worker = offlineAudioWorker(await renderServiceWorker(), audioPath, bytes);

  const full = await worker.request();
  assert.equal(full.status, 200);
  assert.strictEqual(full, worker.state.cachedResponse, 'a normal cached request should return the cached response unchanged');
  assert.equal(full.headers.get('content-type'), 'audio/mpeg');
  assert.equal(worker.state.arrayBufferReads, 0, 'normal cached playback should not read the full body');
  assert.equal(worker.state.fetches, 0);

  for (const [range, expectedBytes, contentRange] of [
    ['bytes=1-3', [20, 30, 40], 'bytes 1-3/6'],
    ['bytes=4-', [50, 60], 'bytes 4-5/6'],
    ['bytes=-2', [50, 60], 'bytes 4-5/6'],
  ]) {
    const response = await worker.request(range);
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('content-range'), contentRange, range);
    assert.equal(response.headers.get('accept-ranges'), 'bytes', range);
    assert.equal(response.headers.get('content-length'), String(expectedBytes.length), range);
    assert.equal(response.headers.get('content-type'), 'audio/mpeg', range);
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], expectedBytes, range);
    assert.equal(worker.state.fetches, 0);
  }

  for (const range of ['bytes=4-2', 'bytes=99-']) {
    const response = await worker.request(range);
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), 'bytes */6', range);
    assert.equal(worker.state.fetches, 0);
  }
});

async function updateWorker({oldCache=true,complete=true,modern=true,saveReady=true,navigationPending=false}={}) {
  const source=await renderServiceWorker(),listeners=new Map(),events=[],timers=new Map();let clock=0;
  const scope='https://example.test/ashen-company/';
  const clients=[{url:scope,async navigate(url){events.push({type:'navigate',url});if(navigationPending)await new Promise(()=>{});},postMessage(message,ports){events.push({type:'prepare',message});if(modern)ports[0].reply({ready:saveReady});}},
    {url:'https://example.test/another-game/',async navigate(){assert.fail('must not reload another application');},postMessage(){assert.fail('must not notify another application');}}];
  class Channel {constructor(){this.port1={close(){}};this.port2={reply:data=>this.port1.onmessage({data})};}}
  runInNewContext(source,{self:{registration:{scope},addEventListener(type,fn){listeners.set(type,fn);},clients:{async matchAll(options){events.push({type:'windows',options});return clients;},async claim(){events.push({type:'claim'});}}},
    caches:{async open(){return {async match(){return complete?{}:null;}};},async keys(){return ['unrelated-cache',...(oldCache?['ashen-company-old']:[])];},async delete(key){events.push({type:'delete',key});}},MessageChannel:Channel,URL,Request,Response,Headers,
    setTimeout(fn){const id=++clock;timers.set(id,fn);queueMicrotask(()=>{if(timers.delete(id))fn();});return id;},clearTimeout(id){timers.delete(id);}});
  let work;listeners.get('activate')({waitUntil(promise){work=promise;}});await work;
  return events;
}

test('complete upgrades reload existing legacy windows so old mount modules cannot survive a new cache',async()=>{
  const events=await updateWorker({modern:false});
  assert.deepEqual(events.map(e=>e.type),['windows','delete','claim','prepare','navigate']);
  assert.equal(events.at(-1).url,'https://example.test/ashen-company/');
  assert.equal(events.find(e=>e.type==='delete').key,'ashen-company-old');
  assert.equal(events.find(e=>e.type==='prepare').message.type,'PREPARE_UPDATE');
});

test('modern update handshake precedes navigation and a failed save prevents reload',async()=>{
  const ready=await updateWorker();assert.ok(ready.find(e=>e.type==='navigate'));
  const blocked=await updateWorker({saveReady:false});assert.ok(blocked.find(e=>e.type==='prepare'));assert.ok(!blocked.find(e=>e.type==='navigate'));
});

test('first installs do not reload and incomplete updates never claim, delete or navigate',async()=>{
  const first=await updateWorker({oldCache:false});assert.deepEqual(first.map(e=>e.type),['claim']);
  await assert.rejects(updateWorker({complete:false}),/Offline cache is incomplete/);
});

test('activation completes even when a navigation waits for the new worker to activate',async()=>{
  const events=await updateWorker({navigationPending:true});assert.ok(events.find(e=>e.type==='navigate'));
});
