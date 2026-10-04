"""Crop the user's 3wfjv23wfjv23wfj ruins sheet after transparent background preparation.
Usage: python tools/import-user-ruins.py PREPARED_SHEET
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,sys
from collections import deque
root=Path(__file__).resolve().parents[1];sheet=Path(sys.argv[1]);im=Image.open(sheet).convert('RGBA')
boxes={'manor':(315,62,580,325),'clocktower':(640,62,840,315),'cathedral':(851,0,1289,500),'chapel':(294,318,570,589),'windmill':(573,298,792,537),'house':(302,607,542,842),'fortress':(576,449,1094,941),'townhall':(1100,523,1371,791)}
assets=[]
for name,box in boxes.items():
 scaled=tuple(round(v*(im.width if i%2==0 else im.height)/(1672 if i%2==0 else 941))for i,v in enumerate(box));tile=im.crop(scaled)
 # A few atlas neighbours overlap rectangular crop envelopes. Remove only
 # those corner fragments; keep the actual architecture and its loose rubble.
 mask=Image.new('L',tile.size,255);d=ImageDraw.Draw(mask)
 if name=='fortress':d.rectangle((0,0,round(178*im.width/1672),round(79*im.height/941)),fill=0)
 if name=='cathedral':d.polygon([(0,round(440*im.height/941)),(round(75*im.width/1672),round(500*im.height/941)),(0,round(500*im.height/941))],fill=0)
 if name=='windmill':d.rectangle((round(30*im.width/1672),round(232*im.height/941),tile.width,tile.height),fill=0)
 from PIL import ImageChops
 tile.putalpha(ImageChops.multiply(tile.getchannel('A'),mask));tile=tile.crop(tile.getbbox());tile.thumbnail((224,224),Image.Resampling.LANCZOS)
 # Disconnected fragments from adjacent atlas buildings are not part of this tile.
 alpha=tile.getchannel('A');px=alpha.load();seen=set();components=[]
 for yy in range(tile.height):
  for xx in range(tile.width):
   if (xx,yy)in seen or px[xx,yy]<24:continue
   queue=deque([(xx,yy)]);seen.add((xx,yy));part=[]
   while queue:
    x,y=queue.popleft();part.append((x,y))
    for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
     if 0<=nx<tile.width and 0<=ny<tile.height and (nx,ny)not in seen and px[nx,ny]>=24:seen.add((nx,ny));queue.append((nx,ny))
   components.append(part)
 main=max(components,key=len);bottom=max(y for x,y in main);keep=set(main)
 for part in components:
  if 5<=len(part)<=180 and min(y for x,y in part)>=bottom-18:keep.update(part)
 clean=Image.new('L',tile.size);cp=clean.load()
 for x,y in keep:cp[x,y]=px[x,y]
 tile.putalpha(clean);tile=tile.crop(tile.getbbox())
 p=root/'assets/world'/('user_ruin_'+name+'.png');tile.save(p,optimize=True)
 assets.append(dict(file=str(p.relative_to(root)),sourceType='user-provided',author='User-provided Gemini ruins sheet',source='Gemini_Generated_Image_3wfjv23wfjv23wfj.jpg attached in chat',license='User-provided artwork authorized for this project',original='Gemini_Generated_Image_3wfjv23wfjv23wfj.jpg',preparedSheetSha256=hashlib.sha256(sheet.read_bytes()).hexdigest(),crop=list(scaled),changes='Gray background removed through image editing; cropped to individual building bounds, neighbouring corner fragments masked, downscaled to at most 224px. Recipe: tools/import-user-ruins.py.',width=tile.width,height=tile.height,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
(root/'assets/world/user-ruin-sources.json').write_text(json.dumps({'assets':assets},indent=2)+'\n');print('Imported',len(assets),'ruin types')
