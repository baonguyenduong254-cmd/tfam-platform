export type MapRegion={id:string;vi:string;en:string;bounds:[number,number,number,number]};
const regions:Record<string,MapRegion>={
 europe:{id:'europe',vi:'Châu Âu · Địa Trung Hải',en:'Europe · Mediterranean',bounds:[-24,18,58,72]},
 eurasia:{id:'eurasia',vi:'Bắc Âu · Đại lục Á–Âu',en:'Northern Europe · Eurasia',bounds:[5,28,155,76]},
 americas:{id:'americas',vi:'Tân Thế Giới',en:'The New World',bounds:[-126,-57,-27,49]},
 india:{id:'india',vi:'Ấn Độ · Ấn Độ Dương',en:'India · Indian Ocean',bounds:[45,-8,113,43]},
 eastasia:{id:'eastasia',vi:'Đông Á · Đông Nam Á',en:'East Asia · Southeast Asia',bounds:[83,-16,153,58]},
 steppe:{id:'steppe',vi:'Thảo nguyên Trung Á',en:'Central Asian Steppe',bounds:[43,23,126,62]},
 persia:{id:'persia',vi:'Ba Tư · Trung Đông',en:'Persia · Middle East',bounds:[26,9,86,49]},
 westafrica:{id:'westafrica',vi:'Tây Phi · Sahara',en:'West Africa · Sahara',bounds:[-26,-4,32,39]},
 horn:{id:'horn',vi:'Sừng châu Phi · Biển Đỏ',en:'Horn of Africa · Red Sea',bounds:[18,-9,63,37]},
 centralafrica:{id:'centralafrica',vi:'Trung Phi',en:'Central Africa',bounds:[-2,-32,50,15]},
 eastafrica:{id:'eastafrica',vi:'Đông Phi · Ấn Độ Dương',en:'East Africa · Indian Ocean',bounds:[18,-39,70,16]},
 southernafrica:{id:'southernafrica',vi:'Nam Phi · Mũi Hảo Vọng',en:'Southern Africa · The Cape',bounds:[3,-43,60,1]}
};
const assignments:Record<string,string>={castilian_empire:'europe',holy_french_kingdom:'europe',western_roman_empire:'europe',sultanate_of_morocco:'europe',habsburg_poland:'europe',novgorod_union:'eurasia',ottoman_empire:'europe',danes_kingdom:'europe',scotland_ireland_union:'europe',england_ruins:'europe',new_portuguese_empire:'americas',british_east_india_company:'india',annam_empire:'eastasia',ming_celestial_empire:'eastasia',nusantara_sultanate:'eastasia',tokugawa_empire:'eastasia',eternal_sky_khanate:'eastasia',safavid_empire:'persia',aksumite_empire:'horn',songhai_empire:'westafrica',kongo_confederation:'centralafrica',swahili_league:'eastafrica',cape_republic:'southernafrica',merina_empire:'eastafrica'};
export function mapRegion(factionId:string):MapRegion{return regions[assignments[factionId]]||regions.europe;}
export function inMapRegion(position:number[],region:MapRegion){const [w,s,e,n]=region.bounds;return position[0]>=w&&position[0]<=e&&position[1]>=s&&position[1]<=n;}
export function mapRegionLimits(region:MapRegion):[[number,number],[number,number]]{const [w,s,e,n]=region.bounds,dx=(e-w)*.12,dy=(n-s)*.12;return [[Math.max(-179,w-dx),Math.max(-80,s-dy)],[Math.min(179,e+dx),Math.min(82,n+dy)]];}
