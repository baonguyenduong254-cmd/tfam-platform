import {presentationPunctuation} from './presentation-punctuation';
export function factionCapital(f:Record<string,any>,lang:string,year:string){return presentationPunctuation(f['capital_'+lang+'_'+year]||f['capital_vi_'+year]||f.capital_demo||'Not recorded');}
