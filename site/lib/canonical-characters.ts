import wardrobe from './wardrobe-manifest.json';
import {characterArtwork} from './character-artwork';
import {orderCharacters} from './character-order';

type Row = Record<string, any>;
const art = wardrobe as Record<string, Record<string, string>>;

const guardNames: Record<number, string> = {
  1: 'Uno', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis',
  7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez', 11: 'Once', 12: 'Doce',
  22: 'Veintidos', 25: 'Veinticinco', 28: 'Veintiocho', 32: 'Treinta y dos',
  37: 'Treinta y siete', 42: 'Cuarenta y dos', 44: 'Cuarenta y cuatro',
  52: 'Cincuenta y dos', 55: 'Cincuenta y cinco', 68: 'Sesenta y ocho',
  70: 'Setenta', 88: 'Ochenta y ocho', 89: 'Ochenta y nueve', 90: 'Noventa',
  97: 'Noventa y siete', 99: 'Noventa y nueve', 100: 'Cien',
};

function normalizeAsset(src?: string): string {
  return (src || '').split(/[?#]/)[0].trim().toLowerCase().replace(/^https?:\/\/[^/]+/, '');
}

/**
 * Resolve the single canonical full-body uniform artwork for a character.
 * Shared identically by Overview and Character Showcase.
 */
export function canonicalCharacterArtwork(character?: Row | null): string {
  if (!character) return '';
  return art[character.id]?.uniform || characterArtwork(character) || '';
}

/**
 * Resolve the canonical English role or Royal Guard title.
 */
export function canonicalCharacterRole(character?: Row | null): string {
  if (!character) return 'The Court';
  if (character.guard_number) {
    return 'Royal Guard · ' + (guardNames[character.guard_number] || String(character.guard_number));
  }
  return character.role_en || 'The Court';
}

/**
 * Deduplicate and canonically order characters so Overview and Character Showcase
 * always present the exact same cast, order, and uniform portraits.
 */
export function canonicalCharacters(characters: Row[]): Row[] {
  const seenId = new Set<string>();
  const seenArt = new Set<string>();
  const out: Row[] = [];
  for (const c of orderCharacters(characters)) {
    if (!c?.id || seenId.has(c.id)) continue;
    const resolved = canonicalCharacterArtwork(c);
    const key = normalizeAsset(resolved);
    if (key && seenArt.has(key)) continue;
    seenId.add(c.id);
    if (key) seenArt.add(key);
    out.push(c);
  }
  return out;
}
