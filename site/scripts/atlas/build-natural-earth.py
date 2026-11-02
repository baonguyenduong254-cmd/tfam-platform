"""Rebuild locally hosted Natural Earth atlas assets. Inputs cached outside Git.
python scripts/atlas/build-natural-earth.py /tmp
Sources and hashes are retained in public/map-art/natural-earth/sources.json.
"""
import json,math,hashlib,sys,zipfile,re
from pathlib import Path
from PIL import Image,ImageEnhance,ImageOps
import numpy as np
from shapely.geometry import Polygon,mapping,shape
from shapely import make_valid,union_all
cache=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp');out=Path('public/map-art/natural-earth');out.mkdir(parents=True,exist_ok=True)
sources={}
physical={}
def coords_path(g):
 t,c=g['type'],g['coordinates']
 lines=([c] if t=='LineString' else c if t in ['MultiLineString','Polygon'] else [r for p in c for r in p])
 return ''.join('M'+'L'.join(f'{(p[0]+25)*12:.2f},{(73-p[1])*12:.2f}' for p in line)+('Z' if 'Polygon' in t else '') for line in lines)
for name in ['land','coastline','lakes','rivers_lake_centerlines']:
 path=cache/('ne-'+name+'.geojson');data=json.loads(path.read_text());fs=data['features']
 # Round to 5 decimals (~1m) without simplifying geometry or deleting islands.
 def rounding(v):
  if isinstance(v,(list,tuple)):return [rounding(x) for x in v]
  return round(v,5) if isinstance(v,float) else v
 compact={'type':'FeatureCollection','features':[{'type':'Feature','properties':{k:f['properties'][k] for k in ['scalerank','name','featurecla','min_zoom'] if k in f['properties']},'geometry':{'type':f['geometry']['type'],'coordinates':rounding(f['geometry']['coordinates'])}} for f in fs]}
 (out/(name+'.geojson')).write_text(json.dumps(compact,separators=(',',':')))
 physical[name]=coords_path({'type':'MultiLineString','coordinates':[]}) if not fs else ''.join(coords_path(mapping(shape(f['geometry']).simplify(.015,preserve_topology=True))) for f in fs if name!='rivers_lake_centerlines' or f['properties'].get('scalerank',9)<=5)
 sources[name]={'url':f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_{name}.geojson','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'features':len(fs),'scale':'1:10,000,000'}
(out/'physical-svg.json').write_text(json.dumps(physical,separators=(',',':')))
archive=cache/'ne-terrain.zip'
with zipfile.ZipFile(archive) as z:
 name=next(x for x in z.namelist() if x.lower().endswith('.tif'));z.extract(name,cache);im=Image.open(cache/name).convert('RGB')
print('terrain',im.size,flush=True)
im=ImageEnhance.Color(im).enhance(.38);im=ImageEnhance.Contrast(im).enhance(.9)
# Cool parchment highlights retain relief, without fictional geography.
im=Image.blend(im,Image.new('RGB',im.size,'#234154'),.24)
im.resize((5400,2700),Image.Resampling.LANCZOS).save(out/'terrain-equirectangular.webp',quality=88)
w,h=im.size
for zoom in range(6):
 n=2**zoom;size=n*256
 x=(np.arange(size)+.5)/size*w-.5
 # Correct inverse Web Mercator: latitude=atan(sinh(...)); equirectangular row=(90-lat)/180.
 y=(.5-np.arctan(np.sinh(math.pi*(1-2*(np.arange(size)+.5)/size)))/math.pi)*h-.5
 src=np.asarray(im)
 for tx in range(n):
  folder=out/'tiles'/str(zoom)/str(tx);folder.mkdir(parents=True,exist_ok=True)
  xx=x[tx*256:(tx+1)*256];x0=np.floor(xx).astype(int).clip(0,w-2);fx=(xx-x0)[None,:,None]
  for ty in range(n):
   yy=y[ty*256:(ty+1)*256];y0=np.floor(yy).astype(int).clip(0,h-2);fy=(yy-y0)[:,None,None]
   a=src[y0[:,None],x0[None,:]].astype(float);b=src[y0[:,None],x0[None,:]+1];c=src[y0[:,None]+1,x0[None,:]];d=src[y0[:,None]+1,x0[None,:]+1]
   tile=((a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy).clip(0,255).astype('uint8')
   Image.fromarray(tile).save(folder/(str(ty)+'.webp'),quality=85)
 print('zoom',zoom,flush=True)
sources['terrain']={'url':'https://naciscdn.org/naturalearth/50m/raster/NE2_50M_SR_W.zip','sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'source_dimensions':[w,h],'scale':'1:50,000,000','projection':'EPSG:3857 XYZ tiles, z0–5; equirectangular fallback'}
(out/'sources.json').write_text(json.dumps({'license':'Public Domain','terms':'https://www.naturalearthdata.com/about/terms-of-use/','sources':sources},indent=2))
seed=json.loads(Path('lib/seed.json').read_text());provinces=json.loads(Path('public/provinces.json').read_text())['features']
for year in ['1715','1716']:
 owners=seed['territories'][year];groups={f['id']:[] for f in seed['factions']}
 for p in provinces:
  owner=owners.get(p['id']);polys=[];rings=[]
  if owner not in groups:continue
  for part in re.split('Z',p['path'],flags=re.I):
   vals=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',part)]
   ring=[(vals[i]/12-25,73-vals[i+1]/12) for i in range(0,len(vals)-1,2)]
   if len(ring)>=3:rings.append(ring)
  # Recover outer orientation and its holes, as in the existing provinceGeometry.
  area=lambda r:sum(r[i-1][0]*v[1]-v[0]*r[i-1][1] for i,v in enumerate(r))
  sign=1 if rings and area(rings[0])>0 else -1
  for r in rings:
   if not polys or area(r)*sign>0:polys.append([r,[]])
   else:polys[-1][1].append(r)
  groups[owner].extend(make_valid(Polygon(r,holes)) for r,holes in polys)
 features=[]
 for f in seed['factions']:
  if not groups[f['id']]:continue
  g=make_valid(union_all(groups[f['id']]))
  g=make_valid(shape({'type':g.geom_type,'coordinates':rounding(mapping(g)['coordinates'])}))
  def polygons(geo):
   if geo.geom_type=='Polygon':return [geo]
   return [p for part in getattr(geo,'geoms',[]) for p in polygons(part)]
  g=union_all(polygons(g))
  features.append({'type':'Feature','id':f['id'],'properties':{'id':f['id'],'owner':f['id'],'name':f['name_vi'],'year':year,'color':f['ui_color_primary']},'geometry':mapping(g)})
 result={'type':'FeatureCollection','year':year,'ownership':owners,'features':features,'note':'TFAM canon ownership dissolved across Natural Earth province geometry; no historical-border dataset substituted.'}
 (out/('tfam_'+year+'.geojson')).write_text(json.dumps(result,separators=(',',':')));print(year,len(features),flush=True)
