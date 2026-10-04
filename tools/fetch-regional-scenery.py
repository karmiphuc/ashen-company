"""Download pinned CC BY-SA 0 A.D. source art for regional scenery.
Usage: python tools/fetch-regional-scenery.py SOURCE_DIR
Then blender -b --python tools/render-regional-scenery.py -- SOURCE_DIR RENDER_DIR
Then python tools/import-regional-scenery.py SOURCE_DIR RENDER_DIR USER_SHEET
"""
import pathlib,json,urllib.request,hashlib,sys,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1];dest=pathlib.Path(sys.argv[1]);dest.mkdir(exist_ok=True,parents=True)
recipes=json.loads((root/'tools/regional-scenery-recipes.json').read_text());rev=recipes[0]['revision'];base=f'https://raw.githubusercontent.com/0ad/0ad/{rev}/binaries/data/mods/public/art/'
files={path:sha for r in recipes for path,sha in [('meshes/'+r['mesh'],r['meshSha256']),('textures/skins/'+r['texture'],r['textureSha256'])]}
def fetch(entry):
 path,sha=entry;p=dest/path;p.parent.mkdir(exist_ok=True,parents=True)
 data=p.read_bytes()if p.exists()else urllib.request.urlopen(base+path,timeout=30).read()
 if hashlib.sha256(data).hexdigest()!=sha:raise ValueError('Source hash mismatch: '+path)
 p.write_bytes(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:list(pool.map(fetch,files.items()))
(dest/'recipes.json').write_text(json.dumps(recipes,indent=2)+'\n');print('Verified',len(files),'pinned mesh/texture sources.')
