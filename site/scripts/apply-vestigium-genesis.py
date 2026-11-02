from pathlib import Path
if Path('content/vestigium/editorial/guard-v3/progress.json').exists():
 raise SystemExit('The exponential skill scheme was superseded by guard-v3. Edit current dossiers directly.')
"""Apply manually authored bilingual records; never generate ability filler."""
import json,pathlib,sys
root=pathlib.Path('content/vestigium')
for filename in sys.argv[1:]:
 updates=json.loads(pathlib.Path(filename).read_text())
 grouped={}
 for u in updates:grouped.setdefault(u['category'],[]).append(u)
 for category,rows in grouped.items():
  p=root/(category+'.json');items=json.loads(p.read_text());byid={m['id']:m for m in items}
  for patch in rows:
   m=byid[patch['id']];assert m['origin']=='collection',m['id'];assert patch['rarity']==m['rarity']
   assert len(patch['skills'])==2**m['rarity'],(m['id'],len(patch['skills']))
   for f in ['lore_vi','lore_en','use_vi','use_en','limits_vi','limits_en','skills','traits']:assert patch[f],(m['id'],f)
   for s in patch['skills']:
    for f in ['name_vi','name_en','description_vi','description_en']:assert s[f].strip(),(m['id'],f)
   for lang in ['vi','en']:assert len({s['description_'+lang].lower() for s in patch['skills']})==len(patch['skills'])
   m.update(patch);m['content_revision']='genesis-v2'
  p.write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
  print(category,'applied',len(rows))
