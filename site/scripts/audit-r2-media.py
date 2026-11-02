"""Read-only R2 verification. Export only byte-identical copies for externalization."""
import concurrent.futures,hashlib,json,re,subprocess,time
from pathlib import Path
BASE=json.loads(Path('lib/media/config.json').read_text())['baseUrl'].rstrip('/')
GROUPS={'military/art':'images/military/full','monuments/art':'images/monuments/full','monuments/thumbs':'images/monuments/thumbs','vestigium/art':'images/vestigium/full','vestigium/thumbs':'images/vestigium/thumbs','portraits':'images/portraits'}
items=[]
for root,target in GROUPS.items():
 for p in sorted((Path('public')/root).rglob('*')):
  if p.is_file() and p.suffix.lower() in ('.webp','.png','.jpg','.jpeg','.avif','.gif'):
   key=target+'/'+p.relative_to(Path('public')/root).as_posix()
   if root=='military/art' and p.name.endswith('.thumb.webp'):key=key.replace('images/military/full/','images/military/thumbs/')
   items.append((p,key))
def verify(item):
 p,key=item;body=p.read_bytes();md5=hashlib.md5(body).hexdigest()
 for attempt in range(3):
  r=subprocess.run(['curl','-sSI','--max-time','25','-w','\nSTATUS:%{http_code}',BASE+'/'+key],capture_output=True,text=True)
  status=re.findall(r'STATUS:(\d+)',r.stdout);sizes=re.findall(r'(?im)^content-length:\s*(\d+)',r.stdout);etags=re.findall(r'(?im)^etag:\s*"?([^"\r\n]+)',r.stdout)
  if status and status[-1]=='200' and sizes and int(sizes[-1])==len(body) and etags and etags[-1]==md5:
   return '/'+p.relative_to('public').as_posix(),{'key':key,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'etag':md5}
  if status and status[-1]=='404':break
 return '/'+p.relative_to('public').as_posix(),{'error':{'status':status[-1] if status else 'network','local_bytes':len(body),'remote_bytes':sizes[-1] if sizes else None,'etag_match':bool(etags and etags[-1]==md5)},'key':key}
results={};started=time.time();print('Checking',len(items),'media files',flush=True)
with concurrent.futures.ThreadPoolExecutor(24) as pool:
 for n,(path,record) in enumerate(pool.map(verify,items),1):
  results[path]=record
  if n%150==0:print(n,'/',len(items),'checked;',round(time.time()-started),'seconds',flush=True)
verified={p:r for p,r in results.items() if 'error' not in r};failed={p:r for p,r in results.items() if 'error'in r}
prior_path=Path('lib/media/manifest.json')
prior=json.loads(prior_path.read_text()).get('assets',{}) if prior_path.exists() else {}
prior.update(verified)
Path('lib/media/external-paths.json').write_text(json.dumps({p:r['key'] for p,r in prior.items()},separators=(',',':'))+'\n')
Path('lib/media/manifest.json').write_text(json.dumps({'schemaVersion':1,'verifiedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'assets':prior},separators=(',',':'))+'\n')
Path('/tmp/tfam-r2-audit-failures.json').write_text(json.dumps(failed,indent=2))
print(json.dumps({'verified':len(verified),'failed':len(failed),'verifiedBytes':sum(r['bytes'] for r in verified.values()),'failures':list(failed.items())[:8]}),flush=True)
