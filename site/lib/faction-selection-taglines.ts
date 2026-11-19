/** Editorial banner epithets, not new canon, spoilers or unlock requirements. */
const epithets:Readonly<Record<string,string>>={
 castilian_empire:'The Crown of Fire and Frost',
 holy_french_kingdom:'The Crown and the Altar',
 western_roman_empire:'The Unfallen Eagle',
 new_portuguese_empire:'The Compass of Distant Seas',
 habsburg_poland:'The Covenant of Crowns',
 danes_kingdom:'Four Kingdoms, One Crown',
 novgorod_union:'The Northern Bell',
 scotland_ireland_union:'The Unbroken Isles',
 england_ruins:'Echoes of the Fallen Crown',
 veldraine:'The Living Dominion',
 nhemora:'The Choral Commonwealth',
 khorvait:'The Sovereign Directorate',
 wardenholf:'The Iron Resolve',
 sultanate_of_morocco:'The Sanctuary of Exiles',
 ottoman_empire:'The Crescent Reforged',
 safavid_empire:'The Lion and the Sun',
 nusantara_sultanate:'The Throne of a Thousand Islands',
 british_east_india_company:'The Company Beyond the Cape',
 annam_empire:'The Southern Dragon',
 ming_celestial_empire:'The Celestial Mandate',
 tokugawa_empire:'The Sword Beyond the Sea',
 eternal_sky_khanate:'Under the Eternal Sky',
 aksumite_empire:'The Crown of the Highlands',
 songhai_empire:'The Empire Reclaimed',
 kongo_confederation:'The Covenant of the River',
 swahili_league:'The Cities of the Monsoon',
 cape_republic:'The Republic at the World’s Edge',
 merina_empire:'The Island Crown',
};

/** Respect an existing author-written subtitle, including future live content. */
export function factionSelectionTagline(faction:{id:string;subtitle?:string}):string{
 return faction.subtitle?.trim()||epithets[faction.id]||'';
}
