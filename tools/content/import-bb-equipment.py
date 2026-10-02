#!/usr/bin/env python3
"""Rebuild the pinned Battle Brothers wearable catalog and embedded PNG art.
Requires Python 3 + Pillow. Runtime game has no dependencies or network requests.
Source downloads cache outside the repo; output is deterministic and hash recorded.
"""
import argparse, base64, concurrent.futures, hashlib, io, json, pathlib, re, struct, urllib.request
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
REPO = 'kovasap/battle-bros-decompiled'
COMMIT = 'e06d68df0915827967f98a05d0c705c1f53df0b7'
URL = f'https://raw.githubusercontent.com/{REPO}/{COMMIT}/'
parser = argparse.ArgumentParser()
parser.add_argument('--cache', default='/tmp/bb-source')
args = parser.parse_args()
CACHE = pathlib.Path(args.cache)
def fetch(path):
    file = CACHE / path
    if not file.exists():
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(urllib.request.urlopen(URL + path, timeout=90).read())
    return file.read_bytes()
def sha(data): return hashlib.sha256(data).hexdigest()
def string(text, key):
    match = re.search(r'this\.m\.' + key + r'\s*=\s*"((?:\\.|[^"\\])*)"', text)
    return match.group(1).replace("\\'", "'") if match else None
def number(text, key):
    match = re.search(r'this\.m\.' + key + r'\s*=\s*(-?\d+(?:\.\d+)?)\s*;', text)
    return int(float(match.group(1))) if match else None
# The full tree establishes coverage, including intentionally excluded non-human classes.
tree_file = CACHE / 'tree.json'
if not tree_file.exists():
    tree_file.parent.mkdir(parents=True, exist_ok=True)
    tree_file.write_bytes(urllib.request.urlopen(f'https://api.github.com/repos/{REPO}/git/trees/{COMMIT}?recursive=1', timeout=90).read())
tree = json.loads(tree_file.read_text())
if tree.get('truncated'): raise RuntimeError('Source inventory is truncated')
paths = sorted(x['path'] for x in tree['tree'] if x['path'].endswith('.nut') and x['path'].startswith(('scripts/items/armor/', 'scripts/items/helmets/')))
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: list(pool.map(fetch, paths))
brushes = {}
brush_sources = []
for i in range(8):
    path = f'brushes/entity_{i}.brush'; data = fetch(path); brush_sources.append({'path': path, 'sha256': sha(data)})
    for match in re.finditer(rb'[A-Za-z][A-Za-z0-9_]{3,}', data):
        name = match.group().decode(); start, end = match.span()
        if start < 2 or struct.unpack_from('<H', data, start - 2)[0] != len(name): continue
        source = re.search(rb'entity\\', data[end:end+130])
        if not source: continue
        pos = end + source.start(); length = struct.unpack_from('<H', data, pos - 2)[0]
        uv = struct.unpack_from('<8f', data, pos + length)
        if not (0 <= uv[0] < uv[1] <= 1 and 0 <= uv[2] < uv[3] <= 1): continue
        brushes[name] = {'atlas': f'gfx/entity_{i}.png', 'uv': uv[:4], 'bounds': uv[4:]}
records, excluded = [], []
for path in paths:
    text = fetch(path).decode(); stem = pathlib.PurePosixPath(path).stem
    if any(part in path for part in ['/greenskins/', 'unhold_', 'wardog_']) or stem in ['armor', 'helmet', 'named_armor', 'named_helmet']:
        excluded.append({'path': path, 'reason': 'Non-human equipment or abstract parent class'}); continue
    slot = 'armor' if '/armor/' in path else 'helmet'
    armor, value = number(text, 'ConditionMax'), number(text, 'Value')
    if armor is None or value is None: raise RuntimeError(f'Unresolved stats: {path}')
    variant = number(text, 'Variant')
    if variant is None:
        match = re.search(r'(?:this\.m\.Variant|local variant)\s*=\s*this\.Math\.rand\((\d+),\s*(\d+)\)', text) or re.search(r'local variants\s*=\s*\[\s*(\d+)', text)
        if match: variant = int(match[1])
    if variant is None: raise RuntimeError(f'Unresolved variant: {path}')
    variant_string = string(text, 'VariantString') or ('body' if slot == 'armor' else 'helmet')
    suffix = str(variant).zfill(2)
    sprite = f'bust_{variant_string}_{suffix}'
    # A handful of vanilla overrides use different sprite families.
    sprite_prefix = string(text, 'Sprite')
    if sprite_prefix and sprite_prefix.endswith('_'): sprite = sprite_prefix + suffix
    elif sprite_prefix: sprite = sprite_prefix
    icon = ('armor/inventory_' + variant_string + '_armor_' + suffix + '.png') if slot == 'armor' else ('helmets/inventory_' + variant_string + '_' + suffix + '.png')
    icon_override = string(text, 'IconLarge') or string(text, 'Icon')
    if icon_override and icon_override.endswith('_'): icon = icon_override + suffix + '.png'
    elif icon_override: icon = icon_override
    icon_path = 'gfx/ui/items/' + icon
    available = {x['path'] for x in tree['tree']}
    if icon_path not in available:
        # Noble NPC garments do not define inventory art; use their actual worn sprite as the icon.
        icon_path = None
    if sprite not in brushes: raise RuntimeError(f'Missing actual worn sprite {sprite}: {path}')
    item_id = 'bb-' + stem.replace('_', '-')
    if len(item_id) > 40: item_id = item_id[:31].rstrip('-') + '-' + hashlib.sha256(path.encode()).hexdigest()[:8]
    collection = 'base'
    if '/barbarians/' in path or stem in ['cultist_leather_robe', 'cultist_hood', 'cultist_leather_hood']: collection = 'warriors-of-the-north'
    if '/oriental/' in path or stem in ['gold_and_black_turban', 'golden_scale_armor', 'named_golden_lamellar_armor', 'leopard_armor', 'named_bronze_armor', 'named_metal_bull_helmet', 'named_metal_nose_horn_helmet', 'named_metal_skull_helmet']: collection = 'blazing-deserts'
    if stem in ['named_plated_fur_armor','named_skull_and_chain_armor','named_nordic_helmet_with_closed_mail']: collection = 'warriors-of-the-north'
    if stem == 'fangshire': collection = 'supporter-edition'
    if stem in ['lindwurm_armor', 'lindwurm_helmet']: collection = 'lindwurm'
    if stem in ['ijirok_armor', 'ijirok_helmet', 'armor_of_davkul', 'mask_of_davkul', 'emperors_armor', 'emperors_armor_fake', 'emperors_countenance', 'wizard_robe', 'wizard_hat']: collection = 'beasts-and-exploration'
    if stem in ['adorned_heavy_mail_hauberk', 'adorned_mail_shirt', 'adorned_warriors_armor', 'adorned_closed_flat_top_with_mail', 'adorned_full_helm', 'physician_mask', 'undertaker_hat', 'undertaker_apron']: collection = 'of-flesh-and-faith'
    source_kind = 'legendary' if '/legendary/' in path else 'named' if '/named/' in path else 'ordinary'
    name = string(text, 'Name') or stem.replace('named_', '').replace('_', ' ').title()
    raw_description = string(text, 'Description') or f'The {name.lower()} worn in Battle Brothers.'
    raw_description = raw_description.replace('%sacrifice%', 'a fallen cultist')
    description = raw_description if len(raw_description) > 20 else raw_description + ' Light cloth protection for the road.'
    if source_kind == 'legendary' or stem in ['lindwurm_armor', 'lindwurm_helmet']:
        description = f'An adapted {name.lower()} with its original baseline protection and fatigue. Original scripted magical effects are not simulated.'
    item = {'id': item_id, 'name': name, 'slot': slot, 'visual': item_id, 'price': max(5, round(value * .35)) if value > 0 else max(40, armor * 5 + max(0, 30 - max(0, -(number(text, 'StaminaModifier') or 0))) * 30), 'armor': armor, 'fatigue': max(0, -(number(text, 'StaminaModifier') or 0)), 'collection': collection, 'sourceKind': source_kind, 'description': description,
        'role': f'{name} provides {armor} {"body" if slot == "armor" else "head"} protection at a {max(0, -(number(text, "StaminaModifier") or 0))} fatigue cost; compare weight before outfitting the front rank.'}
    if collection == 'warriors-of-the-north': item['region'] = 'north'
    elif collection == 'blazing-deserts': item['region'] = 'south'
    records.append({'item': item, 'source': path, 'sourceSha256': sha(fetch(path)), 'sourceValue': value, 'sourceVision': number(text, 'Vision') or 0, 'sourceDescription': raw_description,
        'sprite': sprite, 'icon': icon_path, 'hideHead': bool(re.search(r'this\.m\.HideCharacterHead\s*=\s*true', text)), 'hideBeard': bool(re.search(r'this\.m\.HideBeard\s*=\s*true', text))})
if len({r['item']['id'] for r in records}) != len(records): raise RuntimeError('Duplicate item IDs')
needed = sorted({brushes[r['sprite']]['atlas'] for r in records} | {r['icon'] for r in records if r['icon']})
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: list(pool.map(fetch, needed))
images = {path: Image.open(io.BytesIO(fetch(path))).convert('RGBA') for path in needed if path.startswith('gfx/entity_')}
art, assets = {}, []
for r in records:
    spec = brushes[r['sprite']]; atlas = images[spec['atlas']]; u1,u2,v1,v2 = spec['uv']; x1,x2,y1,y2 = spec['bounds']
    rect = [round(u1*atlas.width), round(v1*atlas.height), round(u2*atlas.width), round(v2*atlas.height)]
    if not (0 <= rect[0] < rect[2] <= atlas.width and 0 <= rect[1] < rect[3] <= atlas.height): raise RuntimeError('Invalid crop')
    # Entity atlas texels are stored upside down; restore the brush's display orientation.
    worn = atlas.crop(rect).transpose(Image.Transpose.FLIP_TOP_BOTTOM); out = io.BytesIO(); worn.save(out, format='PNG', optimize=False, compress_level=9); png = out.getvalue()
    icon = fetch(r['icon']) if r['icon'] else png
    uri = lambda data: 'data:image/png;base64,' + base64.b64encode(data).decode()
    art[r['item']['id']] = {'icon': uri(icon), 'portrait': uri(png), 'left': round(52 + x1), 'top': round(63 - y2), 'hideHead': r['hideHead'], 'hideBeard': r['hideBeard']}
    assets.append({'id': r['item']['id'], 'icon': r['icon'], 'iconSha256': sha(icon), 'atlas': spec['atlas'], 'atlasSha256': sha(fetch(spec['atlas'])), 'brush': r['sprite'], 'crop': rect, 'portraitSha256': sha(png), 'transform': 'vertical flip from entity atlas texture orientation'})
(ROOT / 'src/dlc-items.js').write_text('// Generated by tools/content/import-bb-equipment.py.\nexport const DLC_ITEMS = Object.freeze(' + json.dumps([r['item'] for r in records], indent=2, ensure_ascii=False) + '.map(Object.freeze));\n')
(ROOT / 'src/dlc-art.js').write_text('// Generated; exact source inventory images and atlas-extracted worn layers.\nexport const DLC_ART = Object.freeze(' + json.dumps(art, separators=(',', ':')) + ');\n')
manifest = {'repository': REPO, 'commit': COMMIT, 'scope': 'All concrete human-wearable body armor and helmet definitions in the pinned source, including ordinary, named, legendary, ancient and DLC designs. Cosmetic variants use a fixed representative. Creature equipment and abstract parents are excluded.', 'priceConversion': '35% of positive source value, minimum 5 crowns; zero-valued NPC designs use armor * 5 + max(0, 30 - fatigue) * 30, minimum 40 crowns', 'coverage': len(records), 'records': records, 'excluded': excluded, 'brushes': brush_sources, 'assets': assets}
(ROOT / 'assets/dlc-equipment-source.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
print(f'Imported {len(records)} designs ({sum(r["item"]["slot"]=="armor" for r in records)} body armors, {sum(r["item"]["slot"]=="helmet" for r in records)} helmets).')
