"""Slice the prepared user-provided sheet into transparent world-map sprites.
Usage: python tools/import-user-battlefield.py PATH_TO_PREPARED_TRANSPARENT_SHEET
The input is the pasted sheet after background removal, not an invented asset pack.
"""
from PIL import Image
from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parents[1]
sheet=Path(sys.argv[1]);im=Image.open(sheet).convert('RGBA')
# Coordinates are normalized to the prepared 1254x1254 sheet. Scale them so
# identical sheets exported at another resolution can be imported safely.
boxes={
 'battlefield_corpse_blue':(158,0,313,82),
 'battlefield_corpse_red':(316,0,474,84),
 'battlefield_wagon_wreck':(154,163,314,309),
 'battlefield_bones':(782,309,945,472),
 'battlefield_firepit':(945,28,1100,152),
 'battlefield_barricade':(0,0,154,149),
 'battlefield_tent_side':(1099,232,1254,392),
 'battlefield_tent_front':(1101,474,1254,631),
 'battlefield_tent_round':(231,1108,393,1254),
 'battlefield_supply_wagon':(0,1105,229,1254),
 'battlefield_wheel':(475,0,566,77),
 'battlefield_crates':(0,865,151,1014),
 'battlefield_crate':(1101,786,1174,861),
 'battlefield_timbers':(944,631,1104,787),
 'battlefield_broken_barricade':(628,630,788,785),
 'battlefield_discarded_weapons':(154,865,315,952),
 'battlefield_helmets':(1099,627,1172,704),
 'battlefield_banner_red':(0,1017,77,1087),
 'battlefield_banner_blue':(1031,1023,1176,1103),
 'battlefield_corpse_green':(315,87,474,158),
 'battlefield_corpse_mail':(628,156,786,234),
 'battlefield_skeleton':(739,1018,851,1090),
 'battlefield_burnt_logs':(315,634,474,785),
 'battlefield_stone_pile':(944,475,1094,556),
 'battlefield_fallen_horse':(396,1091,621,1254),
 'battlefield_fallen_armored_horse':(1021,1115,1254,1254),
}
manifest=root/'assets/world/landmark-sources.json';data=json.loads(manifest.read_text())
data['assets']=[a for a in data['assets'] if not a.get('sourceType')=='user-provided']
for name,box in boxes.items():
 scaled=tuple(round(v*(im.width if i%2==0 else im.height)/1254)for i,v in enumerate(box))
 tile=im.crop(scaled);tile=tile.crop(tile.getbbox());tile.thumbnail((128,128),Image.Resampling.LANCZOS)
 p=root/'assets/world'/(name+'.png');tile.save(p,optimize=True)
 data['assets'].append(dict(file=str(p.relative_to(root)),sourceType='user-provided',author='User-provided Gemini battlefield sheet',source='Pasted battlefield sheet supplied in chat on 2026-10-04',license='User-provided artwork authorized for this project',original='User-pasted battlefield sheet',preparedSheetSha256=hashlib.sha256(sheet.read_bytes()).hexdigest(),crop=list(scaled),changes='Cream background removed using image editing; cropped to sprite bounds and downscaled to at most 128px. World renderer keeps human/skeleton remains at 16.5–18% of scene width; larger props form authored camp and battlefield compositions.',width=tile.width,height=tile.height,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
data['note']='Imported CC BY-SA derivatives retain CC BY-SA 3.0. User-provided battlefield art has separate provenance and is not represented as CC-licensed. Asset licenses do not change the game code license.'
manifest.write_text(json.dumps(data,indent=2)+'\n')
print('Prepared',len(boxes),'user-provided battlefield sprites.')
