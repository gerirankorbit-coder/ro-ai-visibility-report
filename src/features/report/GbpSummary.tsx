import type { ReactNode } from 'react';
import { toneForStatus, type GbpSummary, type GbpTileKey, type TileTone } from '@/types/schema';
import { useReport } from './ReportContext';

import { GBP_H, GBP_H_FULL, GBP_W } from '@/lib/constants';
import { GbpInsights } from './GbpInsights';

/** Colours sampled from the BrightLocal summary (red, green, grey) and the Word report (orange). */
export const TONES: Record<TileTone, { bg: string; bar: string; ink: string; label: string }> = {
  red: { bg: '#F8CDCE', bar: '#C70509', ink: '#D02B2E', label: 'Red' },
  orange: { bg: '#FAE4CC', bar: '#CE6C01', ink: '#D9741C', label: 'Orange' },
  green: { bg: '#CFF6D8', bar: '#0B9229', ink: '#2E9E4A', label: 'Green' },
  grey: { bg: '#DADADA', bar: '#838383', ink: '#9E9E9E', label: 'Grey' },
};

const POPPINS = "Poppins, 'Montserrat Variable', 'Segoe UI', sans-serif";
const MONTSERRAT = "'Montserrat Variable', Montserrat, 'Segoe UI', sans-serif";
const OPEN_SANS = "'Open Sans', 'Segoe UI', sans-serif";

export const TILES: ReadonlyArray<{ key: GbpTileKey; label: string }> = [
  { key: 'links', label: 'Links & Authority' },
  { key: 'rank', label: 'Rank Tracker' },
  { key: 'gbp', label: 'GBP Audit' },
  { key: 'onsite', label: 'On-Site SEO' },
];

/** Line icons drawn to match the BrightLocal tile icons (34 x 34). */
const ICONS: Record<GbpTileKey, ReactNode> = {
  // Two interlocking chain links running from bottom-left to top-right.
  links: (
    <g transform="rotate(-45 18 18)">
      <rect x="2.5" y="12.5" width="18" height="11" rx="5.5" />
      <rect x="15.5" y="12.5" width="18" height="11" rx="5.5" />
      <rect x="6.5" y="16" width="10" height="4" rx="2" />
      <rect x="19.5" y="16" width="10" height="4" rx="2" />
    </g>
  ),
  rank: (
    <g>
      <rect x="6" y="20" width="6" height="12" />
      <rect x="15" y="12" width="6" height="20" />
      <rect x="24" y="4" width="6" height="28" />
    </g>
  ),
  gbp: (
    <g strokeLinejoin="round">
      <path d="M6.5 4h23l3.5 9H3z" />
      <path d="M3 13c0 2.2 1.7 3.8 3.9 3.8s3.9-1.6 3.9-3.8c0 2.2 1.7 3.8 3.9 3.8s3.9-1.6 3.9-3.8c0 2.2 1.7 3.8 3.9 3.8s3.9-1.6 3.9-3.8c0 2.2 1.7 3.8 3.9 3.8S33 15.2 33 13" />
      <path d="M11 4 9.8 13M18 4v9M25 4l1.2 9" />
      <path d="M5 16.8V32h26V16.8" />
      <path d="M5 21 16 32" />
      <text x="25.2" y="29.6" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={9} fill="currentColor" stroke="none">
        G
      </text>
    </g>
  ),
  onsite: (
    <g strokeLinejoin="round">
      <rect x="4" y="4" width="28" height="28" />
      <path d="M4 9.5h28" />
      <path d="M13.8 16 10 20l3.8 4M22.2 16 26 20l-3.8 4M19.3 15.2l-2.6 9.6" />
    </g>
  ),
};

function Tile({ k, label, status, tone }: { k: GbpTileKey; label: string; status: string; tone: TileTone }) {
  const c = TONES[tone];
  return (
    <div style={{ width: 155, height: 85, borderRadius: 1.5, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, background: c.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 4 }}>
        <svg width={36} height={36} viewBox="0 0 36 36" fill="none" stroke={c.bar} color={c.bar} strokeWidth={1.4} aria-hidden>
          {ICONS[k]}
        </svg>
        <span style={{ fontFamily: OPEN_SANS, fontSize: 8.6, lineHeight: 1, color: c.ink }}>{label}</span>
      </div>
      <div style={{ height: 17, background: c.bar, color: '#fff', fontFamily: OPEN_SANS, fontWeight: 400, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{status || 'OK'}</div>
    </div>
  );
}

/** The GBP Summary block (pure view): gradient "Summary" chip, location, website and four tiles. */
export function GbpSummaryView({ data, location, website }: { data: GbpSummary; location: string; website: string }) {
  const d = data;
  return (
    <div className="gbp-summary bg-white" style={{ width: GBP_W, height: d.showInsights ? GBP_H_FULL : GBP_H, position: 'relative', color: '#111' }}>
      <div
        style={{
          position: 'absolute',
          left: 14,
          top: 16,
          height: 37,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(90deg, #30FEFE 0%, #B227FF 100%)',
          fontFamily: MONTSERRAT,
          fontWeight: 800,
          fontSize: 17,
          color: '#000',
        }}
      >
        Summary
      </div>
      <div style={{ position: 'absolute', left: 14, top: 66, display: 'flex', gap: 12, fontFamily: POPPINS, fontSize: 7.6, lineHeight: '12px' }}>
        <div>
          Location:
          <br />
          {location || '—'}
        </div>
        <div>
          Website URL:
          <br />
          {website || '—'}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 14, top: 99, display: 'flex', gap: 11 }}>
        {TILES.map((t) => (
          <Tile key={t.key} k={t.key} label={t.label} status={d[t.key].status} tone={toneForStatus(d[t.key].status, d[t.key].tone)} />
        ))}
      </div>
      {d.showInsights ? <GbpInsights data={d} /> : null}
    </div>
  );
}

/** The GBP Summary block for the current report month (location/website fall back to the client). */
export function GbpSummaryBlock() {
  const { report, current } = useReport();
  const d = current.gbp_summary;
  return <GbpSummaryView data={d} location={d.location || report.client.locality} website={d.website || report.client.website} />;
}
