import json,sys
from pathlib import Path
root=Path('content/vestigium'); editorial=root/'editorial/lore-20261019'
groups=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex']
data={c:json.loads((root/(c+'.json')).read_text()) for c in groups}
records={r['id']:r for a in data.values() for r in a}
checkpoint=json.loads((editorial/'checkpoint.json').read_text())
for filename in sys.argv[1:]:
 for x in json.loads(Path(filename).read_text()):
  r=records[x['id']]
  assert x['id'] in checkpoint['blank_ids'], 'Only the approved blank-profile queue may be changed'
  for key in ['epigraph','lore','use','limits']:
   r[key+'_vi'],r[key+'_en']=x[key]
  for field in ['traits','skills']:
   r[field]=[dict(zip(['name_vi','name_en','description_vi','description_en'],v)) for v in x[field]]
  if 'components' in x:r['components']=[dict(zip(['name_vi','name_en','description_vi','description_en'],v)) for v in x['components']]
  if r['origin']=='collection':
   r['rarity_note_vi']='Bậc trưng bày và cơ chế thuộc phần mở rộng Collection được tác giả cho phép sáng tạo.'
   r['rarity_note_en']='Display rank and mechanics belong to the author-authorised Collection expansion.'
  r.pop('profile_status',None);r['content_revision']='lore-20261019';r['editorial_review_kind']='authored-from-approved-visual'
  if x['id'] not in checkpoint['completed_ids']:checkpoint['completed_ids'].append(x['id'])
for c,a in data.items():(root/(c+'.json')).write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
checkpoint['remaining_ids']=[i for i in checkpoint['blank_ids'] if i not in checkpoint['completed_ids']]
checkpoint['status']='writing' if checkpoint['remaining_ids'] else 'all blank dossiers authored; final review pending'
(editorial/'checkpoint.json').write_text(json.dumps(checkpoint,ensure_ascii=False,indent=2)+'\n')
print('Completed',len(checkpoint['completed_ids']),'of',len(checkpoint['blank_ids']))
