type Character = Record<string, any>;

// Debuted identities from TFAM - POWER. This index grants no access to story fields.
export const castilianGuardRegister = new Map<string, {number: number; name?: string}>([
  ['testarossa_uno', {number: 1}],
  ['scarlet', {number: 2}],
  ['fredo', {number: 3}],
  ['evelyne_vesper', {number: 4}],
  ['raine', {number: 5}],
  ['meredith_machiavelli', {number: 6, name: 'Meredith Machiavelli'}],
  ['victoria_valdes', {number: 7}],
  ['marco_stones', {number: 8, name: 'Marcon Stones'}],
  ['england_ruins_representative', {number: 9}],
  ['cassandra', {number: 10, name: 'Cassandra Azurena'}],
  ['lythienne_draevenne', {number: 11, name: 'Lythienne Draevenne'}],
  ['romeo_harkon', {number: 12}],
  ['astrid', {number: 22}],
  ['martinez', {number: 25, name: 'Martinez Testarossa'}],
  ['serene_saavedra', {number: 28, name: 'Serene Saavedra'}],
  ['sigrid', {number: 32}],
  ['barbossa', {number: 37, name: 'Gaspar Barbossa'}],
  ['freya', {number: 42}],
  ['nahla_al_fassi', {number: 44}],
  ['liv', {number: 52}],
  ['samira_al_fassi', {number: 55}],
  ['jesper', {number: 68, name: 'Jesper Calderón'}],
  ['sonia', {number: 70, name: 'Sonia Machiavelli'}],
  ['alvaro_morales', {number: 89, name: 'Álvaro Morales'}],
  ['mirelle_montreuil', {number: 88, name: 'Mirelle Montreuil'}],
  ['lokoh', {number: 90}],
  ['trucia', {number: 97, name: 'Trucia Fanez'}],
  ['robert_salcedo', {number: 99, name: 'Robert Salcedo'}],
  ['leonardo_razen', {number: 100}],
]);

export function restoreMissingGuardEntries(characters: Character[]): Character[] {
  const missing = ['alvaro_morales', 'robert_salcedo','meredith_machiavelli','lythienne_draevenne','serene_saavedra','mirelle_montreuil','sonia','trucia']
    .filter(id => !characters.some(character => character.id === id))
    .map(id => {
      const {name, number} = castilianGuardRegister.get(id)!;
      return {
        id, faction_id: 'castilian_empire', castilian_branch: 'guard', guard_number: number,
        name_en: name, name_vi: name, role_en: number===70?'Royal Guard · Setenta':number===97?'Royal Guard · Noventa y Siete':'Royal Guard', role_vi: number===70?'Cận vệ Hoàng gia · Setenta':number===97?'Cận vệ Hoàng gia · Noventa y Siete':'Cận vệ Hoàng gia',
        portrait_asset: ['sonia','trucia'].includes(id)?null:['alvaro_morales','robert_salcedo'].includes(id)?`/portraits/castilian/${id}-v2.webp`:`/wardrobe/${id}-uniform.webp`,
        portrait_thumbnail: ['sonia','trucia'].includes(id)?null:['alvaro_morales','robert_salcedo'].includes(id)?`/portraits/castilian/${id}-v2-thumb.webp`:`/wardrobe/${id}-uniform.webp`,
      };
    });
  return [...characters, ...missing].map(character => {
    if (!['sonia','trucia'].includes(character.id)) return character;
    const {name,number}=castilianGuardRegister.get(character.id)!;
    const title=number===70?'Setenta':'Noventa y Siete';
    return {...character,name_en:name,name_vi:name,guard_number:number,castilian_branch:'guard',role_en:'Royal Guard · '+title,role_vi:'Cận vệ Hoàng gia · '+title};
  });
}
