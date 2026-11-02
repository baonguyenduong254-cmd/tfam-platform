"""Offline neighbour recovery for independently segmented province polygons.
Requires Shapely 2 + numpy. Classifies coincident/near-coincident boundary pieces
geometrically instead of assuming identical vertex lists on both provinces.
"""
import sys,json,re
import numpy as np
from shapely.geometry import Polygon,MultiPolygon,shape
from shapely import make_valid,points,distance,contains_xy,prepare
from shapely.strtree import STRtree
rows=json.load(open('public/provinces.json'))['features'];geoms=[]
for row in rows:
 polygons=[]
 for part in re.split(r'Z\s*',row['path'],flags=re.I):
  v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',part)))
  if len(v)<6:continue
  poly=make_valid(Polygon([(v[i]/12-25,73-v[i+1]/12)for i in range(0,len(v)-1,2)]))
  if not poly.is_empty:polygons.append(poly)
 # The polygon parts can have holes. Unioning here is only for neighbouring-edge
 # distance queries; ownership hit testing remains on the original geometry.
 from shapely.ops import unary_union
 geoms.append(unary_union(polygons))
array=np.array(geoms,dtype=object);tree=STRtree(array)
from shapely.ops import unary_union
world=json.load(open('public/world.geojson'));land=unary_union([make_valid(shape(f['geometry']))for f in world['features']]);prepare(land)
edges=json.load(open(sys.argv[1]));a=np.array([a for _,a,b in edges],dtype=float)/1200;b=np.array([b for _,a,b in edges],dtype=float)/1200;xy=(a+b)/2;delta=b-a;length=np.maximum(np.sqrt((delta*delta).sum(axis=1)),1e-12);normal=np.stack([-delta[:,1]/length,delta[:,0]/length],axis=1)*.02
# A segment with land on BOTH sides is an interior boundary even when independently
# simplified province paths leave a kilometre-scale gap. Coastlines retain strict matching.
left=xy+normal;right=xy-normal;interior=contains_xy(land,left[:,0],left[:,1])&contains_xy(land,right[:,0],right[:,1]);tolerances=np.where(interior,.08,.005)
mid=points(xy);result=[]
for start in range(0,len(edges),15000):
 stop=min(len(edges),start+15000);pairs=tree.query(mid[start:stop],predicate='dwithin',distance=tolerances[start:stop])
 best={}
 for p,neighbour in zip(pairs[0],pairs[1]):
  i=start+int(p);neighbour=int(neighbour)
  if neighbour==edges[i][0]:continue
  dist=float(distance(mid[i],array[neighbour]))
  if i not in best or dist<best[i][0]:best[i]=(dist,neighbour)
 for i,(_,neighbour)in best.items():result.append([i,neighbour])
json.dump(result,open(sys.argv[2],'w'),separators=(',',':'))
print(json.dumps({'unmatched_segments':len(edges),'recovered_neighbours':len(result),'land_on_both_sides':int(interior.sum())}),flush=True)
