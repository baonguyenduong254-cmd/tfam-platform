from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
from PIL import Image
import urllib.request,time,io,json
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--dem-cache',required=True);args=parser.parse_args();root=Path(args.dem_cache);root.mkdir(parents=True,exist_ok=True);z=5

def fetch(t):
 x,y=t;p=root/f'{x}-{y}.png'
 if p.exists():
  try:
   with Image.open(p) as im:im.verify()
   return len(p.read_bytes())
  except:pass
 for attempt in range(4):
  try:
   raw=urllib.request.urlopen(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',timeout=30).read()
   with Image.open(io.BytesIO(raw)) as im:assert im.size==(256,256)
   p.write_bytes(raw);return len(raw)
  except Exception:
   if attempt==3:raise
   time.sleep(attempt+1)
total=0
with ThreadPoolExecutor(max_workers=16) as pool:
 futures=[pool.submit(fetch,(x,y))for y in range(32)for x in range(32)]
 for i,f in enumerate(as_completed(futures),1):
  total+=f.result()
  if i%128==0:print(json.dumps({'downloaded':i,'total':1024,'MiB':round(total/1048576,1)}),flush=True)
print('Complete',total,flush=True)
