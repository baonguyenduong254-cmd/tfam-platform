import sys,json,shutil,hashlib
from pathlib import Path
from PIL import Image
asset_id,source_path,prompt_path=sys.argv[1:]
base=Path(__file__).parent
brief=next(x for x in json.loads((base/'remaining-briefs.json').read_text()) if x['id']==asset_id)
dest=base/(asset_id+'.png')
shutil.copy2(source_path,dest)
im=Image.open(dest)
assert min(im.size)>=1024,im.size
alpha=im.mode=='RGBA' and im.getextrema()[3][0]==0
if not asset_id.startswith('phenomenon-'):assert alpha,'Transparent background required'
im.save(base/(asset_id+'.webp'),lossless=True,method=4)
thumb=im.copy();thumb.thumbnail((300,300));thumb.save(base/(asset_id+'.thumb.webp'),quality=85,method=4)
p=base/'provenance.json';rows=json.loads(p.read_text())
rows=[x for x in rows if x['id']!=asset_id]
rows.append(dict(id=asset_id,name=brief['name'],origin=brief['origin'],sources=brief['sources'],size=list(im.size),alpha=alpha,sha256=hashlib.sha256((base/(asset_id+'.webp')).read_bytes()).hexdigest(),r2_full_key='images/vestigium/full/'+asset_id+'.webp',r2_thumbnail_key='images/vestigium/thumbs/'+asset_id+'.webp',status='prepared-not-uploaded',method='built-in ImageGen; dossier-based regeneration',old_size=brief['old_size'],prompt_file=prompt_path,visual_review='pending'))
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(asset_id,im.size,'saved', 'alpha' if alpha else 'scene')
