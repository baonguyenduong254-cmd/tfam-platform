import portraits from './character-portraits.json';
import {withCastilianPresentation} from './castilian-presentation';

/** Supply bundled portraits without replacing an author's custom image URL. */
export function withCharacterPortraits<T extends {characters?: Array<Record<string, any>>}>(data:T):T {
 const prepared=withCastilianPresentation(data);
 return {...prepared,characters:prepared.characters?.map(character=>{
  const bundled=portraits[character.id as keyof typeof portraits];
  return bundled&&!character.portrait_asset?{...character,portrait_asset:bundled}:character;
 })};
}
