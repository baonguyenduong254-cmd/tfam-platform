"""Apply the author's approved name/form catalogue, deferring lore authoring."""
import json,copy
from pathlib import Path
root=Path('content/vestigium');base=root/'editorial/rebuild-v4'
groups=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex']
data={g:json.loads((root/(g+'.json')).read_text())for g in groups}
rows={}
for line in (base/'approved-guard-visuals-v9.tsv').read_text().splitlines():
 n,vi,en,cat,fvi,fen=line.split('|');rows[int(n)]={'name_vi':vi,'name_en':en,'category':cat,'form_vi':fvi,'form_en':fen}
assert len(rows)==84,len(rows)
old=[copy.deepcopy(m)for a in data.values()for m in a if m.get('royal_guard',{}).get('relation')=='deployment']
archive=base/'guard-before-visual-v9.json'
if not archive.exists():archive.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
reuse={16,20,21,23,24,26,29,31,33,34,36,37,41,43,45,49,50,61,97}
# Unchanged forms with matching existing illustrations remain linked to their original asset.
ledger=[]
for a in data.values():
 for m in a:
  if m.get('royal_guard',{}).get('relation')!='deployment':continue
  n=m['royal_guard']['number'];label=m['royal_guard']['label'];m['profile_status']='visual';m['content_revision']='approved-visual-v9'
  if m['origin']=='canon':
   if n==7:
    m['name_vi']='Siete. Mã Tấu Sai Lệch';m['name_en']='Siete. Distorted Greatblade'
   ledger.append({'number':n,'id':m['id'],'name_vi':m['name_vi'],'category':m['category'],'canon':True,'form_en':m['form_en'],'artwork':'/vestigium/art/'+m['id']+'.webp','status':'retained'})
   continue
  if n==7:
   m.update(name_vi='Siete. Kiếm Giải Phược Absolución',name_en='Siete. Unbinding Thrusting Sword Absolución',form_vi='Kiếm đâm trắng bạc dài hẹp, hai cạnh cùn',form_en='Long narrow silver-white thrusting sword, both sides blunt, very long piercing point',origin='canon',sources=[{'volume':4,'chapter':140,'tab_id':'t.21vry6q54l0j','anchor':'Một chuôi kiếm hình thành trong tay Victoria, nhỏ và cân bằng hơn mã tấu sai lệch rất nhiều. Từ chuôi vươn ra một thân thép dài, hẹp tới mức nhìn nghiêng gần như biến mất; hai cạnh đều cùn, bản thép thu lại gần như chỉ còn một đường thẳng kết thúc bằng mũi đâm trắng bạc rất dài.'}]);m['category']='armament';m['classification_status']='editorial'
  else:
   spec=rows[n];m.update(spec);m['name_vi']=label+'. '+spec['name_vi'];m['name_en']=label+'. '+spec['name_en'];m['owner_vi']='';m['owner_en']=''
   if n==9:m['owner_vi']='Timothy Beaumont';m['owner_en']='Timothy Beaumont'
  # Pending editorial content is genuinely empty, rather than old lore for a different object.
  for field in ['lore','use','limits','epigraph','behavior']:
   for lang in ['vi','en']:m[field+'_'+lang]=''
  m['skills']=[];m['traits']=[];m['applications']=[];m['relationships']=[]
  m['rarity_note_vi']='Bậc trưng bày tạm giữ từ hồ sơ trước; nội dung chi tiết sẽ được biên soạn sau.';m['rarity_note_en']='The previous provisional display rank is retained pending the detailed dossier.'
  m['art']={'kind':m['category'],'description':m['form_en']}
  if m['category']=='complex':
   parts={9:[('Heavenfall','Heavenfall','Bộ găng và chín thiên tiễn','Command gauntlets and nine heavenly arrows'),('Heavenroar','Heavenroar','Súng trường đá lửa ba nòng','Three-barrel flintlock rifle')],10:[('Trang sức Lilium','Lilium jewellery','Bộ trang sức nữ fleur-de-lis hoàng kim','Golden fleur-de-lis jewellery set'),('Halberd Lilium','Lilium halberd','Halberd hoàng kim cùng chủ đề','Matching golden fleur-de-lis halberd')]}.get(n,[('Khí cụ','Physical implement',m['form_vi'],m['form_en']),('Biểu hiện triển khai','Deployed manifestation',m['form_vi'],m['form_en'])])
   m['components']=[dict(name_vi=v,name_en=e,description_vi=d,description_en=f)for v,e,d,f in parts]
  else:m.pop('components',None)
  if n not in reuse:m['art_asset']='/vestigium/art/guard-v9-'+str(n).zfill(3)+'.webp';m['thumbnail_asset']='/vestigium/thumbs/guard-v9-'+str(n).zfill(3)+'.webp'
  ledger.append({'number':n,'id':m['id'],'name_vi':m['name_vi'],'name_en':m['name_en'],'category':m['category'],'canon':m['origin']=='canon','form_en':m['form_en'],'artwork':m.get('art_asset','/vestigium/art/'+m['id']+'.webp'),'status':'retained'if n in reuse else 'pending'})
# Rebucket migrated forms and repair typed links while retaining stable dossier URLs.
allitems=[m for a in data.values()for m in a];by={m['id']:m for m in allitems}
for m in allitems:
 for link in m.get('relationships',[]):
  if link['target_id']in by:link['target_category']=by[link['target_id']]['category']
for g in groups:(root/(g+'.json')).write_text(json.dumps([m for m in allitems if m['category']==g],ensure_ascii=False,indent=2)+'\n')
(base/'guard-visual-ledger-v9.json').write_text(json.dumps(sorted(ledger,key=lambda x:(x['number'],x['id'])),ensure_ascii=False,indent=2)+'\n')
print('Visual dossiers',len(ledger),'numbers',len({x['number']for x in ledger}),'new art',sum(x['status']=='pending'for x in ledger))
