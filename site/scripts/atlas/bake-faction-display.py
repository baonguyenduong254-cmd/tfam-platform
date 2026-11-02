"""Bake current editorial ownership into national polygons; no province layer at runtime."""
import json,re,gzip
from pathlib import Path
from shapely.geometry import shape,mapping,Polygon,MultiPolygon
from shapely.ops import unary_union
seed=json.loads(Path('lib/seed.json').read_text())
snapshots=json.loads(Path('lib/map-ownership-snapshot.json').read_text())
provinces={p['id']:p for p in json.loads(Path('public/provinces.json').read_text())['features']}
def geometry(province):
 rings=[]
 for part in re.split(r'Z\s*',province['path'],flags=re.I):
  values=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',part)))
  if len(values)<6:continue
  ring=[(values[i]/12-25,73-values[i+1]/12) for i in range(0,len(values)-1,2)]
  if ring[0]!=ring[-1]:ring.append(ring[0])
  rings.append(ring)
 def area(r):return sum(r[i-1][0]*p[1]-p[0]*r[i-1][1] for i,p in enumerate(r) if i)
 outer=area(rings[0])>=0;polygons=[]
 for ring in rings:
  if not polygons or (area(ring)>=0)==outer:polygons.append([ring])
  else:polygons[-1].append(ring)
 return unary_union([Polygon(p[0],p[1:]).buffer(0) for p in polygons])
for year,owners in snapshots.items():
 collection=json.loads(Path(f'data/atlas/natural-earth/tfam_{year}.geojson').read_text())
 geos={f['properties']['owner']:shape(f['geometry']).buffer(0) for f in collection['features']}
 baseline=seed['territories'][year]
 for identifier in baseline.keys()|owners.keys():
  old,new=baseline.get(identifier),owners.get(identifier)
  if old==new or identifier not in provinces:continue
  polygon=geometry(provinces[identifier])
  if old in geos:geos[old]=geos[old].difference(polygon)
  if new:geos[new]=unary_union([geos[new],polygon]) if new in geos else polygon
 for feature in collection['features']:
  g=geos[feature['properties']['owner']]
  if g.geom_type=='GeometryCollection':g=unary_union([p for p in g.geoms if p.geom_type in ('Polygon','MultiPolygon')])
  feature['geometry']=mapping(g)
 out=Path(f'public/map-art/faction-display/tfam_{year}.json.gz');out.parent.mkdir(parents=True,exist_ok=True)
 with gzip.open(out,'wt',encoding='utf8',compresslevel=9) as f:json.dump(collection,f,separators=(',',':'),ensure_ascii=False)
 print(year,len(collection['features']),'national polygons baked')
