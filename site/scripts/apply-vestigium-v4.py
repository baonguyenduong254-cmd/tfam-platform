"""Apply an explicitly authored bilingual batch and update the resumable queue."""
import json,sys,hashlib
from pathlib import Path
root=Path('content/vestigium');base=root/'editorial/rebuild-v4';groups=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex']
data={g:json.loads((root/f'{g}.json').read_text()) for g in groups};by={m['id']:m for a in data.values() for m in a}
batch=json.loads(Path(sys.argv[1]).read_text());batch=[batch] if isinstance(batch,dict) else batch;updated=[]
for patch in batch:
 id=patch['id'];old=by.get(id,{})
 if not old: data[patch['category']].append(patch);by[id]=patch;m=patch
 else:old.update(patch);m=old
 for field in ['lore','use','limits','form','name','rarity_note']:
  for lang in ['vi','en']:assert m.get(field+'_'+lang,'').strip(),(id,field,lang)
 for field in ['skills','traits','applications']:
  assert isinstance(m.get(field),list),(id,field)
  for p in m[field]:
   for k in ['name_vi','name_en','description_vi','description_en']:assert p.get(k,'').strip(),(id,k)
 assert len(m['skills'])<=m['rarity']+1,(id,'skill cap')
 assert m['origin'] in ['canon','collection']
 assert bool(m['sources'])==(m['origin']=='canon'),(id,'provenance')
 m['content_revision']='rebuild-v4';updated.append(id)
for g,a in data.items():(root/f'{g}.json').write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
queue=json.loads((base/'queue.json').read_text());known={q['id'] for q in queue}
for id in updated:
 if id not in known:queue.append({'id':id,'category':by[id]['category'],'origin':by[id]['origin'],'has_art':Path('public/vestigium/art/'+id+'.webp').exists(),'status':'pending','new':True})
for q in queue:
 if q['id'] in updated:q.update(status='reviewed',review_kind=by[q['id']].get('editorial_review_kind','rewritten'),batch=Path(sys.argv[1]).name,content_hash=hashlib.sha256(json.dumps(by[q['id']],ensure_ascii=False,sort_keys=True).encode()).hexdigest())
(base/'queue.json').write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
checkpoint=json.loads((base/'checkpoint.json').read_text());nums=sorted({m['royal_guard']['number'] for m in by.values() if m.get('royal_guard',{}).get('relation')=='deployment'})
checkpoint.update(phase='authoring',existing_reviewed=sum(q['status']=='reviewed' and not q.get('new') for q in queue),existing_rewritten=sum(q['status']=='reviewed' and not q.get('new') and q.get('review_kind','rewritten')=='rewritten' for q in queue),new_records=sum(q.get('new',False) for q in queue),reviewed_total=sum(q['status']=='reviewed' for q in queue),total_records=len(by),guard_numbers_covered=len(nums),guard_numbers=nums,last_batch=Path(sys.argv[1]).name)
(base/'checkpoint.json').write_text(json.dumps(checkpoint,ensure_ascii=False,indent=2)+'\n');print(json.dumps(checkpoint,ensure_ascii=False))
