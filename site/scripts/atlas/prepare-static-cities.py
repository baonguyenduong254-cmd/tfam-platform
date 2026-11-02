from pathlib import Path
import json,re,unicodedata
r=Path(__file__).resolve().parents[2];seed=json.load(open(r/'lib/seed.json'))
# Existing atlas references and real named province cities, never placeholder towns.
text=(r/'lib/atlas-cities.ts').read_text();rows=[]
for m in re.finditer(r"\['([^']+)','([^']+)','([^']+)',(-?[\d.]+),(-?[\d.]+),'[^']+',(\d)",text):
 id,vi,en,x,y,p=m.groups();rows.append(dict(id=id,name_vi=vi,name_en=en,coordinates=[float(x),float(y)],priority=int(p)))
for c in json.load(open(r/'public/cities.json'))['cities']:
 if c['placeholder']:continue
 if any(sum((c['coordinates'][i]-a['coordinates'][i])**2 for i in [0,1])<.025 for a in rows):continue
 rows.append(dict(id=c['id'],province_id=c['id'],name_vi=c['name'],name_en=c['name'],coordinates=c['coordinates'],priority=2))
# Names/coordinates supplement the existing atlas, not additional TFAM narrative claims.
extra=[('barcelona','Barcelona',2.17,41.39),('valencia','Valencia',-.38,39.47),('seville','Sevilla',-5.98,37.39),('agadir','Agadir',-9.60,30.42),('fez','Fès',-5.00,34.04),('krakow','Kraków',19.945,50.064),('bursa','Bursa',29.061,40.195),('calcutta','Calcutta',88.363,22.573),('zanzibar','Zanzibar',39.20,-6.16),('hue','Phú Xuân',107.59,16.46),('hoi-an','Hội An',108.33,15.88),('guangzhou','Quảng Châu',113.26,23.13),('osaka','Osaka',135.50,34.69),('surabaya','Surabaya',112.75,-7.25),('batavia','Batavia',106.85,-6.21),('tabriz','Tabriz',46.29,38.08),('shir az','Shiraz',52.53,29.59),('djenne','Djenné',-4.56,13.91),('aksum','Aksum',38.72,14.12),('massawa','Massawa',39.45,15.61),('luanda','Luanda',13.23,-8.84),('loango','Loango',11.81,-4.65),('kilwa','Kilwa',39.52,-8.96),('stellenbosch','Stellenbosch',18.86,-33.93),('swellendam','Swellendam',20.44,-34.02),('toamasina','Toamasina',49.40,-18.15),('mahajanga','Mahajanga',46.32,-15.72),('urga','Urga',106.92,47.92),('ulan-ude','Udinsk',107.59,51.83)]
aliases={}
for id,name,x,y in extra:
 near=next((a for a in rows if sum(([x,y][i]-a['coordinates'][i])**2 for i in [0,1])<.025),None)
 if near:
  aliases[id]=near['id'];continue
 rows.append(dict(id=id.replace(' ',''),name_vi=name,name_en=name,coordinates=[x,y],priority=2))
def ring_contains(pt,ring):
 x,y=pt;inside=False
 for a,b in zip(ring,ring[1:]+ring[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
 return inside

def contains(point,geo):
 polys=[geo['coordinates']] if geo['type']=='Polygon' else geo['coordinates']
 return any(ring_contains(point,p[0]) and not any(ring_contains(point,h) for h in p[1:]) for p in polys)
for year in ['1715','1716']:
 fs=json.load(open(r/f'data/atlas/natural-earth/tfam_{year}.geojson'))['features']
 for c in rows:
  owner=next((f['properties']['owner'] for f in fs if contains(c['coordinates'],f['geometry'])),'')
  if c.get('province_id'):owner=seed['territories'][year].get(c['province_id'],owner)
  c.setdefault('owners',{})[year]=owner
capitals={'castilian_empire':'madrid','holy_french_kingdom':'paris','western_roman_empire':'IT.ER','sultanate_of_morocco':'marrakech','habsburg_poland':'krakow','novgorod_union':'novgorod','ottoman_empire':'bursa','danes_kingdom':'copenhagen','scotland_ireland_union':'edinburgh','england_ruins':'london','new_portuguese_empire':'rio','british_east_india_company':'calcutta','annam_empire':'hanoi','ming_celestial_empire':'beijing','nusantara_sultanate':'makassar','tokugawa_empire':'edo','eternal_sky_khanate':'karakorum','safavid_empire':'isfahan','aksumite_empire':'gondar','songhai_empire':'timbuktu','kongo_confederation':'kongo','swahili_league':'zanzibar','cape_republic':'cape','merina_empire':'antananarivo'}
# Ravenna comes from the existing named province city.
rv=next(c for c in rows if c['name_en']=='Ravenna');capitals['western_roman_empire']=rv['id']
capitals={k:aliases.get(v,v) for k,v in capitals.items()}
for c in rows:
 fallback={'copenhagen':'danes_kingdom','mombasa':'swahili_league','kilwa':'swahili_league','zanzibar':'swahili_league','massawa':'aksumite_empire','mahajanga':'merina_empire'}.get(c['id'])
 if fallback:
  for year in ['1715','1716']:
   if not c['owners'][year]:c['owners'][year]=fallback
(r/'lib/static-atlas-cities.json').write_text(json.dumps({'cities':rows,'capitals':capitals},ensure_ascii=False,indent=2)+'\n')
print('Cities',len(rows))
for f in seed['factions']:
 print(f['id'],sum(c['owners']['1715']==f['id'] for c in rows))
