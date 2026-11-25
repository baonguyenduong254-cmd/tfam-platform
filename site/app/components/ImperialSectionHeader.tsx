'use client';
import type {ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';
import {assetUrl} from '../../lib/media/asset-url';
import './imperial-header.css';

export type ImperialFactionOption = {
  id: string;
  name_en?: string;
  name_vi?: string;
  flag_asset?: string;
};

type Props = {
  kicker: string;
  title: string;
  subtitle?: string;
  titleId?: string;
  flagAsset?: string;
  factions?: ImperialFactionOption[];
  activeFactionId?: string;
  onFaction?: (id: string) => void;
  countValue?: number | string;
  countLabel?: string;
  rightControls?: ReactNode;
  bottomBar?: ReactNode;
};

export default function ImperialSectionHeader({
  kicker,
  title,
  subtitle,
  titleId = 'archive-title',
  flagAsset,
  factions,
  activeFactionId,
  onFaction,
  countValue,
  countLabel,
  rightControls,
  bottomBar,
}: Props) {
  return (
    <header className={'imp-hero' + (bottomBar ? '' : ' no-bar')}>
      <div className="imp-hero-aura" aria-hidden="true" />
      <div className="imp-hero-top">
        <div className="imp-hero-identity">
          {flagAsset && (
            <img
              className="imp-hero-flag"
              src={assetUrl(flagAsset)}
              alt=""
              aria-hidden="true"
            />
          )}
          <div className="imp-hero-titles">
            <span className="imp-hero-kicker">{kicker}</span>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="imp-hero-sub">{subtitle}</p>}
          </div>
        </div>

        <div className="imp-hero-controls">
          {rightControls}
          {factions && factions.length > 1 && onFaction && activeFactionId && (
            <label className="imp-faction-select">
              <span className="sr-only">Choose faction</span>
              <select
                value={activeFactionId}
                onChange={e => onFaction(e.target.value)}
              >
                {factions.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name_en || a.name_vi}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          )}
          {countValue !== undefined && countLabel && (
            <span className="imp-hero-count" role="status" aria-live="polite">
              <strong>{countValue}</strong> {countLabel}
            </span>
          )}
        </div>
      </div>

      {bottomBar && <div className="imp-hero-bar">{bottomBar}</div>}
    </header>
  );
}
