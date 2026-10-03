#!/usr/bin/env python3
"""Extract pinned Battle Brothers camp sprites and terrain socket. Requires Pillow."""
import pathlib,urllib.request,struct,re,io,json,hashlib,argparse
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[2];parser=argparse.ArgumentParser();parser.add_argument('--cache',default='/tmp/bb-source');args=parser.parse_args();cache=pathlib.Path(args.cache);pin='e06d68df0915827967f98a05d0c705c1f53df0b7';records=[]
def fetch(p):
 f=cache/p;f.parent.mkdir(parents=True,exist_ok=True)
 if not f.exists():f.write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/kovasap/battle-bros-decompiled/'+pin+'/'+p,timeout=40).read())
 return f.read_bytes()
for brush,atlas,names in [('object_1','object_1',['camp_18_0'+str(n)for n in range(1,8)]),('terrain','terrain',['socket_earth'])]:
 b=fetch('brushes/'+brush+'.brush');img=Image.open(io.BytesIO(fetch('gfx/'+atlas+'.png'))).convert('RGBA')
 for name in names:
  start=b.index(name.encode());end=start+len(name);assert struct.unpack_from('<H',b,start-2)[0]==len(name)
  pattern=rb'combat_objects\\'if brush=='object_1'else rb'terrain\\';m=re.search(pattern,b[end:end+200]);pos=end+m.start();length=struct.unpack_from('<H',b,pos-2)[0];uv=struct.unpack_from('<8f',b,pos+length);u1,u2,v1,v2=uv[:4];rect=[round(u1*img.width),round(v1*img.height),round(u2*img.width),round(v2*img.height)];crop=img.crop(rect).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
  file='camp-wall-'+name[-2:]+'.png'if brush=='object_1'else'socket-earth.png';out=root/'assets/battle'/file;crop.save(out,compress_level=9)
  records.append({'file':file,'brush':name,'brushFile':'brushes/'+brush+'.brush','atlas':'gfx/'+atlas+'.png','crop':rect,'bounds':list(uv[4:]),'size':[crop.width,crop.height],'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
(root/'assets/battle/camp-source.json').write_text(json.dumps({'repository':'kovasap/battle-bros-decompiled','commit':pin,'assets':records},indent=2)+'\n');print('Imported 7 palisade sprites and earth socket',flush=True)
