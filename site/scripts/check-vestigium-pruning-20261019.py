"""Verify the author-approved cull preserves all canon and Royal Guard dossiers."""
from pathlib import Path
import json
root=Path('content/vestigium');audit=root/'editorial/pruning-20261019'
before={r['id']:r for p in audit.glob('before-*.json') for r in json.loads(p.read_text())}
after={r['id']:r for p in audit.glob('before-*.json') for r in json.loads((root/p.name.removeprefix('before-')).read_text())}
selection=set(json.loads((audit/'selection.json').read_text())['remove'])
assert len(before)==602 and len(after)==453 and len(selection)==149
assert set(before)-set(after)==selection
for ident,r in after.items():assert r==before[ident],f'Retained source dossier changed: {ident}'
for kind,predicate,count in [('canon',lambda r:r['origin']=='canon',39),('guard',lambda r:bool(r.get('royal_guard')),107)]:
 expected={i for i,r in before.items() if predicate(r)};actual={i for i,r in after.items() if predicate(r)}
 assert len(actual)==count and expected==actual,kind
for ident in selection:assert before[ident]['origin']!='canon' and not before[ident].get('royal_guard')
for r in after.values():
 for link in r.get('relationships',[]):assert link['target_id'] in after
print(json.dumps({'before':602,'removed':149,'remaining':453,'canon_unchanged':39,'guard_unchanged':107,'all_retained_source_records_unchanged':True}))
