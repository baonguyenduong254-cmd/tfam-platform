"""Check this bounded prose pass against its frozen input and source evidence."""
import json,re
from pathlib import Path
root=Path('content/vestigium');log=root/'editorial/lore-20261019'
groups=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex']
before={r['id']:r for c in groups for r in json.loads((log/('before-'+c+'.json')).read_text())}
after={r['id']:r for c in groups for r in json.loads((root/(c+'.json')).read_text())}
state=json.loads((log/'checkpoint.json').read_text());new=set(state['completed_ids'])
utility={r['id'] for r in json.loads((log/'utility-refinement.json').read_text())}
revealed=set(json.loads((log/'revealed-canon-profiles.json').read_text()))
assert len(before)==len(after)==453 and before.keys()==after.keys()
assert len(new)==len(state['blank_ids'])==85 and set(state['blank_ids'])==new
mutable={k+'_'+l for k in ['epigraph','lore','use','limits','rarity_note'] for l in ['vi','en']}|{'skills','traits','components','profile_status','content_revision','editorial_review_kind'}
changed=[]
for ident,a in after.items():
 b=before[ident];allowed=set()
 if ident in new:allowed|=mutable
 if ident in utility:allowed|={'lore_vi','lore_en'}
 if ident in revealed:allowed.add('profile_status')
 if ident=='armament-robert-vestigia-nulla':allowed|={'lore_vi','lore_en','limits_vi','limits_en','traits','content_revision','editorial_review_kind'}
 assert {k:v for k,v in b.items() if k not in allowed}=={k:v for k,v in a.items() if k not in allowed},ident+': unapproved field change'
 for lang in ['vi','en']:
  for field in ['name','form','lore','use','limits','epigraph']:
   assert a.get(field+'_'+lang,'').strip(),ident+': missing '+field+'_'+lang
 assert a.get('profile_status')!='visual',ident+': content still hidden'
 assert len(a['skills'])<=a['rarity']+1,ident+': core ability cap'
 if ident in new:
  assert len(a['traits'])>=1 and len(a['skills'])>=1,ident+': incomplete properties'
  for field in ['lore_vi','lore_en','epigraph_vi','epigraph_en']:
   assert not re.search('[\u2013\u2014]',a[field]),ident+': unwanted dash'
 if a!=b:changed.append(ident)
assert after['device-003']['quantity']['count']==100 and after['device-003']['rarity']==4
assert sum(r['origin']=='canon' for r in after.values())==39
assert len({r['royal_guard']['number'] for r in after.values() if r.get('royal_guard',{}).get('relation')=='deployment'})==100
evidence=json.loads((log/'live-source-evidence.json').read_text())
assert {x['profile_id'] for x in evidence}=={'armament-siete-victoria-fidelis','armament-robert-vestigia-nulla'}
assert all(x['revision'] and x['paragraphs'] for x in evidence)
result={'records':453,'new_bilingual_dossiers':len(new),'utility_lore_refined':len(utility),'canonical_profiles_revealed':len(revealed),'canonical_live_corrections':2,'changed_source_records':len(changed),'unchanged_source_records':453-len(changed),'missing_lore':0,'preserved_all_names_ranks_art_sources_quantities':True,'fresh_manuscript_scope':['Absolución','Vestigia Nulla']}
(log/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
