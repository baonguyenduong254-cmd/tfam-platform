export const MILITARY_CUTOUTS: Record<string, string> = {
  cast_15: '/military/cutouts/cast_15.webp',
  cast_12: '/military/cutouts/cast_12.webp',
  cast_16: '/military/cutouts/cast_16.webp',
};

export function militaryCutout(unitId?: string): string | undefined {
  return unitId ? MILITARY_CUTOUTS[unitId] : undefined;
}
