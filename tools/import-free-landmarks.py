"""Import licensed landmark art. Download/render sources first; see the output manifest.
Usage: python tools/import-free-landmarks.py /tmp/free-map-art
Cropping, atlas assembly and palette adaptation only; no generated geometry.
"""
from PIL import Image, ImageEnhance, ImageOps
from pathlib import Path
import hashlib, json, sys, urllib.request
root=Path(__file__).resolve().parents[1]; source=Path(sys.argv[1]); output=root/'assets/world'
manifest=[]
CC0='https://creativecommons.org/publicdomain/zero/1.0/'
SA='https://creativecommons.org/licenses/by-sa/3.0/'
BY='https://creativecommons.org/licenses/by/3.0/'
def save(name,im,author,page,license,original,changes):
    im=im.convert('RGBA');im=im.crop(im.getbbox());im.thumbnail((320,320),Image.Resampling.LANCZOS)
    path=output/(name+'.png');im.save(path,optimize=True)
    manifest.append(dict(file=str(path.relative_to(root)),author=author,source=page,license=license,original=original,changes=changes,width=im.width,height=im.height,bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
def tone(im,mode):
    a=im.getchannel('A');rgb=im.convert('RGB')
    if mode=='snow':rgb=ImageEnhance.Color(rgb).enhance(.15);rgb=ImageEnhance.Brightness(rgb).enhance(1.02);rgb=ImageEnhance.Contrast(rgb).enhance(.88)
    else:
        rgb=ImageOps.colorize(ImageOps.grayscale(rgb),'#473b2b','#d2bd8d')
    rgb.putalpha(a);return rgb
ruinurl='https://opengameart.org/content/dark-ruins-tilesets-isometric'
for name,n in [('landmark_temple',1),('landmark_ruin_arch',6),('landmark_ruin_wall',18),('landmark_rubble',11)]:
    im=Image.open(source/'dark-ruins'/f'{n:02}.png')
    save(name,im,'Cethiel',ruinurl,CC0,f'Isometric - Dark Ruins.zip/{n:02}.png','Trimmed transparent padding; downscaled.')
    if n in [1,6,18]:save(name+'_sand',tone(im,'sand'),'Cethiel',ruinurl,CC0,f'Isometric - Dark Ruins.zip/{n:02}.png','Trimmed, downscaled; sandstone palette adaptation.')
url='https://opengameart.org/sites/default/files/broken_tower_background.png'
p=source/'broken-tower_background.png'
if not p.exists():urllib.request.urlretrieve(url,p)
save('landmark_tower',Image.open(p),'Clint Bellanger','https://opengameart.org/content/broken-tower',BY,url,'Trimmed transparent padding; downscaled.')
for kind,boxes,page,original in [
 ('green',[(29,19,281,254),(322,19,562,230),(609,7,967,241),(18,283,463,498)],'isometric-mountains-render-2d','Isometric Mountains Render VideoGame 2d.png'),
 ('desert',[(32,22,336,252),(377,23,617,235),(654,9,981,265),(364,273,731,516)],'iso-mountains-monta%C3%B1as-isom%C3%A9tricas','Montañas isométricas 2D.png')]:
    atlas=Image.open(source/('mountain-'+kind+'.png'))
    for n,box in enumerate(boxes,1):
        im=atlas.crop(box);save(f'landmark_mountain_{kind}_{n}',im,'David Garay Salazar / Nirdia Entertainment','https://opengameart.org/content/'+page,SA,original,f'Extracted sprite at {list(box)}; trimmed padding.')
        if kind=='green':save(f'landmark_mountain_snow_{n}',tone(im,'snow'),'David Garay Salazar / Nirdia Entertainment','https://opengameart.org/content/'+page,SA,original,f'Extracted sprite at {list(box)}; desaturated and brightened for northern terrain.')
for kind,file,box,page,original in [
 ('forest','mountain-green',(321,536,563,739),'isometric-mountains-render-2d','Isometric Mountains Render VideoGame 2d.png'),
 ('mountain','mountain-green',(321,536,563,739),'isometric-mountains-render-2d','Isometric Mountains Render VideoGame 2d.png'),
 ('desert','mountain-desert',(364,273,731,516),'iso-mountains-monta%C3%B1as-isom%C3%A9tricas','Montañas isométricas 2D.png')]:
    im=Image.open(source/(file+'.png')).crop(box)
    if kind=='mountain':im=tone(im,'snow')
    save('landmark_cave_'+kind,im,'David Garay Salazar / Nirdia Entertainment','https://opengameart.org/content/'+page,SA,original,f'Extracted natural rock opening at {list(box)}; trimmed padding.'+(' Desaturated and brightened for northern terrain.' if kind=='mountain' else ''))
rev='61a3b9507d974084e6badb88a0826bd89a6d5b8b'
for name,mesh,texture in [('landmark_pyramid','meshes/props/pyramid_a.dae','textures/skins/props/pyramid_great.dds'),('landmark_sphinx','meshes/structural/ptol_statue_sphynx.dae','textures/skins/structural/ptol_statues_sphynx.png')]:
    save(name,tone(Image.open(source/(name+'.png')),'sand') if name=='landmark_sphinx' else Image.open(source/(name+'.png')),'Wildfire Games','https://github.com/0ad/0ad/tree/'+rev+'/binaries/data/mods/public/art',SA,{'revision':rev,'mesh':mesh,'texture':texture},'Transparent isometric Blender render; normalized source units and trimmed padding; sphinx adapted to weathered sandstone palette. Recipe: tools/render-free-monuments.py.')
(output/'landmark-sources.json').write_text(json.dumps({'assets':manifest,'note':'CC BY-SA derivatives retain CC BY-SA 3.0; these asset licenses do not change the game code license.'},indent=2)+'\n')
print('Imported',len(manifest),'licensed sprites;',sum(a['bytes'] for a in manifest),'bytes')
