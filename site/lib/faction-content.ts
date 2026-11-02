export function factionCapital(f:Record<string,any>,lang:string,year:string){return f['capital_'+lang+'_'+year]||f['capital_vi_'+year]||f.capital_demo||'—';}
