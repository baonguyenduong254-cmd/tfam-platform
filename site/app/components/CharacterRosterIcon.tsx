'use client';

import {useState} from 'react';
import {assetUrl} from '../../lib/media/asset-url';
import seatIcons from '../../lib/character-seat-icons.json';

import studioIcons from '../../lib/character-seat-studio-icons.json';

const studioIconIds = new Set(studioIcons);
const seatIconIds = new Set(seatIcons);

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

const v270Icons = new Set([
  'alvaro_morales',
  'barbossa',
  'dante_stones',
  'edward_spencer',
  'england_ruins_representative',
  'franco',
  'fredo',
  'jesper',
  'juliet_spencer',
  'leonardo_razen',
  'lokoh',
  'marco_stones',
  'millennia_stones',
  'remi_spencer',
  'robert_salcedo',
  'romeo_harkon',
]);

export function hasOfficialRosterIcon(characterId?: string): boolean {
  return !!characterId && (studioIconIds.has(characterId) || seatIconIds.has(characterId) || officialIcons.has(characterId) || v270Icons.has(characterId));
}

export function rosterIconPath(characterId?: string): string | undefined {
  if (!characterId) return undefined;
  if (studioIconIds.has(characterId)) return '/portraits/seat-studio-hd/' + characterId + '.webp';
  if (characterId === 'juliet_spencer') return '/portraits/seat/juliet.png';
  if (characterId === 'evelyne_vesper') return '/portraits/seat/evelyne.png';
  if (seatIconIds.has(characterId)) return '/portraits/seat-hd/' + characterId + '.webp';
  if (characterId === 'isabella_testarossa_de_aragon') {
    return '/portraits/roster-icons/isabella-v269-official.webp';
  }
  if (v270Icons.has(characterId)) {
    return '/portraits/roster-icons/v270/' + characterId + '.webp';
  }
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
