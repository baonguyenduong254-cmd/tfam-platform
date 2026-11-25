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

const officialIcons = new Set([
  'astrid',
  'cassandra',
  'evelyne_vesper',
  'freya',
  'isabella_testarossa_de_aragon',
  'liv',
  'martinez',
  'nahla_al_fassi',
  'raine',
  'samira_al_fassi',
  'scarlet',
  'sigrid',
  'testarossa_uno',
  'victoria_valdes',
  'lythienne_draevenne',
  'meredith_machiavelli',
  'mirelle_montreuil',
  'serene_saavedra',
  'sonia',
  'trucia',
]);

export function hasOfficialRosterIcon(characterId?: string): boolean {
  return !!characterId && officialIcons.has(characterId);
}

export function rosterIconPath(characterId?: string): string | undefined {
  if (!characterId) return undefined;
  if (officialIcons.has(characterId)) {
    return '/portraits/roster-icons/' + characterId + '-official.webp';
  }
  if (icons.has(characterId)) {
    return '/portraits/roster-icons/' + characterId + '.webp';
  }
  return undefined;
}

export default function CharacterRosterIcon({character, lang}: {character: Record<string, any>; lang: string}) {
  const [failed, setFailed] = useState<string>();
  const icon = rosterIconPath(character.id);
  const name = String(character['name_'+lang] || character.name_en || character.name_vi || character.name || '');
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0,2)
    .map(part => Array.from(part)[0]).join('').toUpperCase() || '✦';

  return <span className="character-roster-icon" aria-hidden="true">
    {icon && failed !== icon
      ? <img src={assetUrl(icon)} alt="" width={128} height={128} loading="lazy" decoding="async" onError={() => setFailed(icon)}/>
      : <span>{initials}</span>}
  </span>;
}
