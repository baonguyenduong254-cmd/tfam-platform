import {revoltSlots} from './discovery';
type Row=Record<string,any>;
/** Presentation-only additions; never replace authored DB content with seed data. */
export function withHorizonPresentation<T extends {factions?:Row[]}>(data:T):T{
 const existing=data.factions||[];
 const factions=existing.map(f=>f.id==='england_ruins'?{...f,name_en:'Remnants of England',short_name:'England'}:f);
 for(const slot of revoltSlots){const at=factions.findIndex(f=>f.id===slot.id);if(at>=0){factions[at]={...factions[at],flag_asset:slot.flag_asset};continue;}
 factions.push({...slot,name_vi:slot.name_en,short_name:slot.name_en,ui_color_primary:'#70418f',ui_color_secondary:'#c6a3dc',traits:[],capital_demo:'—',lore_en_1715:slot.id==='veldraine'?'The Living Dominion pursues renewal through biotechnology, regenerative medicine and living architecture.':slot.id==='nhemora'?'The Choral Commonwealth explores memory, emotion and voluntary bonds of consciousness.':slot.id==='khorvait'?'The Sovereign Directorate defends freedom of will against coercion.':'The chronicles have yet to reveal Wardenholf.',lore_en_1716:'The chronicles have yet to reveal this horizon.'});}
 return {...data,factions};
}
