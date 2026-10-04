"""Prepare credited regional scenery; no Cethiel ruins or invented source attribution.
Usage: python tools/import-regional-scenery.py SOURCE_DIR RENDER_DIR USER_SHEET
Render first with tools/render-regional-scenery.py. recipes.json pins source meshes.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import json,hashlib,math,sys,urllib.request
root=Path(__file__).resolve().parents[1];source,render,sheet=map(Path,sys.argv[1:]);output=root/'assets/world';assets=[]
rev='61a3b9507d974084e6badb88a0826bd89a6d5b8b';base=f'https://raw.githubusercontent.com/0ad/0ad/{rev}/binaries/data/mods/public/art/'
def save(name,im,info):
 im=im.convert('RGBA');im=im.crop(im.getbbox());im.thumbnail((256,256),Image.Resampling.LANCZOS)
 p=output/(name+'.png');im.save(p,optimize=True)
 assets.append(dict(file=str(p.relative_to(root)),**info,width=im.width,height=im.height,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
def tone(im,dark,light):
 a=im.getchannel('A');im=ImageOps.colorize(ImageOps.grayscale(im),dark,light).convert('RGBA');im.putalpha(a);return im
recipes=json.loads((source/'recipes.json').read_text())
for spec in recipes:
 name=spec['name']
 if name=='scene_columns':continue
 im=Image.open(render/(name+'.png')).convert('RGBA')
 if name in ['scene_statue','scene_angel']:im=tone(im,'#454941','#d1c9ae')
 else:im=ImageEnhance.Color(im).enhance(.65)
 components=[spec]+([s for s in recipes if s['name']=='scene_columns']if name=='scene_sanctuary'else[])
 info=dict(author='Wildfire Games',source=f'https://github.com/0ad/0ad/tree/{rev}/binaries/data/mods/public/art',license='https://creativecommons.org/licenses/by-sa/3.0/',original={'revision':rev,'components':components},changes='Transparent textured isometric Blender render; padding trimmed, palette muted and downscaled. Statues adapted to weathered stone, preserving source shapes. Recipe: tools/render-regional-scenery.py.')
 save(name,im,info)
 # Two readable climates; the sanctuary is ancient stone, not a claimed Gothic cathedral.
 if name=='scene_ruin_farm':save('scene_chapel',tone(im,'#344137','#b8b499'),info|{'changes':info['changes']+' Mossy forest palette.'})
 if name=='scene_ruin_tower':save('scene_frost_ruin',tone(im,'#455358','#d2d9d4'),info|{'changes':info['changes']+' Cold northern stone palette.'})
textures={'scene_ground_ash':'textures/terrain/types/dirt_burned.dds','scene_ground_moss':'textures/terrain/types/temperate/forestfloor_003.png','scene_ground_mud':'textures/terrain/types/temperate/mud_01.png','scene_ground_stone':'textures/terrain/types/aegean_anatolia/paving_02.png','scene_ground_frost':'textures/terrain/types/alpine_dirt_snow.dds'}
for name,path in textures.items():
 p=source/path;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists():p.write_bytes(urllib.request.urlopen(base+path,timeout=25).read())
 im=Image.open(p).convert('RGBA').resize((256,144),Image.Resampling.LANCZOS);mask=Image.new('L',im.size);pixels=mask.load()
 # Soft irregular perimeter makes a terrain footprint, not an opaque tile rectangle.
 for y in range(im.height):
  for x in range(im.width):
   dx=(x-127.5)/124;dy=(y-71.5)/68;angle=math.atan2(dy,dx);edge=1+.05*math.sin(angle*5)+.035*math.cos(angle*9)
   r=math.hypot(dx,dy)/edge;pixels[x,y]=round((155 if name=='scene_ground_frost' else 210)*max(0,min(1,(1-r)/.32)))
 im.putalpha(mask)
 save(name,im,dict(author='Wildfire Games',source=f'https://github.com/0ad/0ad/blob/{rev}/binaries/data/mods/public/art/{path}',license='https://creativecommons.org/licenses/by-sa/3.0/',original={'revision':rev,'texture':path,'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest()},changes='Terrain texture resized into a soft irregular transparent footprint; feathered perimeter. Recipe: tools/import-regional-scenery.py.'))
boxes={
 'battlefield_corpse_blue_back':(786,0,944,79),'battlefield_corpse_blue_side':(314,316,473,393),
 'battlefield_corpse_green_back':(628,158,785,237),'battlefield_corpse_green_side':(155,703,312,784),
 'battlefield_corpse_red_back':(474,392,633,470),'battlefield_corpse_red_side':(786,869,945,947),
 'battlefield_corpse_mail_back':(787,156,946,237),'battlefield_corpse_mail_side':(314,553,473,631),
 'battlefield_corpse_levy':(314,863,474,947),'battlefield_corpse_guard':(946,869,1098,947),
 'battlefield_skeleton_curled':(785,394,943,473),'battlefield_bones_scattered':(855,1017,1032,1119),
 'battlefield_loose_sword':(1098,864,1176,942),'battlefield_loose_axe':(1180,948,1254,1106),
 'battlefield_ash_heap':(787,476,946,631),
}
im=Image.open(sheet).convert('RGBA')
for name,box in boxes.items():
 scaled=tuple(round(v*(im.width if i%2==0 else im.height)/1254)for i,v in enumerate(box));tile=im.crop(scaled);tile=tile.crop(tile.getbbox());tile.thumbnail((128,128),Image.Resampling.LANCZOS)
 save(name,tile,dict(sourceType='user-provided',author='User-provided Gemini battlefield sheet',source='Pasted battlefield sheet supplied in chat on 2026-10-04',license='User-provided artwork authorized for this project',original='User-pasted battlefield sheet',preparedSheetSha256=hashlib.sha256(sheet.read_bytes()).hexdigest(),crop=list(scaled),changes='Unused casualty, skeleton, weapon and ash variations cropped from the prepared transparent sheet; downscaled. Bodies remain small world-map details. Recipe: tools/import-regional-scenery.py.'))
(output/'regional-scene-sources.json').write_text(json.dumps({'assets':assets,'note':'0 A.D. derivatives retain CC BY-SA 3.0. User sheet artwork has separate provenance. A/B Windows sheets were unavailable; no artwork is attributed to them.'},indent=2)+'\n')
print('Prepared',len(assets),'regional scenery sprites;',sum(a['bytes'] for a in assets),'bytes')
