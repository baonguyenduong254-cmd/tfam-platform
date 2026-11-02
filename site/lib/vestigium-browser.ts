import type {VestigiumRecord} from './vestigium';

export type ExhibitFilters = {query: string; abundance: string; guardNumber: string};

export function normalizeExhibitSearch(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function matchesExhibit(item: VestigiumRecord, filters: ExhibitFilters) {
  const needle = normalizeExhibitSearch(filters.query);
  const text = normalizeExhibitSearch([item.name_vi, item.name_en, item.form_vi, item.form_en,
    item.owner_vi, item.owner_en, item.royal_guard?.label, item.royal_guard?.number].filter(Boolean).join(' '));
  return (!needle || needle.split(' ').every(word => text.includes(word)))
    && (filters.abundance === 'all' || item.quantity?.kind === filters.abundance)
    && (filters.guardNumber === 'all' || item.royal_guard?.number === Number(filters.guardNumber));
}

// Keep pagination in the same order as the visible shelves, then the Academy set.
export function exhibitionOrder(shelf: VestigiumRecord[], academy: VestigiumRecord[]) {
  return [...shelf].sort((a, b) => a.rarity - b.rarity).concat(academy);
}

// A failed thumbnail must not suppress an independently available full image.
export function exhibitArtwork(item: Pick<VestigiumRecord, 'artwork' | 'thumbnail'>, large: boolean, failed: ReadonlySet<string>) {
  const full = item.artwork;
  const preferred = large ? full : item.thumbnail || full;
  if (preferred && !failed.has(preferred)) return preferred;
  return !large && full && !failed.has(full) ? full : undefined;
}
