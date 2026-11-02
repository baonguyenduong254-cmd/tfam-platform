'use client';
import MediaImage from './MediaImage';
import '../national-standards.css';
/** A complete textile flag, hung from a brass yard rather than cropped into an icon. */
export default function FactionShield({src}:{src:string}){
 return <span className="faction-flag-frame textile-standard"><span className="standard-yard" aria-hidden="true"/><MediaImage src={src} alt="" loading="lazy"/></span>;
}
