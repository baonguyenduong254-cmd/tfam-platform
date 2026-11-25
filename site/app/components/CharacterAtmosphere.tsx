'use client';
/** Pure CSS warm chiaroscuro glow — replaces continuous 22-loop WebGL shader. */
export default function CharacterAtmosphere({identity}:{identity:string}){
 return <div className="champion-atmosphere champion-atmosphere-css" data-character={identity} aria-hidden="true"/>;
}
