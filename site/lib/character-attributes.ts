import profiles from './character-attributes.json';
export const attributeDefinitions=[
 {key:'battlecraft',vi:'Chiến lực',en:'Battlecraft',color:'#c47159',viText:'Thực thi tác chiến: thể lực, phản xạ, kỹ thuật và vận dụng vũ khí hoặc Vestigium.',enText:'Action in battle: endurance, reflexes, technique, weapons and Vestigium.'},
 {key:'insight',vi:'Trí lược',en:'Insight',color:'#72b9bf',viText:'Quan sát, hiểu biết chuyên môn, phán đoán và tìm cách giải quyết vấn đề.',enText:'Observation, specialist knowledge, judgement and problem-solving.'},
 {key:'presence',vi:'Uy thế',en:'Presence',color:'#d4b36e',viText:'Tạo tín nhiệm, thuyết phục, dẫn dắt và quy tụ người khác vào hành động chung.',enText:'Trust, persuasion, leadership and the ability to bring people together.'}
] as const;
export type AttributeKey=typeof attributeDefinitions[number]['key'];
export type AttributeScores=Record<AttributeKey,number>;
export function characterAttributes(character:Record<string,any>){
 const authored=character.profile_attributes;
 const valid=(p:Record<string,any>|undefined)=>p&&attributeDefinitions.every(d=>Number.isFinite(p[d.key])&&p[d.key]>=0&&p[d.key]<=100);
 const profile=(profiles as Record<string,any>)[character.id];
 if(valid(authored))return {...profile,...authored,source:'authored' as const};
 return profile?{...profile,source:'editorial' as const}:null;
}
export function dominantAttributes(scores:AttributeScores):AttributeKey[]{
 const keys=attributeDefinitions.filter(d=>scores[d.key]>=80).map(d=>d.key);
 return keys;
}
/** These are display memberships. Guard numbers never imply a reporting rank. */
export function courtGroup(character:Record<string,any>):'crown'|'guard'|'official'|'affiliate'|'household'{
 if(character.id==='isabella_testarossa_de_aragon')return 'crown';
 if(character.id==='jose')return 'affiliate';
 if(character.castilian_branch==='household')return 'household';
 if(character.guard_number||character.castilian_branch==='guard')return 'guard';
 return 'official';
}
