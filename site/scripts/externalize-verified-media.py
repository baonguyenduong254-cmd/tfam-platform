"""Remove only byte-verified R2 copies from public/. Git retains prior versions."""
import hashlib,json,sys
from pathlib import Path
manifest=json.loads(Path('lib/media/manifest.json').read_text())['assets'];apply='--apply'in sys.argv
allowed=('/military/art/','/monuments/art/','/monuments/thumbs/','/vestigium/art/','/vestigium/thumbs/','/portraits/')
removed=[];changed=[]
for legacy,record in manifest.items():
 if not legacy.startswith(allowed):continue
 p=Path('public')/legacy.lstrip('/')
 if not p.exists():continue
 if p.stat().st_size!=record['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest()!=record['sha256']:
  changed.append(legacy);continue
 removed.append((legacy,record['bytes']))
 if apply:p.unlink()
print(json.dumps({'applied':apply,'files':len(removed),'bytes':sum(size for _,size in removed),'changedSinceAudit':changed},indent=2))
if changed:sys.exit(1)
