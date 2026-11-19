'use client';

import {useId, useMemo} from 'react';
import type {MapRegion} from '../../lib/map-regions';
import geography from '../../lib/atlas-geography.json';

type RiverLine = [major: number, coordinates: number[][]];
type TerrainKind = 'peak' | 'forest';

export function AtlasTerrainGlyph({kind}: {kind: TerrainKind}) {
  if (kind === 'peak') {
    return <g stroke="#4f3830" strokeWidth=".8" strokeLinejoin="round">
      <path d="M-7 4-2-4 1 0 4-5 9 4Z" fill="#bc9b71"/>
      <path d="m-3-2 1-2 2 3m2-1 2-3 2 3" fill="none" stroke="#fff0d6"/>
    </g>;
  }
  return <g stroke="#37463a" strokeWidth=".75" strokeLinejoin="round">
    <path d="M-8 2-5-3-2 2Zm5-1L1-6 5 1Zm6 2 3-5 3 5Z" fill="#68715a"/>
    <path d="M-5 2v2m6-3v3m5-1v2" fill="none"/>
  </g>;
}

/** Project verified physical geography into the existing chart and clip it to the selected realm. */
export default function AtlasGeography({region, territoryPaths}: {region: MapRegion; territoryPaths: string[]}) {
  const clipId = 'atlas-geography-' + useId();
  const [west, south, east, north] = region.bounds;
  const {rivers, points} = useMemo(() => {
    const scale = 1000 / (east - west);
    const project = ([longitude, latitude]: number[]) => [(longitude - west) * scale, (north - latitude) * scale];
    const pathGroups = ['', ''];
    for (const [major, coordinates] of geography.rivers as RiverLine[]) {
      const xs = coordinates.map(([longitude]) => longitude);
      const ys = coordinates.map(([, latitude]) => latitude);
      if (Math.max(...xs) < west || Math.min(...xs) > east || Math.max(...ys) < south || Math.min(...ys) > north) continue;
      pathGroups[major] += 'M' + coordinates.map(point => project(point).map(value => value.toFixed(2)).join(',')).join('L');
    }
    return {
      rivers: pathGroups,
      points: geography.points
        .filter(({coordinates: [x, y]}) => x >= west && x <= east && y >= south && y <= north)
        .map(point => ({...point, position: project(point.coordinates)})),
    };
  }, [west, south, east, north]);

  if (!territoryPaths.length) return null;

  return <g className="atlas211-geography" aria-hidden="true" pointerEvents="none">
    <defs>
      <clipPath id={clipId}>
        {territoryPaths.map((path, index) => <path key={index} d={path} clipRule="evenodd"/>)}
      </clipPath>
    </defs>
    <g clipPath={'url(#' + clipId + ')'}>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={rivers[0]} stroke="#53717a" strokeWidth=".68" opacity=".78"/>
        <path d={rivers[1]} stroke="#e9debd" strokeWidth="2" opacity=".75"/>
        <path d={rivers[1]} stroke="#355c68" strokeWidth="1.12"/>
      </g>
      {points.map(({kind, name, position: [x, y]}) => <g key={name} transform={'translate(' + x + ' ' + y + ')'}>
        <title>{name}</title>
        <AtlasTerrainGlyph kind={kind === 'forest' ? 'forest' : 'peak'}/>
      </g>)}
    </g>
  </g>;
}
