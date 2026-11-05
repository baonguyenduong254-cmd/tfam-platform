export type AtlasSymbolKind = 'capital' | 'city' | 'fortress' | 'port' | 'landmark';

const ink = '#32212c';
const parchment = '#f6e5bf';
const brass = '#cf9f65';

/** Original chart signs, with the same silhouette on the plate and in its key. */
function Engraving({kind}: {kind: AtlasSymbolKind}) {
  const signs = {
    capital: {
      silhouette: 'M3 20v-7l4-4 3 3V7l2-3 2 3v5l3-3 4 4v7Z',
      detail: 'M6 15v2m12-2v2m-7 3v-3a1 1 0 0 1 2 0v3m-1-16V2l4 1-4 1',
    },
    city: {
      silhouette: 'M3 20v-6l5-5 4 4 4-6 5 5v8Z',
      detail: 'M7 15v2m3-2v2m6-4v2m3 0v2M14 20v-3h3v3',
    },
    fortress: {
      silhouette: 'M3 20V7h3v3h3V7h3v3h3V7h3v3h3v10Z',
      detail: 'M3 13h18m-14 3h2m6 0h2m-6 4v-3h2v3',
    },
    port: {
      silhouette: 'M12 3a2.5 2.5 0 0 1 1.4 4.6V10H17v2h-3.6v6.1a6 6 0 0 0 4.1-3H15l4.4-3 1.6 4.8-1.8-.8a8 8 0 0 1-7.2 5 8 8 0 0 1-7.2-5l-1.8.8 1.6-4.8 4.4 3H6.5a6 6 0 0 0 4.1 3V12H7v-2h3.6V7.6A2.5 2.5 0 0 1 12 3Z',
      detail: 'M11.9 5.5h.2',
    },
    landmark: {
      silhouette: 'M4 20v-2h2v-7H4V9l8-5 8 5v2h-2v7h2v2Zm6-2h4v-4a2 2 0 0 0-4 0Z',
      detail: 'M7 10h10m-6-2h2m-5 4v5m8-5v5',
    },
  };
  const sign = signs[kind];
  return <>
    <path d={sign.silhouette} fill={ink} fillRule="evenodd" stroke={parchment}
      strokeWidth="1.6" strokeLinejoin="round" paintOrder="stroke fill"/>
    <path d={sign.detail} fill="none" stroke={brass} strokeWidth=".85"
      strokeLinecap="round" strokeLinejoin="round"/>
  </>;
}

export function AtlasSymbol({kind, size = 24, x = 0, y = 0}: {
  kind: AtlasSymbolKind; size?: number; x?: number; y?: number;
}) {
  return <svg className="atlas-symbol" x={x - size / 2} y={y - size / 2}
    width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect width="24" height="24" fill="transparent"/>
    <Engraving kind={kind}/>
  </svg>;
}

export function AtlasLegendSymbol({kind, size = 24}: {kind: AtlasSymbolKind; size?: number}) {
  return <svg className="atlas-legend-symbol" width={size} height={size}
    viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <Engraving kind={kind}/>
  </svg>;
}
