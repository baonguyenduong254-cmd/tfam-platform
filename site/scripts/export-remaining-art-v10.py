"""Export reviewed remaining collection illustrations and persist progress."""
import json,sys,io
from pathlib import Path
from PIL import Image
base=Path('content/vestigium/editorial/rebuild-v4')
queue_path=base/'remaining-art-v10.json'
queue=json.loads(queue_path.read_text())
for ident,source in zip(sys.argv[1::2],sys.argv[2::2]):
 entry=next(m for m in queue if m['id']==ident)
 im=Image.open(source).convert('RGBA')
 if entry['category'] not in ['creature','entity','phenomenon']:
  assert im.getextrema()[-1][0]==0,('Expected transparent background',ident)
 for folder,size,quality,budget in [('art',512,64,32000),('thumbs',240,60,8000)]:
  out=im.copy();out.thumbnail((size,size),Image.Resampling.LANCZOS)
  while True:
   data=io.BytesIO();out.save(data,format='WEBP',quality=quality,method=4)
   if len(data.getvalue())<=budget:break
   if quality>44:quality-=5
   else:
    out.thumbnail((int(out.width*.9),int(out.height*.9)),Image.Resampling.LANCZOS)
  (Path('public/vestigium')/folder/(ident+'.webp')).write_bytes(data.getvalue())
 entry['status']='illustrated';entry['master']=Path(source).name
 print(ident,'exported')
queue_path.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
p=base/'checkpoint.json';checkpoint=json.loads(p.read_text())
checkpoint['remaining_art_v10_done']=sum(m['status']=='illustrated' for m in queue)
checkpoint['remaining_art_v10_pending']=sum(m['status']=='pending' for m in queue)
checkpoint['art_status']='remaining-collection-in-progress'
p.write_text(json.dumps(checkpoint,ensure_ascii=False,indent=2)+'\n')
