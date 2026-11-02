"""Bake the generated world painting into a complete Mercator WebP pyramid.
No lighting, generation or terrain meshes run on the visitor's device.
The painting uses the exact crop of the z5 relief overview as its reference.
"""
from PIL import Image
from pathlib import Path
import math,json
root=Path('art/retired-atlas-v115/painted-world-v1');root.mkdir(parents=True,exist_ok=True)
# Geographic reference is a Mercator crop with these exact integer-pixel rows.
def my(lat):return (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2
base=Image.open('public/map-art/frozen-relief-v1/overview.webp').convert('RGB').resize((4096,4096),Image.Resampling.LANCZOS)
a,b=round(my(83)*2048)*2,round(my(-60)*2048)*2
painting=Image.open('art/world-painted-v1/terrain-painting.png').convert('RGB')
base.paste(painting.resize((4096,b-a),Image.Resampling.LANCZOS),(0,a))
base.resize((2048,2048),Image.Resampling.LANCZOS).save(root/'overview.webp',quality=90)
count=0
for z in range(6):
 n=2**z;level=base.resize((n*256,n*256),Image.Resampling.LANCZOS)
 for x in range(n):
  p=root/str(z)/str(x);p.mkdir(parents=True,exist_ok=True)
  for y in range(n):
   level.crop((x*256,y*256,(x+1)*256,(y+1)*256)).save(p/f'{y}.webp',quality=88,method=5);count+=1
manifest={'version':1,'tiles':count,'minzoom':0,'maxzoom':5,'tileSize':256,'projection':'EPSG:3857','painting_reference_rows_2048':[a//2,b//2],'bytes':sum(p.stat().st_size for p in root.rglob('*.webp')),'art':'Built-in Imagegen, world geography reference from Mapzen/Tilezen; illustrative relief and forests','source_art':'art/world-painted-v1/terrain-painting.png','runtime_cities':False,'tactical_mode':False}
json.dump(manifest,open(root/'manifest.json','w'),indent=2);print(json.dumps(manifest))
