#!/usr/bin/env python3
"""Import every concrete BB named weapon except the deferred handgonne.
Pinned definitions, name pools, inventory icons and worn entity-icon sprites.
Requires Pillow; browser output is self-contained. No ordinary item is altered.
"""
import argparse,base64,concurrent.futures,hashlib,io,json,pathlib,re,struct,urllib.request,math
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[2]
REPO='kovasap/battle-bros-decompiled';COMMIT='e06d68df0915827967f98a05d0c705c1f53df0b7'
parser=argparse.ArgumentParser();parser.add_argument('--cache',default='/tmp/bb-source');args=parser.parse_args();CACHE=pathlib.Path(args.cache)
def fetch(path):
 f=CACHE/path
 if not f.exists():f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(urllib.request.urlopen(f'https://raw.githubusercontent.com/{REPO}/{COMMIT}/{path}',timeout=60).read())
 return f.read_bytes()
def sha(data):return hashlib.sha256(data).hexdigest()
def number(text,key,default=None):
 m=re.search(r'this\.m\.'+key+r'\s*=\s*(-?\d+(?:\.\d+)?)\s*;',text);return float(m[1])if m else default
def string(text,key):
 m=re.search(r'this\.m\.'+key+r'\s*=\s*"((?:\\.|[^"\\])*)"',text);return m[1].replace("\\'","'")if m else None
def expression(text,key,variant):
 m=re.search(r'this\.m\.'+key+r'\s*=\s*([^;]+)',text)
 if not m:raise ValueError('Missing '+key)
 expr=m[1].replace('this.m.Variant',str(variant))
 tokens=re.findall(r'"([^"\n]*)"|\b(\d+)\b',expr)
 return ''.join(a or b for a,b in tokens)
tree=json.loads(fetch('tree.json'));assert not tree.get('truncated');paths=sorted(x['path']for x in tree['tree']if x['path'].startswith('scripts/items/weapons/named/')and x['path'].endswith('.nut'))
excluded=[{'path':p,'reason':'Abstract parent'if p.endswith('/named_weapon.nut')else'Handgonne deferred by user'}for p in paths if p.endswith(('/named_weapon.nut','/named_handgonne.nut'))]
paths=[p for p in paths if not p.endswith(('/named_weapon.nut','/named_handgonne.nut'))];assert len(paths)==46
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:list(pool.map(fetch,paths))
strings=fetch('scripts/config/item_names.nut').decode();brush_data=fetch('brushes/entity_icons.brush');brushes={}
for m in re.finditer(rb'icon_[A-Za-z0-9_]+',brush_data):
 name=m[0].decode();start,end=m.span()
 if start<2 or struct.unpack_from('<H',brush_data,start-2)[0]!=len(name):continue
 source=re.search(rb'icons\\',brush_data[end:end+140])
 if not source:continue
 pos=end+source.start();length=struct.unpack_from('<H',brush_data,pos-2)[0];uv=struct.unpack_from('<8f',brush_data,pos+length)
 if 0<=uv[0]<uv[1]<=1 and 0<=uv[2]<uv[3]<=1:brushes[name]={'uv':uv[:4],'bounds':uv[4:]}
# Retain the source weapon category while using the campaign's established visual families.
visuals={
 'axe':'axe','bardiche':'bardiche','battle-whip':'whip','billhook':'billhook','bladed-pike':'bladed-pike','cleaver':'cleaver','crossbow':'crossbow','crypt-cleaver':'cleaver','dagger':'dagger','fencing-sword':'sword','flail':'flail','goblin-falchion':'sword','goblin-heavy-bow':'bow','goblin-pike':'pike','goblin-spear':'spear','greataxe':'greataxe','greatsword':'greatsword','heavy-rusty-axe':'greataxe','javelin':'javelin','khopesh':'cleaver','longaxe':'longaxe','mace':'mace','orc-axe':'axe','orc-cleaver':'cleaver','pike':'pike','polehammer':'polehammer','polemace':'mace','qatal-dagger':'qatal','rusty-warblade':'cleaver','shamshir':'shamshir','skullhammer':'heavyhammer','spear':'spear','spetum':'spear','sword':'sword','swordlance':'warscythe','three-headed-flail':'flail','throwing-axe':'throwing-axes','two-handed-flail':'flail','two-handed-hammer':'heavyhammer','two-handed-mace':'mace','two-handed-scimitar':'cleaver','two-handed-spiked-mace':'mace','warbow':'bow','warbrand':'greatsword','warhammer':'hammer','warscythe':'warscythe'}
records=[]
for path in paths:
 text=fetch(path).decode();kind=pathlib.PurePosixPath(path).stem.removeprefix('named_').replace('_','-');variant=int((re.search(r'this\.m\.Variant\s*=\s*this\.Math\.rand\((\d+)',text) or re.search(r'this\.m\.Variant\s*=\s*(\d+)',text))[1]);icon='gfx/ui/items/'+expression(text,'IconLarge',variant);sprite=expression(text,'ArmamentIcon',variant)
 if sprite not in brushes:raise ValueError('Missing sprite '+sprite)
 name_key=re.search(r'this\.m\.NameList\s*=\s*this\.Const\.Strings\.(\w+)',text)[1]
 names_match=re.search(r'\b'+name_key+r'\s*(?:<-|=)\s*\[([\s\S]*?)\]',strings)
 if not names_match:raise ValueError('Missing name pool '+name_key)
 names=re.findall(r'"((?:\\.|[^"\\])*)"',names_match[1]);names=[s.replace("\\'","'")for s in names]
 minimum=number(text,'RegularDamage');maximum=number(text,'RegularDamageMax');value=number(text,'Value');ranged='ItemType.RangedWeapon'in text;throwing=kind in ['javelin','throwing-axe'];two='ItemType.TwoHanded'in text or 'BlockedSlotType = this.Const.ItemSlot.Offhand'in text
 # 60% source damage matches the campaign's lower-health combat; preserve source ratios and mechanics.
 stats={'damageMin':round(minimum*.6),'damageMax':round(maximum*.6),'armorDamage':number(text,'ArmorDamageMult',1),'armorPiercing':number(text,'DirectDamageMult',.3),'hitBonus':number(text,'AdditionalAccuracy',0),'fatigue':int(-number(text,'StaminaModifier',0)),'headChance':.22,'fatigueOnSkillUse':0,'shieldDamage':int(number(text,'ShieldDamage',0))}
 source_stats=dict(stats)
 if throwing:stats['ammoMax']=int(number(text,'AmmoMax',5))
 if kind in ['dagger','qatal-dagger']:fatigue_cost=8
 elif throwing:fatigue_cost=12
 elif ranged:fatigue_cost=12
 elif two:fatigue_cost=18
 else:fatigue_cost=12
 region='north'if kind in ['heavy-rusty-axe','rusty-warblade','skullhammer','two-handed-spiked-mace']else'south'if kind in ['battle-whip','khopesh','qatal-dagger','shamshir','swordlance','two-handed-scimitar','warscythe']else None
 culture='ancient'if kind=='crypt-cleaver'else'greenskin'if kind.startswith(('goblin-','orc-'))else region or 'mercenary'
 item={'id':'bb-named-'+kind,'name':'Named '+kind.replace('-',' ').title(),'slot':'weapon','visual':visuals[kind],'trainingVisual':visuals[kind],'rarity':'named','sourceNamedWeapon':True,'sourceCulture':culture,'collection':'named-weapons','price':max(500,round(value*.35)),'power':round((stats['damageMin']+stats['damageMax'])/2),'fatigueCost':fatigue_cost,'skillHitBonus':{'spear':12,'pike':10,'bladed-pike':10,'sword':5,'dagger':12,'qatal':12}.get(visuals[kind],0),'sourceStats':{**stats,'name':'Named '+kind.replace('-',' ').title(),'description':string(text,'Description'),'price':max(500,round(value*.35))},'namePool':names,'sourceKind':'named','description':string(text,'Description'),'role':'A rare '+kind.replace('-',' ')+' with two independently rolled modifiers.','sourceSourceStats':{'damageMin':minimum,'damageMax':maximum,'price':value,**{k:v for k,v in source_stats.items()if k not in ['damageMin','damageMax']}},**stats}
 if region:item['region']=region
 if two:item['twoHanded']=True
 if ranged:item.update(ranged=True,range=3 if throwing else 5)
 elif (number(text,'RangeMax',1)or 1)>1:item['range']=int(number(text,'RangeMax'))
 if throwing:item['throwing']=True
 if kind=='crossbow':item.update(reloadTurns=1,hitBonus=10);item['sourceStats']['hitBonus']=10
 if kind in ['dagger','qatal-dagger']:item['pocketWeapon']=True
 if kind=='fencing-sword':item['fencing']=True
 if kind=='spetum':item['spearwall']=True
 records.append({'item':item,'source':path,'sourceSha256':sha(fetch(path)),'variant':variant,'icon':icon,'sprite':sprite,'skills':re.findall(r'scripts/skills/actives/([^"\)]+)',text)})
needed=sorted({r['icon']for r in records}|{'gfx/entity_icons.png'})
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:list(pool.map(fetch,needed))
atlas=Image.open(io.BytesIO(fetch('gfx/entity_icons.png'))).convert('RGBA');art={};assets=[]
for r in records:
 spec=brushes[r['sprite']];u1,u2,v1,v2=spec['uv'];rect=[round(u1*atlas.width),round(v1*atlas.height),round(u2*atlas.width),round(v2*atlas.height)];worn=atlas.crop(rect).transpose(Image.Transpose.FLIP_TOP_BOTTOM);buf=io.BytesIO();worn.save(buf,format='PNG',compress_level=9);png=buf.getvalue();x1,x2,y1,y2=spec['bounds'];gx=-x1;gy=-y1
 # Source brush coordinates identify the native grip. Find the tip farthest from that grip.
 alpha=worn.getchannel('A');points=[(x,y)for y in range(worn.height)for x in range(worn.width)if alpha.getpixel((x,y))>100];tip=max(points,key=lambda p:math.hypot(p[0]-gx,p[1]-gy))
 uri=lambda data:'data:image/png;base64,'+base64.b64encode(data).decode()
 art[r['item']['id']]={'icon':uri(fetch(r['icon'])),'portrait':uri(png),'width':worn.width,'height':worn.height,'grip':[gx,gy],'tip':list(tip),'twoHanded':r['item'].get('twoHanded',False),'ranged':r['item'].get('ranged',False),'throwing':r['item'].get('throwing',False)}
 assets.append({'id':r['item']['id'],'icon':r['icon'],'iconSha256':sha(fetch(r['icon'])),'atlas':'gfx/entity_icons.png','atlasSha256':sha(fetch('gfx/entity_icons.png')),'brush':r['sprite'],'brushBounds':spec['bounds'],'crop':rect,'portraitSha256':sha(png),'grip':[gx,gy],'tip':list(tip),'transform':'vertical flip from entity atlas texture orientation'})
# Impaler is an explicit named crossbow, never an ordinary armory purchase.
impaler={**next(r['item']for r in records if r['item']['id']=='bb-named-crossbow'),'id':'impaler','name':'Impaler','namePool':['Impaler'],'fixedName':True};impaler['sourceStats']={**impaler['sourceStats'],'name':'Impaler'};art['impaler']=art['bb-named-crossbow']
items=[r['item']for r in records]+[impaler]
(ROOT/'src/named-weapons.js').write_text('// Generated by tools/content/import-bb-named-weapons.py.\nimport { rollNamedItem } from "./named-rolls.js";\nexport const NAMED_WEAPON_DESIGNS = Object.freeze('+json.dumps(items,indent=2)+'.map(i => Object.freeze({...i,sourceStats:Object.freeze(i.sourceStats),sourceSourceStats:Object.freeze(i.sourceSourceStats),namePool:Object.freeze(i.namePool)})));\nexport const NAMED_WEAPONS = Object.freeze(NAMED_WEAPON_DESIGNS.map((i,n) => rollNamedItem(i,i.id,0x42420000+n,{shieldDamage:i.shieldDamage})));\n')
(ROOT/'src/named-weapon-art.js').write_text('// Generated from pinned BB inventory PNGs and entity-icons atlas.\nexport const NAMED_WEAPON_ART = Object.freeze('+json.dumps(art,separators=(',',':'))+');\n')
(ROOT/'assets/named-weapons-source.json').write_text(json.dumps({'repository':REPO,'commit':COMMIT,'imported':len(records),'extraDesign':'Impaler named crossbow','excluded':excluded,'definitions':records,'assets':assets,'namePoolSource':'scripts/config/item_names.nut','namePoolSourceSha256':sha(fetch('scripts/config/item_names.nut')),'brushSource':'brushes/entity_icons.brush','brushSourceSha256':sha(brush_data)},indent=2)+'\n')
print('Imported',len(records),'BB named weapons + Impaler; exact inventory and worn art; handgonne excluded.')
