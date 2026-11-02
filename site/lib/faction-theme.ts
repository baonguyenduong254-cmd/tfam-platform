export type RoyalPalette={paper:string;surface:string;wash:string;ink:string;accent:string;metal:string};
const palette=(paper:string,surface:string,wash:string,ink:string,accent:string,metal:string):RoyalPalette=>({paper,surface,wash,ink,accent,metal});
/** Light court colours, authored per faction; ink/accent remain readable on each paper. */
export const factionThemes:Record<string,RoyalPalette>={
 castilian_empire:palette('#f5efe4','#fffaf0','#e8d7c8','#3c3430','#8b3f3c','#8c713f'),
 holy_french_kingdom:palette('#f1f1f8','#fbfbff','#dce2f0','#30394b','#4b5f91','#8a7546'),
 western_roman_empire:palette('#f5edf1','#fff9fb','#ead7e2','#483440','#794b72','#8d7249'),
 sultanate_of_morocco:palette('#f0f3e9','#fcfdf4','#dce7d6','#30453b','#3c6d55','#8a733e'),
 habsburg_poland:palette('#f6f0dc','#fffbee','#e9debb','#403b2e','#705e39','#92733b'),
 novgorod_union:palette('#f4eef2','#fff9fc','#e6d8e2','#433545','#825268','#857050'),
 ottoman_empire:palette('#f1f1e5','#fdfcf0','#e0e4c9','#3c4233','#596a40','#8a743e'),
 danes_kingdom:palette('#eef3f5','#fafdff','#d9e5ea','#33444c','#446776','#88764e'),
 scotland_ireland_union:palette('#f2eef7','#fcfaff','#e3dcee','#41384d','#6c5784','#88754e'),
 england_ruins:palette('#f2efe8','#fcfaf4','#e2ddd2','#41403b','#686154','#87734d'),
 new_portuguese_empire:palette('#edf4ed','#f9fff8','#d5e8db','#34493e','#3b6c5b','#8c7447'),
 british_east_india_company:palette('#f5eee5','#fff9f1','#eadbcb','#493c33','#7b5641','#8c7447'),
 annam_empire:palette('#f8eee5','#fffaf0','#eedaca','#4c3731','#974b43','#917038'),
 ming_celestial_empire:palette('#f8f1dc','#fffbef','#eddfb7','#4b4030','#7c5c27','#9b783c'),
 nusantara_sultanate:palette('#edf5f0','#f8fff9','#d5e9df','#344940','#336c5c','#8c7544'),
 tokugawa_empire:palette('#f3eff8','#fdfaff','#e3dbef','#42384d','#6e5687','#88754e'),
 eternal_sky_khanate:palette('#edf5f6','#f8feff','#d3e9eb','#33474d','#396d77','#89744b'),
 safavid_empire:palette('#f5eef6','#fff9ff','#e9d9eb','#48394d','#7a5481','#89744b'),
 aksumite_empire:palette('#f7f0e4','#fffbf1','#ecdec8','#4a3d2e','#7d5b33','#8d7441'),
 songhai_empire:palette('#f7eee5','#fff9ef','#eed9c8','#4b3830','#8a5242','#8c6f3b'),
 kongo_confederation:palette('#f0f3e8','#fcfdf4','#dfe6cb','#3c4734','#54683c','#887341'),
 swahili_league:palette('#edf5f3','#f9fffd','#d4e9e4','#344a46','#3b6f69','#88744a'),
 cape_republic:palette('#f5f0e6','#fffaf1','#e7decb','#454134','#6c623c','#8b764b'),
 merina_empire:palette('#f7eef1','#fff9fb','#eddce2','#4c3940','#865269','#8c744a')
};
export const defaultFaction='castilian_empire';
export function factionTheme(id:string){return factionThemes[id]||factionThemes[defaultFaction];}
export function royalThemeVariables(id:string):Record<string,string>{return Object.fromEntries(Object.entries({...factionThemes[defaultFaction],ink:'#211b1b',accent:'#8d1538',metal:'#785e37'}).map(([k,v])=>['--royal-'+k,v]));}
