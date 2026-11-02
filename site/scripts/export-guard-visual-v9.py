"""Export approved imagegen masters into the current Guard visual catalogue."""
import json,sys
from pathlib import Path
from PIL import Image
base=Path('content/vestigium/editorial/rebuild-v4');ledger_path=base/'guard-visual-ledger-v9.json';ledger=json.loads(ledger_path.read_text());logpath=base/'guard-art-production-v9.json';log=json.loads(logpath.read_text())if logpath.exists()else[]
for num,source in zip(sys.argv[1::2],sys.argv[2::2]):
 n=int(num);entry=next(x for x in ledger if x['number']==n and x['status']!='retained');im=Image.open(source).convert('RGBA')
 scene=entry['category']in ['entity','phenomenon','creature']
 assert scene or im.getextrema()[-1][0]==0,('Expected alpha',n)
 for folder,size,q in [('art',512,64),('thumbs',240,60)]:
  output=im.copy();output.thumbnail((size,size),Image.Resampling.LANCZOS);output.save(Path('public/vestigium')/folder/('guard-v9-'+str(n).zfill(3)+'.webp'),quality=q,method=4)
 entry['status']='illustrated';log.append({'number':n,'id':entry['id'],'master':Path(source).name,'review':'Approved form, readable silhouette and materials','generator':'built-in imagegen'});print(n,'exported')
ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n');logpath.write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n')
checkpoint_path=base/'checkpoint.json'
checkpoint=json.loads(checkpoint_path.read_text())
checkpoint['visual_illustrated']=sum(x['status']!='pending' for x in ledger)
checkpoint['visual_pending_art']=sum(x['status']=='pending' for x in ledger)
checkpoint['instructions']='Names and artwork only for approved Royal Guard designs. Lore deferred by author. Publish validated checkpoints.'
checkpoint_path.write_text(json.dumps(checkpoint,ensure_ascii=False,indent=2)+'\n')
