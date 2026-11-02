"""Bake frozen 2D atlas tiles from real Mapzen Terrarium heights.
Run after populating --dem-cache with the 1024 z5 Terrarium PNGs (x-y.png).
No DEM sampling, lighting calculations or hill meshes run in the browser.
"""
from pathlib import Path
from PIL import Image,ImageDraw
from scipy.ndimage import gaussian_filter
import numpy as np
import argparse,json,hashlib
parser=argparse.ArgumentParser();parser.add_argument('--dem-cache',required=True);parser.add_argument('--output',default='public/map-art/frozen-relief-v1');args=parser.parse_args()
N=8192;root=Path(args.dem_cache);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
h=np.empty((N,N),np.float32)
for y in range(32):
 for x in range(32):
  with Image.open(root/f'{x}-{y}.png') as im:a=np.asarray(im.convert('RGB'),dtype=np.float32)
  h[y*256:(y+1)*256,x*256:(x+1)*256]=a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
print('Decoded global elevation',flush=True)
# Separate land and sea using the exact same world geometry used by the atlas.
mask=Image.new('L',(N,N));draw=ImageDraw.Draw(mask)
def project(p):
 lon,lat=p;lat=np.clip(lat,-85.05112878,85.05112878)
 return ((lon+180)/360*N,(1-np.arcsinh(np.tan(np.radians(lat)))/np.pi)/2*N)
world=json.load(open('public/world.geojson'))
for feature in world['features']:
 g=feature['geometry'];polygons=[g['coordinates']]if g['type']=='Polygon'else g['coordinates']
 for polygon in polygons:
  for i,ring in enumerate(polygon):draw.polygon([project(p)for p in ring],fill=255 if i==0 else 0)
land=np.asarray(mask)>0
lat=np.degrees(np.arctan(np.sinh(np.pi*(1-2*(np.arange(N,dtype=np.float32)+.5)/N))))
latitude=np.abs(lat[:,None]);meters=(40075016.686/N)*np.maximum(.085,np.cos(np.radians(lat)))[:,None]
# Gradients are computed across the entire mosaic to avoid tile lighting seams.
smooth=gaussian_filter(h,.55);dy,dx=np.gradient(smooth);dx=dx/meters*5.5;dy=dy/meters*5.5
norm=np.sqrt(1+dx*dx+dy*dy)
shade=np.clip((.56*dx+.56*dy+.61)/norm,0,1)
# Soft ambient occlusion emphasizes real valleys without invented mountains.
local=gaussian_filter(h,4);valley=np.clip((local-h)/1700,0,.2)
light=np.clip(.72+shade*.42-valley,.48,1.12)
del dx,dy,norm,smooth,local,shade
stops=np.array([0,180,600,1200,2000,3000,4300,6500],dtype=np.float32)
colors=np.array([[157,169,156],[165,176,158],[157,165,144],[155,157,139],[165,166,151],[186,192,183],[223,231,224],[239,245,236]],dtype=np.float32)
rgb=np.empty((N,N,3),np.float32)
for channel in range(3):rgb[:,:,channel]=np.interp(np.maximum(h,0),stops,colors[:,channel])
# The frozen climate treatment is an art direction, independent of ownership/year.
snow=np.clip((latitude-38)/23,0,.82)+np.clip((h-1200)/4500,0,.6);snow=np.clip(snow,0,.93)
# Subtropical plains keep pale weathered ochre, with snow collecting in high ranges.
arid=np.exp(-((latitude-26)/10)**2)*np.clip(1-h/2200,0,1)*.32
for c,target in enumerate([186,174,145]):rgb[:,:,c]=rgb[:,:,c]*(1-arid)+target*arid
for c,target in enumerate([218,229,222]):rgb[:,:,c]=(rgb[:,:,c]*(1-snow)+target*snow)*light
# Deterministic subtle pigment grain; not a repeating decorative stamp.
rng=np.random.default_rng(1715);grain=rng.normal(0,.65,(N,N)).astype(np.float32)
rgb+=grain[:,:,None]
# Bathymetry retains the real seabed but stays subdued beneath the land.
depth=np.clip(-h/7000,0,1);shelf=np.exp(-np.maximum(-h,0)/650)
for c,(base,deep) in enumerate(zip([33,63,78],[14,36,52])):
 sea=base*(1-depth)+deep*depth+shelf*[7,10,9][c]
 rgb[:,:,c]=np.where(land,rgb[:,:,c],sea)
del grain,depth,shelf,snow,arid,light,h
pixels=np.clip(rgb,0,255).astype('uint8');del rgb
image=Image.fromarray(pixels);del pixels
image.resize((2048,2048),Image.Resampling.LANCZOS).save(out/'overview.webp',quality=88)
count=0
for z in range(6):
 size=256*(2**z);level=image if size==N else image.resize((size,size),Image.Resampling.LANCZOS)
 for y in range(2**z):
  for x in range(2**z):
   p=out/str(z)/str(x);p.mkdir(parents=True,exist_ok=True)
   level.crop((x*256,y*256,(x+1)*256,(y+1)*256)).save(p/f'{y}.webp',quality=86,method=5);count+=1
 print('Baked zoom',z,flush=True)
manifest={'version':1,'source':'Mapzen/Tilezen Terrain Tiles, AWS Open Data, Terrarium z5','source_url':'https://registry.opendata.aws/terrain-tiles/','source_template':'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/5/{x}/{y}.png','encoding':'height = R*256 + G + B/256 - 32768 metres','projection':'EPSG:3857','tileSize':256,'minzoom':0,'maxzoom':5,'tiles':count,'world_pixels':N,'bytes':sum(p.stat().st_size for p in out.rglob('*.webp')),'processing':'Northwest relief lighting and ambient valleys baked offline; latitude/elevation-driven frozen pigment palette; no invented or generative geography','attribution':'See /legal#terrain and https://github.com/tilezen/joerd/blob/master/docs/attribution.md'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest),flush=True)
