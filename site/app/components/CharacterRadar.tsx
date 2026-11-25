'use client';
import {useId,useState,type CSSProperties} from 'react';
import {Compass,Crown,ScrollText,Shield,Sparkles,Swords} from 'lucide-react';
import {RATING_AXES,gradeColor,type RatingAxisKey,type RatingBreakdown,type RatingGrade} from '../../lib/character-rating';

const AXIS_ICONS:Record<RatingAxisKey,typeof Swords>={
 martial:Swords,
 vestigium:Sparkles,
 tactics:Compass,
 statecraft:ScrollText,
 presence:Crown,
 resolve:Shield,
};

export const AXIS_PALETTE:Record<RatingAxisKey,{from:string;to:string;glow:string;tint:string}>={
 martial:{from:'#ff7a88',to:'#cf274d',glow:'rgba(255, 92, 118, 0.52)',tint:'rgba(220, 48, 84, 0.16)'},
 vestigium:{from:'#e3a8ff',to:'#8947ff',glow:'rgba(186, 116, 255, 0.56)',tint:'rgba(156, 76, 255, 0.18)'},
 tactics:{from:'#86e7ff',to:'#2c87e6',glow:'rgba(98, 210, 255, 0.50)',tint:'rgba(56, 168, 240, 0.16)'},
 statecraft:{from:'#ffe8a3',to:'#ce8e32',glow:'rgba(246, 200, 108, 0.52)',tint:'rgba(226, 168, 68, 0.16)'},
 presence:{from:'#ffa6cc',to:'#c83372',glow:'rgba(255, 132, 186, 0.50)',tint:'rgba(218, 64, 128, 0.16)'},
 resolve:{from:'#88f5ce',to:'#249a79',glow:'rgba(104, 232, 184, 0.46)',tint:'rgba(52, 184, 144, 0.16)'},
};

function gradeTheme(grade:RatingGrade){
 switch(grade){
  case 'EX':return {from:'#fff5d6',to:'#d99aff',glow:'rgba(226, 168, 255, 0.62)',ring:'#f7d4ff'};
  case 'S+':return {from:'#fff0be',to:'#ff7a92',glow:'rgba(255, 132, 124, 0.54)',ring:'#ffd59e'};
  case 'S':return {from:'#fff0c4',to:'#e0a84b',glow:'rgba(240, 194, 104, 0.48)',ring:'#f2cf8c'};
  case 'A+':return {from:'#dff8ff',to:'#78c6f7',glow:'rgba(124, 208, 255, 0.42)',ring:'#a8e0ff'};
  default:return {from:'#efe2f5',to:'#a896b8',glow:'rgba(196, 174, 214, 0.34)',ring:'#cbb8da'};
 }
}

const CX=150;
const CY=130;
const R=78;
const RINGS=[0.25,0.5,0.75,1];

function vertexPoint(index:number,ratio:number):[number,number]{
 const angle=(-90+index*60)*(Math.PI/180);
 return [CX+Math.cos(angle)*R*ratio,CY+Math.sin(angle)*R*ratio];
}

function polygonPoints(ratios:number[]){
 return ratios.map((r,idx)=>{
  const [x,y]=vertexPoint(idx,r);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
 }).join(' ');
}

export default function CharacterRadar({rating}:{rating:RatingBreakdown}){
 const uid=useId().replace(/:/g,'');
 const [focused,setFocused]=useState<RatingAxisKey>(rating.topAxes[0]);
 const focusedDef=RATING_AXES.find(a=>a.key===focused)||RATING_AXES[0];
 const focusedPalette=AXIS_PALETTE[focused];

 const dataRatios=RATING_AXES.map(a=>Math.max(0.18,rating.scores[a.key]/100));
 const dataPoly=polygonPoints(dataRatios);
 const heroGrade=gradeTheme(rating.overallGrade);
 const topAxis1=RATING_AXES.find(a=>a.key===rating.topAxes[0])||RATING_AXES[0];
 const topAxis2=RATING_AXES.find(a=>a.key===rating.topAxes[1])||RATING_AXES[1];
 const TopIcon1=AXIS_ICONS[topAxis1.key];
 const TopIcon2=AXIS_ICONS[topAxis2.key];
 const p1=AXIS_PALETTE[topAxis1.key];
 const p2=AXIS_PALETTE[topAxis2.key];

 const fillId=`tfam-rf-${uid}`;
 const strokeId=`tfam-rs-${uid}`;
 const glowId=`tfam-rg-${uid}`;

 return <div
  className="char-rating-module"
  style={{
   '--hero-from':heroGrade.from,
   '--hero-to':heroGrade.to,
   '--hero-glow':heroGrade.glow,
   '--hero-ring':heroGrade.ring,
   '--focus-from':focusedPalette.from,
   '--focus-to':focusedPalette.to,
   '--focus-glow':focusedPalette.glow,
  } as CSSProperties}
  aria-label="Six-pillar character rating"
 >
  {/* OVERALL LUMINOUS GRADE MEDALLION + ARCHETYPE */}
  <div className="char-rating-hero">
   <div className="char-grade-seal" aria-label={'Overall grade '+rating.overallGrade}>
    <span className="char-grade-seal-ring" aria-hidden="true"/>
    <strong>{rating.overallGrade}</strong>
    <small>{rating.overallScore}</small>
   </div>
   <div className="char-rating-summary">
    <span className="char-rating-kicker">Imperial Evaluation</span>
    <span className="char-rating-archetype">{rating.archetype}</span>
    <div className="char-rating-peak-pills">
     <span style={{'--pill-from':p1.from,'--pill-to':p1.to,'--pill-glow':p1.glow,'--pill-tint':p1.tint} as CSSProperties}>
      <TopIcon1 size={11} aria-hidden="true"/>{topAxis1.label}
     </span>
     <span style={{'--pill-from':p2.from,'--pill-to':p2.to,'--pill-glow':p2.glow,'--pill-tint':p2.tint} as CSSProperties}>
      <TopIcon2 size={11} aria-hidden="true"/>{topAxis2.label}
     </span>
    </div>
   </div>
  </div>

  {/* LUMINOUS GLOW-GRADIENT HEXAGON SVG RADAR */}
  <div className="char-radar-wrap">
   <div className="char-radar-aura" aria-hidden="true"/>
   <svg className="char-radar-svg" viewBox="0 0 300 262" role="img" aria-label={'Attribute hexagon: '+RATING_AXES.map(a=>`${a.label} ${rating.grades[a.key]} (${rating.scores[a.key]})`).join(', ')}>
    <defs>
     <radialGradient id={fillId} cx="50%" cy="46%" r="64%">
      <stop offset="0%" stopColor="#fff0c8" stopOpacity="0.62"/>
      <stop offset="42%" stopColor={p1.from} stopOpacity="0.44"/>
      <stop offset="78%" stopColor={p2.to} stopOpacity="0.34"/>
      <stop offset="100%" stopColor="#3c1432" stopOpacity="0.24"/>
     </radialGradient>
     <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fff4d2"/>
      <stop offset="48%" stopColor={p1.from}/>
      <stop offset="100%" stopColor={p2.from}/>
     </linearGradient>
     <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="3.4" result="blur"/>
      <feMerge>
       <feMergeNode in="blur"/>
       <feMergeNode in="SourceGraphic"/>
      </feMerge>
     </filter>
    </defs>

    {/* Concentric hexagonal grid rings */}
    {RINGS.map((r,i)=><polygon key={r} points={polygonPoints([r,r,r,r,r,r])} className={'char-radar-ring'+(i===3?' is-outer':'')}/>)}

    {/* 6 Radial spokes */}
    {RATING_AXES.map((axis,idx)=>{
     const [x,y]=vertexPoint(idx,1);
     const isFocused=focused===axis.key;
     return <line
      key={axis.key}
      x1={CX}
      y1={CY}
      x2={x}
      y2={y}
      className={'char-radar-spoke'+(isFocused?' is-focused':'')}
      style={isFocused?{stroke:AXIS_PALETTE[axis.key].from}:undefined}
     />;
    })}

    {/* Glowing Data Polygon */}
    <polygon points={dataPoly} fill={`url(#${fillId})`} stroke={`url(#${strokeId})`} filter={`url(#${glowId})`} className="char-radar-area"/>

    {/* Radiant Vertex Orbs & Outer Labels */}
    {RATING_AXES.map((axis,idx)=>{
     const score=rating.scores[axis.key];
     const grade=rating.grades[axis.key];
     const pal=AXIS_PALETTE[axis.key];
     const [vx,vy]=vertexPoint(idx,Math.max(0.18,score/100));
     const [lx,ly]=vertexPoint(idx,1.33);
     const isFocused=focused===axis.key;
     const anchor=idx===0||idx===3?'middle':idx<3?'start':'end';
     const yNudge=idx===0?-6:idx===3?12:2;
     return <g key={axis.key} className={'char-radar-node'+(isFocused?' is-focused':'')} onClick={()=>setFocused(axis.key)}>
      <circle cx={vx} cy={vy} r={isFocused?11:6.5} fill={pal.from} opacity={isFocused?0.34:0.18}/>
      <circle cx={vx} cy={vy} r={isFocused?4.8:3.4} fill={isFocused?'#fff9ec':pal.from} stroke={pal.to} strokeWidth="1.6" filter={`url(#${glowId})`}/>
      <text x={lx} y={ly+yNudge} textAnchor={anchor} className="char-radar-label">{axis.label}</text>
      <text x={lx} y={ly+yNudge+14} textAnchor={anchor} className="char-radar-grade" fill={grade==='EX'||grade==='S+'?pal.from:gradeColor(grade)} style={{filter:`drop-shadow(0 0 6px ${pal.glow})`}}>{grade}</text>
     </g>;
    })}
   </svg>
  </div>

  {/* 2x3 LUMINOUS STAT CARDS WITH BESPOKE GLOW ICON MEDALLIONS */}
  <div className="char-axis-grid">
   {RATING_AXES.map(axis=>{
    const Icon=AXIS_ICONS[axis.key];
    const pal=AXIS_PALETTE[axis.key];
    const score=rating.scores[axis.key];
    const grade=rating.grades[axis.key];
    const active=focused===axis.key;
    const isPeak=rating.topAxes.includes(axis.key);
    return <button
     key={axis.key}
     type="button"
     className={'char-axis-cell'+(active?' is-active':'')+(isPeak?' is-peak':'')}
     style={{
      '--axis-from':pal.from,
      '--axis-to':pal.to,
      '--axis-glow':pal.glow,
      '--axis-tint':pal.tint,
     } as CSSProperties}
     onClick={()=>setFocused(axis.key)}
     onMouseEnter={()=>setFocused(axis.key)}
    >
     <span className="char-axis-top">
      <span className="char-axis-icon-badge" aria-hidden="true">
       <Icon size={14} strokeWidth={2}/>
      </span>
      <span className="char-axis-meta">
       <span className="char-axis-name">{axis.label}</span>
       <span className="char-axis-values">
        <strong>{grade}</strong>
        <small>{score}</small>
       </span>
      </span>
     </span>
     <span className="char-axis-bar" aria-hidden="true">
      <i style={{width:score+'%'}}/>
     </span>
    </button>;
   })}
  </div>

  {/* FOCUSED AXIS NOTE */}
  <p className="char-axis-note">
   <strong>{focusedDef.label} · {rating.grades[focused]} ({rating.scores[focused]}):</strong> {rating.notes[focused]}
  </p>
 </div>;
}
