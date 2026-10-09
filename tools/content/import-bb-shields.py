#!/usr/bin/env python3
"""Import omitted human shield designs from the same pinned source as armor.
Requires Python 3, Pillow and Node. Source cache lives outside the checkout.
Existing shield IDs/stats stay unchanged; every excluded source is recorded.
"""
import argparse, base64, concurrent.futures, hashlib, io, json, pathlib, re, subprocess, urllib.request
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
REPO = 'kovasap/battle-bros-decompiled'
COMMIT = 'e06d68df0915827967f98a05d0c705c1f53df0b7'
parser = argparse.ArgumentParser()
parser.add_argument('--cache', default='/tmp/bb-shield-source')
CACHE = pathlib.Path(parser.parse_args().cache)
def fetch(path):
    file = CACHE / path
    if not file.exists():
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(urllib.request.urlopen(f'https://raw.githubusercontent.com/{REPO}/{COMMIT}/{path}', timeout=60).read())
    return file.read_bytes()
def sha(data): return hashlib.sha256(data).hexdigest()
def string(text, key):
    match = re.search(r'this\.m\.' + key + r'\s*=\s*"((?:\\.|[^"\\])*)"', text)
    return match.group(1).replace("\\'", "'") if match else None
def number(text, key):
    match = re.search(r'this\.m\.' + key + r'\s*=\s*(-?\d+)\s*;', text)
    if not match: raise RuntimeError(f'Unresolved {key}')
    return int(match.group(1))
tree_file = CACHE / 'tree.json'
if not tree_file.exists():
    tree_file.parent.mkdir(parents=True, exist_ok=True)
    tree_file.write_bytes(urllib.request.urlopen(f'https://api.github.com/repos/{REPO}/git/trees/{COMMIT}?recursive=1', timeout=60).read())
tree = json.loads(tree_file.read_text())
if tree.get('truncated'): raise RuntimeError('Truncated source inventory')
paths = sorted(x['path'] for x in tree['tree'] if x['path'].startswith('scripts/items/shields/') and x['path'].endswith('.nut'))
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: list(pool.map(fetch, paths))
existing = {'buckler_shield':'buckler','heater_shield':'heater-shield','kite_shield':'kite-shield','wooden_shield':'round-shield','southern_light_shield':'adarga'}
records, excluded = [], []
for path in paths:
    stem = pathlib.PurePosixPath(path).stem
    if stem in existing:
        excluded.append({'path':path,'reason':'Existing OG-balanced campaign shield','existingId':existing[stem]}); continue
    if stem in ['shield','named_shield'] or '/greenskins/' in path or '/beasts/' in path or stem=='named_orc_heavy_shield':
        excluded.append({'path':path,'reason':'Abstract parent or creature-specific equipment'}); continue
    text = fetch(path).decode(); variant_match = re.search(r'this\.m\.Variant\s*=\s*(?:this.Math.rand\()?([0-9]+)', text)
    variant = int(variant_match.group(1)) if variant_match else 1
    sprite, icon = string(text,'Sprite'), string(text,'IconLarge')
    # Concrete source expressions concatenate representative variant 1. Faction
    # shields additionally use house 1 with their native two-digit identifiers.
    if stem.startswith('faction_'):
        family = {'faction_heater_shield':'heater','faction_kite_shield':'kite','faction_wooden_shield':'round'}[stem]
        sprite = f'faction_shield_{family}_01_01'; icon = f'shields/inventory_{sprite}.png'
    elif stem in ['heater_shield','kite_shield','wooden_shield']:
        sprite += str(variant).zfill(2); icon += str(variant).zfill(2)+'.png'
    else:
        if re.search(r'this\.m\.Sprite\s*=\s*"[^"\n]+"\s*\+', text): sprite += str(variant)
        if re.search(r'this\.m\.IconLarge\s*=\s*"[^"\n]+"\s*\+', text): icon += str(variant)+'.png'
    icon = 'gfx/ui/items/'+icon
    if icon not in {x['path'] for x in tree['tree']}: raise RuntimeError(f'Missing icon: {icon}')
    name = string(text,'Name') or stem.replace('named_', '').replace('_',' ').title()
    if stem.startswith('faction_'): name = 'Heraldic '+name
    culture = 'ancient' if '/ancient/' in path or 'undead' in stem or stem.startswith('worn_') else 'south' if '/oriental/' in path or 'sipar' in stem else 'mercenary'
    kind = 'legendary' if '/legendary/' in path else 'named' if '/named/' in path else 'crafted' if '/special/' in path else 'ordinary'
    collection = 'blazing-deserts' if culture=='south' else 'lindwurm' if 'lindwurm' in stem else 'beasts-and-exploration' if kind in ['crafted','legendary'] else 'base'
    description = string(text,'Description') or f'A rare {name.lower()} with distinctive workmanship.'
    if kind in ['crafted','legendary']: description += ' Adapted as equipment; source regeneration and magical effects are not simulated.'
    defense, ranged, durability, fatigue, value = [number(text,k) for k in ['MeleeDefense','RangedDefense','ConditionMax','StaminaModifier','Value']]
    item = {'id':'bb-'+stem.replace('_','-'),'name':name,'slot':'shield','visual':'bb-'+stem.replace('_','-'),'price':max(40,round(value*.35)),'armor':defense,'defense':defense,'rangedDefense':ranged,'durability':durability,'fatigue':-fatigue,'collection':collection,'sourceKind':kind,'sourceCulture':culture,'description':description,'role':f'+{defense} melee defense, +{ranged} ranged defense; {durability} durability at a {-fatigue} fatigue cost.'}
    if culture=='south': item['region']='south'
    if kind in ['named','legendary']: item.update({'rarity':'named','sourceNamedShield':True,'sourceStats':{k:item[k] for k in ['armor','defense','rangedDefense','durability','fatigue']}})
    records.append({'item':item,'source':path,'sourceSha256':sha(fetch(path)),'sourceValue':value,'sprite':sprite,'icon':icon})
# Use the game's existing deterministic two-modifier rules for imported named
# designs, while retaining their baseline for subsequent saved famed rolls.
script="""import {rollNamedItem} from './src/named-rolls.js';let input='';for await(const c of process.stdin)input+=c;const records=JSON.parse(input);for(const r of records)if(r.item.sourceNamedShield){let seed=2166136261;for(const c of r.item.id){seed^=c.charCodeAt(0);seed=Math.imul(seed,16777619);}const rolled=rollNamedItem(r.item,r.item.id,seed>>>0,{shieldDurability:r.item.durability});r.item={...rolled,price:Math.max(500,r.item.price*2),role:`+${rolled.defense} melee defense, +${rolled.rangedDefense} ranged defense; ${rolled.durability} durability at a ${rolled.fatigue} fatigue cost, with two permanent rolled bonuses.`};}process.stdout.write(JSON.stringify(records));"""
records = json.loads(subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,input=json.dumps(records),text=True,capture_output=True,check=True).stdout)
needed = sorted({r['icon'] for r in records})
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: list(pool.map(fetch,needed))
art, assets = {}, []
for r in records:
    icon=fetch(r['icon']);image=Image.open(io.BytesIO(icon)).convert('RGBA');rect=image.getchannel('A').getbbox()
    if rect is None: raise RuntimeError('Empty inventory art')
    worn=image.crop(rect)
    # Native worn shield brushes are absent from this pinned repository. Adapt
    # its authentic inventory design to the offhand layer, with explicit
    # provenance. Only the shield is fitted; the brother stays at native scale.
    worn.thumbnail((46,72),Image.Resampling.LANCZOS)
    out=io.BytesIO();worn.save(out,format='PNG',compress_level=9);png=out.getvalue()
    uri=lambda data:'data:image/png;base64,'+base64.b64encode(data).decode()
    art[r['item']['id']]={'icon':uri(icon),'portrait':uri(png),'left':104-worn.width,'top':116-worn.height,'width':worn.width,'height':worn.height}
    assets.append({'id':r['item']['id'],'icon':r['icon'],'iconSha256':sha(icon),'sourceSprite':r['sprite'],'crop':list(rect),'portraitSha256':sha(png),'transform':'Alpha-trim inventory art, preserve aspect ratio within 46x72 offhand layer; worn brushes unavailable in pinned source'})
(ROOT/'src/dlc-shields.js').write_text('// Generated by tools/content/import-bb-shields.py.\nexport const DLC_SHIELDS = Object.freeze('+json.dumps([r['item'] for r in records],indent=2)+'.map(item=>Object.freeze({...item,...(item.sourceStats?{sourceStats:Object.freeze(item.sourceStats),bonuses:Object.freeze(item.bonuses.map(Object.freeze)),rollModifiers:Object.freeze(item.rollModifiers)}:{})})));\n')
(ROOT/'src/dlc-shield-art.js').write_text('// Generated source inventory art and explicitly adapted offhand layers.\nexport const DLC_SHIELD_ART = Object.freeze('+json.dumps(art,separators=(',',':'))+');\n')
(ROOT/'assets/dlc-shields-source.json').write_text(json.dumps({'repository':REPO,'commit':COMMIT,'scope':'All concrete human shield designs missing from the existing campaign. Existing shield IDs retain their stats; creature-specific shields and abstract parents are excluded. Fixed representative heraldry/cosmetics.','coverage':len(records),'records':records,'excluded':excluded,'assets':assets},indent=2)+'\n')
print(f'Imported {len(records)} shield designs; {len(excluded)} accounted exclusions.')
