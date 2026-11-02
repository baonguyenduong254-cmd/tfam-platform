"""Bake regional Natural Earth paintings; no browser GIS or tile engine required."""
from pathlib import Path
import json, gzip, re, math, io, os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

root=Path(__file__).resolve().parents[2]
text=(root/'lib/map-regions.ts').read_text()
regions={m[0]:{'id':m[0],'vi':m[1],'en':m[2],'bounds':json.loads('['+m[3]+']')} for m in re.findall(r"\w+:\{id:'([^']+)',vi:'([^']+)',en:'([^']+)',bounds:\[([^]]+)\]",text)}
out=root/'public/atlas-static';out.mkdir(exist_ok=True)
terrain=Image.open(root/'public/map-art/natural-earth/terrain-equirectangular.webp').convert('RGB')
terrain=ImageEnhance.Color(terrain).enhance(.82)

def simplify(points,epsilon=.16):
    if len(points)<4:return points
    a,b=points[0],points[-1];dx,dy=b[0]-a[0],b[1]-a[1];den=dx*dx+dy*dy
    best,index=0,0
    for i,p in enumerate(points[1:-1],1):
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
        d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
        if d>best:best,index=d,i
    if best>epsilon*epsilon:return simplify(points[:index+1],epsilon)[:-1]+simplify(points[index:],epsilon)
    return [a,b]

topology=json.loads((root/'public/map-art/faction-topology-v2.json').read_text())
ownership=json.loads((root/'lib/map-ownership-snapshot.json').read_text())
manifest={'version':'20261028','source':'Natural Earth','license':'Public Domain','terms':'https://www.naturalearthdata.com/about/terms-of-use/','regions':regions,'years':{}}
for year in ['1715','1716']:
    source=root/f'public/map-art/faction-display/tfam_{year}.json.gz'
    if not source.exists():source=root/f'public/map-art/natural-earth/tfam_{year}.json.gz'
    features=json.loads(gzip.decompress(source.read_bytes()))['features']
    manifest['years'][year]={}
    for rid,r in regions.items():
        if os.environ.get('ATLAS_ONLY') and rid not in os.environ['ATLAS_ONLY'].split(','):continue
        w,s,e,n=r['bounds'];width=1600;height=round(width*(n-s)/(e-w));r['viewBox']=[0,0,1000,round(1000*(n-s)/(e-w),3)]
        box=((w+180)/360*terrain.width,(90-n)/180*terrain.height,(e+180)/360*terrain.width,(90-s)/180*terrain.height)
        art=terrain.crop(tuple(round(v) for v in box)).resize((width,height),Image.Resampling.LANCZOS).convert('RGBA')
        # A restrained cold wash leaves ochre deserts and green lowlands visible.
        wash=Image.new('RGBA',art.size,(162,191,198,24));art=Image.alpha_composite(art,wash)
        ink=Image.new('RGBA',art.size);draw=ImageDraw.Draw(ink)
        paths=[]
        for f in features:
            polygons=[f['geometry']['coordinates']] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates']
            commands=[]
            for poly in polygons:
                if not poly or not any(w-2<=p[0]<=e+2 and s-2<=p[1]<=n+2 for p in poly[0]):continue
                for ring in poly:
                    pts=simplify(ring)
                    if len(pts)<4:continue
                    commands.append('M'+'L'.join(f'{(p[0]-w)/(e-w)*1000:.2f},{(n-p[1])/(e-w)*1000:.2f}' for p in pts)+'Z')
                    px=[((p[0]-w)/(e-w)*width,(n-p[1])/(n-s)*height) for p in pts]
                    # Province polygons are hit areas only, never drawn as borders.
            if commands:paths.append({'id':f['properties']['owner'],'path':' '.join(commands)})
        frontiers={}
        owners=ownership.get(year,json.loads((root/'lib/seed.json').read_text())['territories'][year])
        for a,b,lines in topology['arcs']:
            left=owners.get(topology['provinceIds'][a],'');right=owners.get(topology['provinceIds'][b],'') if b>=0 else ''
            if left==right:continue
            for line in lines:
                if not any(w-1<=p[0]<=e+1 and s-1<=p[1]<=n+1 for p in line):continue
                pts=simplify(line,.055)
                if len(pts)<2:continue
                px=[((p[0]-w)/(e-w)*width,(n-p[1])/(n-s)*height) for p in pts]
                draw.line(px,fill=(22,40,43,160),width=3)
                draw.line(px,fill=(216,199,157,190),width=1)
                command='M'+'L'.join(f'{(p[0]-w)/(e-w)*1000:.2f},{(n-p[1])/(e-w)*1000:.2f}' for p in pts)
                for owner in [left,right]:
                    if owner:frontiers.setdefault(owner,[]).append(command)
        for area in paths:area['outline']=' '.join(frontiers.get(area['id'],[]))
        art=Image.alpha_composite(art,ink)
        # Atlas neatline, ticks and a quiet graticule baked into each plate.
        draw=ImageDraw.Draw(art,'RGBA')
        for lon in range(math.ceil(w/10)*10,math.ceil(e),10):
            x=(lon-w)/(e-w)*width;draw.line([(x,0),(x,height)],fill=(225,213,177,25),width=1)
        for lat in range(math.ceil(s/10)*10,math.ceil(n),10):
            y=(n-lat)/(n-s)*height;draw.line([(0,y),(width,y)],fill=(225,213,177,25),width=1)
        draw.rectangle((12,12,width-13,height-13),outline=(225,206,158,150),width=2)
        for x in range(36,width-30,32):
            draw.line([(x,12),(x,20)],fill=(225,206,158,150),width=1)
            draw.line([(x,height-20),(x,height-12)],fill=(225,206,158,150),width=1)
        name=f'{rid}-{year}.webp';encoded=io.BytesIO();art.convert('RGB').save(encoded,format='WEBP',quality=88,method=6);assert encoded.tell()>1000;tmp=out/(name+'.tmp');tmp.write_bytes(encoded.getvalue());tmp.replace(out/name)
        (out/f'{rid}-{year}.json').write_text(json.dumps(paths,separators=(',',':')))
        manifest['years'][year][rid]={'image':'/atlas-static/'+name,'hitLayer':f'/atlas-static/{rid}-{year}.json'}
manifest['years']={yr:{rid:{'image':f'/atlas-static/{rid}-{yr}.webp','hitLayer':f'/atlas-static/{rid}-{yr}.json'} for rid in regions} for yr in ['1715','1716']}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print('Baked',len(regions)*2,'regional plates;',sum(p.stat().st_size for p in out.glob('*.webp')),'image bytes;', (out/'manifest.json').stat().st_size,'manifest bytes')
