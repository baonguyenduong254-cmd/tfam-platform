import json,base64,html,zipfile,hashlib
from urllib.parse import quote
from subprocess import check_output
from pathlib import Path
base=Path(__file__).parent
rows=json.loads((base/'provenance.json').read_text())
assert len(rows)==74
media_dir=base.parents[1]/'lib'/'media'
media_base=json.loads((media_dir/'config.json').read_text())['baseUrl'].rstrip('/')
media_assets={asset['key']:asset for asset in json.loads((media_dir/'manifest.json').read_text())['assets'].values()}

def read_webp(filename,key):
 local=base/filename
 if local.is_file():
  return local.read_bytes()
 record=media_assets[key]
 body=check_output(['curl','--fail','--silent','--show-error','--retry','2','--max-time','30',media_base+'/'+quote(key,safe='/')])
 if hashlib.sha256(body).hexdigest()!=record['sha256']:
  raise ValueError(f'R2 checksum mismatch for {key}')
 return body

cards=[]
for x in rows:
 i=x['id'];data=base64.b64encode(read_webp(i+'.thumb.webp',x['r2_thumbnail_key'])).decode()
 cards.append('<article data-search="'+html.escape((x['name']+' '+i+' '+x['origin']).lower(),quote=True)+'"><img loading="lazy" src="data:image/webp;base64,'+data+'" alt="'+html.escape(x['name'],quote=True)+'"><h2>'+html.escape(x['name'])+'</h2><p>'+html.escape(x['origin'])+' · '+' × '.join(map(str,x['size']))+' px</p><small>'+html.escape(i)+'</small></article>')
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TFAM · 74 ảnh Vestigium thay thế</title><style>*{box-sizing:border-box}body{margin:0;background:#111720;color:#eee9df;font:16px system-ui}header{max-width:1200px;margin:auto;padding:40px 24px 24px}h1{font:34px Georgia;color:#e4c48a}p{color:#b9b5ad;line-height:1.6}input{width:100%;padding:15px;background:#202936;color:white;border:1px solid #49505b;border-radius:8px;font:inherit}main{padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;max-width:1500px;margin:auto}article{padding:16px;background:#1c2430;border:1px solid #303c4b;border-radius:10px}img{width:100%;height:260px;object-fit:contain}h2{font:20px Georgia;color:#e5c68d}small{overflow-wrap:anywhere;color:#8f9cae}article[hidden]{display:none}footer{padding:30px;text-align:center;color:#aaa}</style><header><p>THROUGH FROST AND MYTH · VESTIGIUM</p><h1>74 ảnh thay thế</h1><p>Bộ ảnh đã tạo lại theo hồ sơ trên site. Vật thể dùng nền trong suốt; Hiện tượng giữ cảnh nền. Bản xem này dùng thumbnail 300 px. File WebP đầy đủ và PNG gốc được lưu riêng. Các chi tiết ngoại hình canon chưa xác định là diễn giải mỹ thuật. Bộ ảnh chưa được cập nhật lên R2 hoặc site.</p><input id="search" placeholder="Tìm tên, mã ảnh, canon hoặc collection…" aria-label="Tìm ảnh"><p id="count">74 ảnh</p></header><main>'''+''.join(cards)+'''</main><footer>PNG gốc · WebP lossless · Thumbnail 300 px · Built-in ImageGen</footer><script>document.getElementById('search').addEventListener('input',function(){let n=0;for(const c of document.querySelectorAll('article')){c.hidden=!c.dataset.search.includes(this.value.toLowerCase());if(!c.hidden)n++}document.getElementById('count').textContent=n+' ảnh'})</script></html>'''
(base/'catalog.html').write_text(page)
out=Path('/workspace/scratch/tfam-refresh/TFAM-Vestigium-74-Web.zip')
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_STORED) as z:
 z.writestr('index.html',page)
 for x in rows:
  i=x['id'];z.writestr(x['r2_full_key'],read_webp(i+'.webp',x['r2_full_key']));z.writestr(x['r2_thumbnail_key'],read_webp(i+'.thumb.webp',x['r2_thumbnail_key']))
 z.write(base/'provenance.json','provenance.json')
 for p in base.glob('*prompt*'):z.write(p,p.name)
 z.writestr('README.txt','74 full-resolution lossless WebP images + 74 thumbnails. R2 keys preserved as ZIP paths. WebP exports are verified against the R2 media manifest when retrieved remotely. Master PNGs are archived in R2. See r2_master_key and png_sha256 in provenance.json. Open index.html to browse. Update site manifest hashes only after a verified upload.\n')
with zipfile.ZipFile(out) as z:assert z.testzip() is None
print('Created',out,'bytes',out.stat().st_size)
