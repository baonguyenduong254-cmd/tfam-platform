import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd(),file=path.join(root,'app/page.tsx');
if(!existsSync(file))throw Error('Chạy lệnh trong project TFAM, nơi có package.json và app/page.tsx.');
const original=readFileSync(file,'utf8');
if(original.includes('TFAM_MILITARY_ROSTER_V1')){console.log('Quân lực đã được tích hợp. Dữ liệu và artwork mới sẽ được dùng ở lần deploy kế tiếp.');process.exit(0);}
let text=original;
const anchors=["import FactionHighlights from './components/FactionHighlights';","const mapData=editor&&draft?draft:data;","{id:'reader',icon:BookOpen,vi:'Đọc truyện',en:'Chronicles'}",'{tab===\'characters\''];
for(const a of anchors)if(!text.includes(a))throw Error('Source khác phiên bản đã kiểm tra. Dừng để tránh ghi đè: thiếu '+a);
text=text.replace(anchors[0],anchors[0]+"\nimport MilitaryRoster from './components/MilitaryRoster';\nimport './military.css';\n// TFAM_MILITARY_ROSTER_V1");
text=text.replace(anchors[1],`useEffect(()=>{const sync=()=>{if(!window.location.hash.startsWith('#military/'))return;const parts=window.location.hash.slice(1).split('/');let id;try{id=decodeURIComponent(parts[1]||'');}catch{return;}const index=data.factions.findIndex((x:RecordData)=>x.id===id);if(index>=0){setSelected(index);setTab('military');}};sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[data.factions]);
function openMilitary(){history.replaceState(null,'','#military/'+encodeURIComponent(f.id));setTab('military');requestAnimationFrame(()=>atlasRef.current?.scrollIntoView({behavior:motion?'smooth':'instant',block:'start'}));}
${anchors[1]}`);
text=text.replace(anchors[2],"{id:'military',icon:Swords,vi:'Quân lực',en:'Military roster'},"+anchors[2]);
text=text.replace('setTab(n.id);setProvince(null);',"setTab(n.id);setProvince(null);history.replaceState(null,'',n.id==='military'?'#military/'+encodeURIComponent(f.id):window.location.pathname+window.location.search);");
const highlight=/<FactionHighlights\s[^]*?\/>/;const found=text.match(highlight);
if(!found)throw Error('Không tìm thấy khối hồ sơ faction; source chưa được chỉnh.');
text=text.replace(highlight,found[0]+`<section className="military-teaser" aria-label={t('Quân lực quốc gia','Faction military roster')}><div><Swords size={32} strokeWidth={1}/><div><h3>{t('Quân lực','Military roster')} · {localized(f,'name')}</h3><p>{t('Khám phá các binh chủng, chiến hạm và học thuyết quân sự.','Explore the troops, warships and military doctrine.')}</p></div></div><button onClick={openMilitary}>{t('Mở quân thư','Explore roster')}<ChevronRight size={18}/></button></section>`);
text=text.replace(anchors[3],`{tab==='military'&&<MilitaryRoster factions={data.factions} factionId={f.id} lang={lang} onFaction={id=>{const index=data.factions.findIndex((a:RecordData)=>a.id===id);if(index>=0)selectFaction(index,false);}}/>}\n`+anchors[3]);
// Back up the exact local file before this narrowly scoped integration.
mkdirSync(path.join(root,'.military-backup'),{recursive:true});writeFileSync(path.join(root,'.military-backup','page.tsx.backup'),original);
writeFileSync(file,text);console.log('Đã thêm Quân lực. Không thay đổi cấu hình Cloudflare, D1, secrets hoặc nội dung đã lưu.');
