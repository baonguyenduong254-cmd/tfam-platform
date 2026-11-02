from pathlib import Path
import json,random,math,collections
cats=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex']
all=sum([json.loads(Path('content/vestigium/editorial/pruning-20261019/before-'+c+'.json').read_text()) for c in cats],[])
protected={r['id'] for r in all if r['origin']=='canon' or r.get('royal_guard')}
# Preserve the practical heat/agriculture/medicine chains and memorable conceptual anchors.
keep='''material-than-ngu-dong material-soi-banh-nuoc material-dat-om-re material-muoi-danh-thuc-hat material-vai-uong-mau material-gom-giu-thuoc material-nhua-khau-go material-cat-nghe-khuon material-da-nhuong-luc material-dong-dem-nhip material-thoi-dan-diu material-nhua-cat-sang material-dich-ngung-men material-soi-cham-dut material-bot-tat-duong-muc material-giot-muc-chua-kho material-dich-ranh-binh-minh mineral-ngan-thach-can-nhiet mineral-thach-khuyet-trong mineral-ngoc-chon-tieng-chuong mineral-thach-no-mot-nhip mineral-manh-da-chua-roi mineral-ngoc-ghi-mau-dau-tien mineral-hach-khoang-khong-doi botanical-dawnbearing-white-pine botanical-thermal-balance-orchid botanical-the-lastseed-tree botanical-the-unnumbered-lotus botanical-horizon-lichen botanical-earthstitch-root botanical-nightlamp-daisy botanical-countercadence-lichen creature-ember-beetle creature-warmthread-silkworm creature-echohound creature-dreamwatch-cat creature-springbearing-hart creature-the-last-bee creature-weaver-of-the-last-thread creature-moth-of-the-lost-colour creature-winterkeeping-nightingale creature-sunkenbell-whale creature-returnweb-spider entity-the-draft-patron entity-the-burier-of-cannon-echoes entity-the-infirmary-rhythm-keeper entity-the-keeper-of-the-unburnt-library entity-the-witness-of-the-blank-page entity-the-folded-horizon-bearer entity-the-keeper-of-its-own-name entity-the-sleeper-between-two-knocks entity-the-keeper-of-tomorrows-place phenomenon-the-rain-that-falls-once phenomenon-the-blank-beyond-the-map phenomenon-the-city-beneath-one-mist phenomenon-winter-within-the-wall-niche phenomenon-the-room-of-two-dawns phenomenon-the-load-remembering-vault device-044 device-045 device-053 device-047 device-last-lighthouse-lens armament-collection-7-08 armament-collection-7-07 armament-collection-7-02 armament-collection-6-04 complex-ca-voi-lo-tham complex-vuon-trong-tieng-chuong complex-cot-buom-muoi-ba complex-civitas'''.split()
protected.update(keep)
protected.update('mineral-thach-khoa-bong botanical-longnight-cedar material-thoi-tra-luc entity-the-breath-scribe device-025 complex-can-lo-hoa-tuy complex-giap-vuon-bach-thiet'.split())
# Any object used by an explicitly linked production chain stays intact.
for r in all:
 for link in r.get('relationships',[]):protected.add(link['target_id'])
nonGuard=[r for r in all if not r.get('royal_guard')];target=math.floor(.3*len(nonGuard)+.5);quotas={c:math.floor(.3*sum(r['category']==c for r in nonGuard)) for c in cats}
for c in sorted(cats,key=lambda c:(.3*sum(r['category']==c for r in nonGuard))%1,reverse=True)[:target-sum(quotas.values())]:quotas[c]+=1
rng=random.Random('TFAM-20261019-curated-pruning-30pct-v1');removed=[]
for c in cats:
 a=[r for r in nonGuard if r['category']==c];eligible=[r for r in a if r['id'] not in protected];quota=quotas[c];assert len(eligible)>=quota,(c,len(eligible),quota)
 # Stratify by tier, then draw among weaker overlapping utilities with a fixed seed.
 tierquota={t:math.floor(quota*sum(r['rarity']==t for r in a)/len(a)) for t in range(8)}
 left=quota-sum(tierquota.values())
 for t in sorted(range(8),key=lambda t:(quota*sum(r['rarity']==t for r in a)/len(a))%1,reverse=True)[:left]:tierquota[t]+=1
 chosen=[]
 for t in range(8):
  pool=[r for r in eligible if r['rarity']==t];n=min(tierquota[t],len(pool),max(0,sum(r['rarity']==t for r in a)-2))
  # Smaller utility duplicates receive higher probability; rarity is kept stratified.
  def key(r):
   use=r.get('use_vi','');weak=sum(word in use.lower() for word in ['so ','đối chiếu','nhỏ','ngắn','nhắc','kiểm','một nhịp','một câu','giữ nếp','mùi'])
   return rng.random()**(1/(1+weak))
  chosen+=sorted(pool,key=key,reverse=True)[:n]
 if len(chosen)<quota:
  pool=[r for r in eligible if r not in chosen];rng.shuffle(pool);chosen+=pool[:quota-len(chosen)]
 removed+=chosen
print('removed',len(removed),'remaining',len(all)-len(removed),'protected',len(protected))
for c in cats:
 a=[r for r in removed if r['category']==c];print('\n'+c,len(a));print('\n'.join(f"{r['id']} | {r['rarity']} | {r['name_vi']} | {r.get('use_vi','')[:70]}" for r in a))
Path('/tmp/prune-selection.json').write_text(json.dumps({'remove':[r['id'] for r in removed],'protected':sorted(protected),'quotas':quotas,'seed':'TFAM-20261019-curated-pruning-30pct-v1','target':target},ensure_ascii=False,indent=2))
