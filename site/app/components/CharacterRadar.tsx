'use client';
import {useState} from 'react';
import {Compass,Crown,ScrollText,Shield,Sparkles,Swords} from 'lucide-react';
import {RATING_AXES,gradeColor,type RatingAxisKey,type RatingBreakdown} from '../../lib/character-rating';

const AXIS_ICONS:Record<RatingAxisKey,typeof Swords>={
 martial:Swords,
 vestigium:Sparkles,
 tactics:Compass,
 statecraft:ScrollText,
 presence:Crown,
 resolve:Shield,
};

const CX=150;
const CY=128;
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
 const [focused,setFocused]=useState<RatingAxisKey>(rating.topAxes[0]);
 const focusedDef=RATING_AXES.find(a=>a.key===focused)||RATING_AXES[0];

 const dataRatios=RATING_AXES.map(a=>Math.max(0.18,rating.scores[a.key]/100));
 const dataPoly=polygonPoints(dataRatios);
 const overallColor=gradeColor(rating.overallGrade);

 const topLabel1=RATING_AXES.find(a=>a.key===rating.topAxes[0])?.label||'';
 const topLabel2=RATING_AXES.find(a=>a.key===rating.topAxes[1])?.label||'';

 return <div className="char-rating-module" aria-label="Six-pillar character rating">
  {/* OVERALL GRADE SEAL + ARCHETYPE */}
  <div className="char-rating-hero">
   <div className="char-grade-seal" style={{borderColor:overallColor,color:overallColor}} aria-label={'Overall grade '+rating.overallGrade}>
    <strong>{rating.overallGrade}</strong>
    <small>{rating.overallScore}</small>
   </div>
   <div className="char-rating-summary">
    <span className="char-rating-archetype">{rating.archetype}</span>
    <p className="char-rating-peaks">{topLabel1} · {topLabel2}</p>
   </div>
  </div>

  {/* HEXAGON SVG RADAR */}
  <div className="char-radar-wrap">
   <svg className="char-radar-svg" viewBox="0 0 300 256" role="img" aria-label={'Attribute hexagon: '+RATING_AXES.map(a=>`${a.label} ${rating.grades[a.key]} (${rating.scores[a.key]})`).join(', ')}>
    <defs>
     <radialGradient id="tfam-radar-fill" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stopColor="#e8c68a" stopOpacity="0.46"/>
      <stop offset="70%" stopColor="#9d2f4e" stopOpacity="0.34"/>
      <stop offset="100%" stopColor="#6e1e36" stopOpacity="0.22"/>
     </radialGradient>
    </defs>

    {/* Concentric hexagonal grid rings */}
    {RINGS.map(r=><polygon key={r} points={polygonPoints([r,r,r,r,r,r])} className="char-radar-ring"/>)}

    {/* 6 Radial spokes */}
    {RATING_AXES.map((axis,idx)=>{
     const [x,y]=vertexPoint(idx,1);
     return <line key={axis.key} x1={CX} y1={CY} x2={x} y2={y} className={'char-radar-spoke'+(focused===axis.key?' is-focused':'')}/>;
    })}

    {/* Data polygon */}
    <polygon points={dataPoly} fill="url(#tfam-radar-fill)" className="char-radar-area"/>

    {/* Vertex dots & outer labels */}
    {RATING_AXES.map((axis,idx)=>{
     const score=rating.scores[axis.key];
     const grade=rating.grades[axis.key];
     const [vx,vy]=vertexPoint(idx,Math.max(0.18,score/100));
     const [lx,ly]=vertexPoint(idx,1.32);
     const isFocused=focused===axis.key;
     const anchor=idx===0||idx===3?'middle':idx<3?'start':'end';
     const yNudge=idx===0?-4:idx===3?12:3;
     return <g key={axis.key} className={'char-radar-node'+(isFocused?' is-focused':'')} onClick={()=>setFocused(axis.key)}>
      <circle cx={vx} cy={vy} r={isFocused?4.8:3.2} fill={isFocused?gradeColor(grade):'#f5deb0'} stroke="#120c1a" strokeWidth="1.4"/>
      <text x={lx} y={ly+yNudge} textAnchor={anchor} className="char-radar-label">{axis.label}</text>
      <text x={lx} y={ly+yNudge+13} textAnchor={anchor} className="char-radar-grade" fill={gradeColor(grade)}>{grade}</text>
     </g>;
    })}
   </svg>
  </div>

  {/* 2x3 COMPACT STAT CELLS (Grade + 0-100 Score) */}
  <div className="char-axis-grid">
   {RATING_AXES.map(axis=>{
    const Icon=AXIS_ICONS[axis.key];
    const score=rating.scores[axis.key];
    const grade=rating.grades[axis.key];
    const active=focused===axis.key;
    const isPeak=rating.topAxes.includes(axis.key);
    return <button
     key={axis.key}
     type="button"
     className={'char-axis-cell'+(active?' is-active':'')+(isPeak?' is-peak':'')}
     onClick={()=>setFocused(axis.key)}
     onMouseEnter={()=>setFocused(axis.key)}
    >
     <span className="char-axis-head">
      <Icon size={13} aria-hidden="true"/>
      <span>{axis.label}</span>
     </span>
     <span className="char-axis-values">
      <strong style={{color:gradeColor(grade)}}>{grade}</strong>
      <small>{score}</small>
     </span>
     <span className="char-axis-bar" aria-hidden="true">
      <i style={{width:score+'%',background:axis.color}}/>
     </span>
    </button>;
   })}
  </div>

  {/* FOCUSED AXIS NOTE */}
  <p className="char-axis-note">
   <strong>{focusedDef.label} ({rating.grades[focused]} · {rating.scores[focused]}):</strong> {rating.notes[focused]}
  </p>
 </div>;
}
