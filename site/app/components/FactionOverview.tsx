'use client';
import {ArrowUpRight} from 'lucide-react';
import chroniclesArt from '../../lib/chronicle-art-display.json';
import featuredMilitary from '../../lib/featured-military.json';
import {traitArtwork} from '../../lib/trait-art';
import MediaImage from './MediaImage';
import {factionCapital} from '../../lib/faction-content';
import {unitIllustration} from '../../lib/unit-art';
type R=Record<string,any>;
type Props={faction:R;data:R;year:string;index:number;characters:R[];units:R[];regions:number;onCharacter:(c:R)=>void;onUnit:(u:R)=>void;onYear:(s:string)=>void;onDestination:(s:string)=>void;onMilitaryUnit:(s:string)=>void};
export default function FactionOverview({faction:f,year,characters,units,regions,onCharacter,onUnit,onDestination,onMilitaryUnit}:Props){
 const artwork=(chroniclesArt as Record<string,R>)[f.id],featured=(featuredMilitary as Record<string,R[]>)[f.id],forces=featured?.length?featured:units;
 const local=(r:R,key:string)=>r[key+'_en']||r[key]||(key==='name'?r.name_native:'')||'',lore=f['lore_en_'+year]||f['lore_vi_'+year]||'',written=lore&&!/^placeholder/i.test(lore);
 return <div className="faction-overview overview211">
  <section className="overview-history" aria-labelledby="faction-history">
   <div><h2 id="faction-history">An empire in the making</h2><dl className="overview-facts"><div><dt>Capital</dt><dd>{factionCapital(f,'en',year)}</dd></div><div><dt>Territories · {year}</dt><dd>{regions} regions</dd></div></dl><div className="overview-links"><button onClick={()=>onDestination('atlas')}>Explore the Atlas <ArrowUpRight size={18} aria-hidden="true"/></button><button onClick={()=>onDestination('monuments')}>Discover landmarks <ArrowUpRight size={18} aria-hidden="true"/></button></div>{artwork&&<figure className="overview-chronicle-art"><MediaImage src={artwork.asset} alt={artwork.title} width={1600} height={1000} loading="lazy"/><figcaption>{artwork.title}</figcaption></figure>}</div>
   <article className="lore">{written?lore.split(/\n\s*\n/).map((p:string,i:number)=><p key={i}>{p}</p>):<p>The chronicle is being prepared.</p>}{written&&!f['lore_en_'+year]&&<small>Vietnamese source · English translation pending</small>}</article>
  </section>
  <section className="overview-trait-section"><h2>Imperial identity</h2><div className="overview-traits">{(f.traits||[]).map((t:R,i:number)=><article key={t.id||i}><MediaImage className="overview-trait-art" src={traitArtwork(t,i)} alt="" width={76} height={92} loading="lazy"/><h3>{local(t,'label')}</h3><p>{local(t,'effect')||t.effect_ui||'Record pending.'}</p></article>)}</div>{!f.traits?.length&&<p>Faction traits are being prepared.</p>}</section>
  <section className="overview-people-section"><header><h2>People of the age</h2><button onClick={()=>onDestination('characters')}>Open the register <ArrowUpRight size={18} aria-hidden="true"/></button></header><div className="overview-people">{characters.slice(0,4).map(c=><button key={c.id} onClick={()=>onCharacter(c)}>{c.portrait_asset?<MediaImage src={c.portrait_asset} alt={local(c,'name')} width={768} height={1024} loading="lazy"/>:<div className="portrait-pending">Portrait forthcoming</div>}<strong>{local(c,'name')}</strong><small>Character dossier</small></button>)}</div>{!characters.length&&<p>Character dossiers are being prepared.</p>}</section>
  <section className="overview-unit-section"><header><h2>Under the banner</h2><button onClick={()=>onDestination('military')}>Inspect the military <ArrowUpRight size={18} aria-hidden="true"/></button></header><div className="overview-units">{forces.slice(0,3).map(u=><button key={u.id} data-branch={u.branch} onClick={()=>featured?.length?onMilitaryUnit(u.id):onUnit(u)}><MediaImage src={u.artwork||u.thumbnail||unitIllustration(f.id,u.image_asset)} alt={local(u,'name')} width={800} height={1200} loading="lazy"/><strong>{local(u,'name')}</strong><small>{local(u,'role')}</small></button>)}</div>{!forces.length&&<p>Unit dossiers are being prepared.</p>}</section>
 </div>;
}
