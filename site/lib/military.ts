export type MilitaryBranch='infantry'|'cavalry'|'artillery'|'special'|'naval';
export type MilitaryUnit={id:string;faction_id:string;number:string;name_native:string;name_vi:string;class_en:string;class_vi:string;role_en:string;role_vi:string;lore_en:string;lore_vi:string;traits_en:string[];traits_vi:string[];quote_en:string;quote_vi:string;branch:MilitaryBranch;artwork:string;thumbnail:string;source_slide:string;source_index:number};
export type MilitaryFaction={id:string;name_en:string;name_vi:string;doctrine_en:string;doctrine_vi:string;lore_en:string;lore_vi:string;quote_en:string;quote_vi:string;source_slide:string;count:number;branches:Partial<Record<MilitaryBranch,number>>;data_url:string};
export type MilitaryManifest={version:string;source_revision:string;imported_at:string;unit_count:number;factions:MilitaryFaction[]};
export const militaryBranches:MilitaryBranch[]=['infantry','cavalry','artillery','special','naval'];
export const militaryBranchNames:Record<MilitaryBranch,[string,string]>={infantry:['Bộ binh','Infantry'],cavalry:['Kỵ binh','Cavalry'],artillery:['Pháo binh','Artillery'],special:['Đặc nhiệm','Special forces'],naval:['Chiến hạm','Naval vessels']};
export function militarySearch(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase();}
