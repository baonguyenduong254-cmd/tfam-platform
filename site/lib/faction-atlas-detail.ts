import {atlasPlaces, type AtlasPlace} from './static-atlas-places';
import {inMapRegion, type MapRegion} from './map-regions';

export type ChartPlace = AtlasPlace & {
  kind: 'capital' | 'city' | 'fortress' | 'port' | 'landmark';
  dossier?: string;
};

const castilianDossiers: Record<string, string> = {
  madrid: 'castilian-madrid',
  'ESP-5848': 'castilian-toledo',
};
const castilianPorts = new Set(['lisbon', 'ESP-5809', 'ESP-5836']);

// GeoNames city anchors 2411585 (Gibraltar) and 6362987 (Ceuta).
// These points represent the locations of the authored TFAM landmark dossiers.
const strait: Pick<ChartPlace, 'id' | 'name' | 'coordinates' | 'kind' | 'dossier'>[] = [
  {id:'gibraltar-fortress', name:'Gibraltar', coordinates:[-5.35257,36.14474], kind:'fortress', dossier:'castilian-gibraltar'},
  {id:'ceuta-naval-works', name:'Ceuta', coordinates:[-5.32042,35.88919], kind:'port', dossier:'castilian-ceuta'},
];

export function chartPlaces(data: Record<string,any>, year: string, factionId: string, region: MapRegion): ChartPlace[] {
  const castilian = factionId === 'castilian_empire';
  const places = atlasPlaces(data,year,factionId,region,[],'en')
    .filter(place => place.owner === factionId)
    .map<ChartPlace>(place => ({
      ...place,
      kind: place.capital ? 'capital' : castilian && castilianPorts.has(place.id) ? 'port' : castilian && castilianDossiers[place.id] ? 'landmark' : 'city',
      dossier: castilian ? castilianDossiers[place.id] : undefined,
    }));
  if (!castilian || !['1715','1716'].includes(year)) return places;
  const index = data.factions.findIndex((f: Record<string,unknown>) => f.id === factionId);
  return [...places,...strait.filter(place => inMapRegion(place.coordinates,region)).map(place => ({
    ...place, owner:factionId, capital:false, selected:true, index, flag:data.factions[index]?.flag_asset || '',
  }))];
}
