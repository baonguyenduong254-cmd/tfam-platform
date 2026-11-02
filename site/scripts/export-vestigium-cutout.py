"""Install one reviewed Imagegen cutout and checkpoint both web sizes atomically."""
import json,sys,re,os,shutil,fcntl
from pathlib import Path
from PIL import Image
lock=open('/tmp/tfam-cutout-export.lock','w');fcntl.flock(lock,fcntl.LOCK_EX)
ident,master=sys.argv[1:];assert re.fullmatch('[a-z0-9-]+',ident)
root=Path('content/vestigium/editorial/pruning-20261019');queue=json.loads((root/'cutout-queue.json').read_text());r=next(r for r in queue if r['id']==ident)
if r['status']=='completed' and r.get('master')==master:
 print(ident, 'already installed');sys.exit(0)
published=next(x for x in json.loads(Path('public/vestigium',r['category']+'.json').read_text()) if x['id']==ident)
im=Image.open(master).convert('RGBA');alpha=im.getchannel('A');h=alpha.histogram();assert h[0]/(im.width*im.height)>.08, 'No meaningful transparent canvas'
for folder,size,quality in [('art',1024,82),('thumbs',300,77)]:
 p=Path('public'+published['artwork' if folder=='art' else 'thumbnail']);backup=Path('art/cutout-originals-20261019')/folder/p.name
 if not backup.exists():backup.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,backup)
 out=im.copy();out.thumbnail((size,size),Image.Resampling.LANCZOS);temp=p.with_suffix('.tmp.webp');out.save(temp,format='WEBP',quality=quality,method=6);os.replace(temp,p)
r.update(status='completed',master=master,artwork=published['artwork'],thumbnail=published['thumbnail'],transparent_fraction=h[0]/(im.width*im.height))
(root/'cutout-queue.json').write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
p=root/'checkpoint.json';x=json.loads(p.read_text());x['cutouts_completed']=sum(r['status']=='completed' for r in queue);x['cutouts_pending']=len(queue)-x['cutouts_completed'];x['status']='cutouts in progress' if x['cutouts_pending'] else 'all cutouts complete, validation and publishing pending';p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');print(ident,x['cutouts_completed'],len(queue))
