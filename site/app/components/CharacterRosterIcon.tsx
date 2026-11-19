'use client';

import {useState} from 'react';
import {assetUrl} from '../../lib/media/asset-url';

const icons = new Set([
  'alvaro_morales',
  'astrid',
  'barbossa',
  'cassandra',
  'dante_stones',
  'edward_spencer',
  'england_ruins_representative',
  'evelyne_vesper',
  'franco',
  'fredo',
  'freya',
  'isabella_testarossa_de_aragon',
  'jesper',
  'juliet_spencer',
  'leonardo_razen',
  'liv',
  'lokoh',
  'marco_stones',
  'martinez',
  'millennia_stones',
  'nahla_al_fassi',
  'raine',
  'remi_spencer',
  'robert_salcedo',
  'romeo_harkon',
  'samira_al_fassi',
  'scarlet',
  'sigrid',
  'testarossa_uno',
  'victoria_valdes',
]);

export default function CharacterRosterIcon({character, lang}: {character: Record<string, any>; lang: string}) {
  const [failed, setFailed] = useState<string>();
  const icon = icons.has(character.id) ? character.id : undefined;
  const name = String(character['name_'+lang] || character.name || '');
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0,2)
    .map(part => Array.from(part)[0]).join('').toUpperCase() || '✦';

  return <span className="character-roster-icon" aria-hidden="true">
    {icon && failed !== icon
      ? <img src={assetUrl('/portraits/roster-icons/'+icon+'.webp')} alt="" width={128} height={128} loading="lazy" decoding="async" onError={() => setFailed(icon)}/>
      : <span>{initials}</span>}
  </span>;
}
