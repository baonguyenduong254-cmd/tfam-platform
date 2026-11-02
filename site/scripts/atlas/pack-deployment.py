"""Keep full source vectors in data/; ship lossless delta-compressed coordinate assets."""
from pathlib import Path
import json,gzip,shutil
from PIL import Image
root=Path('public/map-art/natural-earth');raw=Path('data/atlas/natural-earth');raw.mkdir(parents=True,exist_ok=True)
def delta(v):
 if v and isinstance(v[0],(int,float)):
  raise ValueError('Unexpected point')
 if v and v[0] and isinstance(v[0][0],(int,float)):
  out=[];px=py=0
  for x,y,*rest in v:
   a,b=round(x*100000),round(y*100000);out.extend([a-px,b-py]);px,py=a,b
  return out
 return [delta(x) for x in v]
for name in ['land','coastline','lakes','rivers_lake_centerlines','tfam_1715','tfam_1716']:
 p=root/(name+'.geojson');q=raw/p.name
 if p.exists():shutil.move(p,q)
 x=json.loads(q.read_text());x['encoding']='tfam-delta-1e5'
 if not name.startswith('tfam_'):
  for f in x['features']:f['geometry']['coordinates']=delta(f['geometry']['coordinates'])
 else:x.pop('encoding',None)
 if name!='coastline':
  target=root/(name+'.json.gz');target.write_bytes(gzip.compress(json.dumps(x,separators=(',',':')).encode(),compresslevel=9,mtime=0));print(name,target.stat().st_size)
p=root/'physical-svg.json';q=raw/p.name
if p.exists():shutil.move(p,q)
(root/'physical-svg.json.gz').write_bytes(gzip.compress(q.read_bytes(),compresslevel=9,mtime=0))
# Re-encode only new cartographic terrain tiles; original story illustrations stay untouched.
for p in (root/'tiles').glob('*/*/*.webp'):
 im=Image.open(p);im.save(p,quality=76,method=6)
print('Public atlas bytes',sum(p.stat().st_size for p in root.rglob('*') if p.is_file()))

p=root/'terrain-equirectangular.webp';Image.open(p).save(p,quality=78,method=6)
