import type { ReactNode } from 'react';
import { mediaUrl } from '@/lib/api';
import { SECTIONS, SHEET_H, SHEET_W } from '@/lib/constants';
import type { Client, Month } from '@/types/schema';
import type { Gmb, Note, TileStatus } from '@/types/gmb';
import { ReportDocument } from '@/features/report/ReportDocument';
import { AreaPanel, CallsPanel, INSIGHT_COLORS } from './InsightCharts';
import { Area, Bar, BODY_FONT, Chip, DarkPage, GRAD, HEAD_FONT, LetterPage, LINK_COLOR, LinkBox, Logo, PAGE_W, Shot } from './layout';

export interface PageSpec {
  key: string;
  render: (n: number) => ReactNode;
}

export interface BuildInput {
  client: Client;
  month: Month;
  note: Note | null;
  /** Resolve a stored screenshot path to a URL. */
  src?: (path: string) => string;
  /** Show dashed boxes where screenshots are missing (demo only; real reports leave them out). */
  placeholders?: boolean;
}

export interface BuiltReport {
  pages: PageSpec[];
  toc: string[];
  warnings: string[];
}

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

/* ------------------------------------------------------------------ */
/* Small visual pieces                                                 */
/* ------------------------------------------------------------------ */

function Stars({ n, size = 15 }: { n: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }} aria-label={`${n} stars`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z" fill="#D4AF37" stroke="#9C7C10" strokeWidth=".6" />
        </svg>
      ))}
    </span>
  );
}

function GoogleG({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const TILE_ICONS: Record<string, ReactNode> = {
  links: <path d="M14 20l6-6M11 17l-3 3a4.2 4.2 0 0 0 6 6l3-3M23 17l3-3a4.2 4.2 0 0 0-6-6l-3 3" />,
  rank: <path d="M8 27V19h4v8zM15 27V13h4v14zM22 27V7h4v20z" />,
  gbp: <path d="M7 12h20l-1.5-5h-17zM7 12v3a3.3 3.3 0 0 0 6.7 0 3.3 3.3 0 0 0 6.6 0 3.3 3.3 0 0 0 6.7 0v-3M9 18v9h16v-9M17 24h5" />,
  onsite: <path d="M7 8h20v18H7zM7 12h20M14 16l-3 3 3 3M20 16l3 3-3 3" />,
};

function Tile({ id, label, status, tone }: { id: string; label: string; status: TileStatus; tone: 'red' | 'orange' }) {
  const bg = tone === 'red' ? '#F8CDCE' : '#FAE4CC';
  const bar = status === 'attention' ? '#7A7A7A' : tone === 'red' ? '#C70509' : '#CE6C01';
  const ink = tone === 'red' ? '#C70509' : '#CE6C01';
  return (
    <div style={{ width: 162, height: 88, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <svg width={34} height={34} viewBox="0 0 34 34" fill="none" stroke={ink} strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
          {TILE_ICONS[id]}
        </svg>
        <span style={{ fontSize: 9.5, color: ink, opacity: 0.85 }}>{label}</span>
      </div>
      <div style={{ height: 17, background: bar, color: '#fff', fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD_FONT }}>{status === 'ok' ? 'OK' : 'In progress'}</div>
    </div>
  );
}

/** Placeholder shown in the demo where real screenshots would go. */
let SHOW_PLACEHOLDERS = false;
function Placeholder({ label, style }: { label: string; style?: React.CSSProperties }) {
  if (!SHOW_PLACEHOLDERS) return null;
  return <div style={{ border: '1px dashed #BDBDBD', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9A9A', fontSize: 12, ...style }}>{label}</div>;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function CoverPage({ client, gmb, toc }: { client: Client; gmb: Gmb; toc: string[] }) {
  return (
    <DarkPage>
      <div style={{ position: 'absolute', left: 47, top: 72 }}>
        <Logo light style={{ width: 242 }} />
      </div>
      <div style={{ position: 'absolute', left: 43, top: 198 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 14px', background: GRAD, fontFamily: HEAD_FONT, fontSize: 20, color: '#000' }}>{gmb.coverTitle}</div>
      </div>
      <div style={{ position: 'absolute', left: 44, top: 270, width: 560, fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 40, lineHeight: '50px', color: '#fff' }}>{client.name}</div>
      <div style={{ position: 'absolute', left: 46, top: 388 }}>
        <div style={{ fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Table of Contents</div>
        <ul style={{ margin: 0, paddingLeft: 48, fontSize: 14, lineHeight: '17.5px', listStyle: 'disc' }}>
          {toc.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </DarkPage>
  );
}

function ThanksPage() {
  return (
    <DarkPage wireframe="thanks">
      <div style={{ position: 'absolute', left: 50, top: 200, width: 712, fontSize: 16, lineHeight: '22.5px', textAlign: 'justify' }}>
        <span style={{ float: 'left', marginRight: 8, marginTop: -4, fontFamily: HEAD_FONT, fontWeight: 800, fontSize: 60, lineHeight: '56px', background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Thank You!</span>
        <span style={{ display: 'block', paddingTop: 32 }}>
          for choosing Rank Orbit for your marketing. Your trust in us is greatly appreciated. We&apos;re committed to delivering excellence and meeting your expectations. Should you have any further inquiries or require additional assistance, feel free to reach out. We look forward to serving you again in the future. Thank you for being a valued part of Rank Orbit.
        </span>
      </div>
    </DarkPage>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} style={{ margin: '0 0 14px', fontSize: 14.7, lineHeight: '26.5px', textAlign: 'justify' }}>
            {/* **bold** support */}
            {p.split(/(\*\*[^*]+\*\*)/).map((part, j) => (part.startsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : <span key={j}>{part}</span>))}
          </p>
        ))}
    </>
  );
}

function NotePage({ n, note, src }: { n: number; note: Note; src: (p: string) => string }) {
  return (
    <LetterPage n={n}>
      <Area top={115}>
        <Chip>{note.title || 'Google Core Update'}</Chip>
        {note.image_path ? <Shot src={src(note.image_path)} alt="Google update" style={{ marginTop: 10, width: 731, height: 392 }} /> : null}
        <div style={{ marginTop: 14 }}>
          <Chip style={{ minWidth: 79 }}>Note</Chip>
        </div>
        <div style={{ marginTop: 22 }}>
          <Paragraphs text={note.body} />
          {note.link ? (
            <p style={{ margin: 0, fontSize: 14.7, lineHeight: '26.5px' }}>
              For more details, you can view the official update{' '}
              <a href={note.link} style={{ color: LINK_COLOR, fontWeight: 700, textDecoration: 'underline' }}>
                here
              </a>
              .
            </p>
          ) : null}
        </div>
      </Area>
    </LetterPage>
  );
}

function SummaryBlock({ client, gmb }: { client: Client; gmb: Gmb }) {
  const s = gmb.summary;
  return (
    <div>
      <Chip>Summary</Chip>
      <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 9.5, lineHeight: '13px' }}>
        <div>
          Location:
          <br />
          {client.locality || '—'}
        </div>
        <div>
          Website URL:
          <br />
          {client.website || '—'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 11, marginTop: 14, marginLeft: -5 }}>
        <Tile id="links" label="Links & Authority" status={s.links} tone="red" />
        <Tile id="rank" label="Rank Tracker" status={s.rank} tone="red" />
        <Tile id="gbp" label="GBP Audit" status={s.gbp} tone="orange" />
        <Tile id="onsite" label="On-Site SEO" status={s.onsite} tone="orange" />
      </div>
    </div>
  );
}

function InsightsBlock({ gmb, src, compact, monthLabelText }: { gmb: Gmb; src: (p: string) => string; compact: boolean; monthLabelText: string }) {
  const ins = gmb.insights;
  const h = compact ? 187 : 250;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Chip>Insights</Chip>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 8, paddingBottom: 4 }}>
          <span>Last Updated: {monthLabelText}</span>
          {ins.range ? <span style={{ border: '1px solid #333', borderRadius: 12, padding: '2px 10px' }}>{ins.range}</span> : null}
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ins.mode === 'image' ? (
          ins.images.length ? (
            ins.images.map((p, i) => <Shot key={i} src={src(p)} alt={`Insights ${i + 1}`} style={{ width: '100%', height: Math.floor((compact ? 580 : 820) / ins.images.length) - 10 }} />)
          ) : (
            <Placeholder label="Insights screenshot" style={{ height: compact ? 570 : 800 }} />
          )
        ) : (
          <>
            <AreaPanel
              title="Views"
              totalLabel="Total Views"
              height={h}
              labels={ins.views.map((r) => r.date)}
              series={[
                { name: 'Search - Desktop', color: INSIGHT_COLORS.green, values: ins.views.map((r) => r.sd) },
                { name: 'Search - Mobile', color: INSIGHT_COLORS.yellow, values: ins.views.map((r) => r.sm) },
                { name: 'Maps - Desktop', color: INSIGHT_COLORS.blue, values: ins.views.map((r) => r.md) },
                { name: 'Maps - Mobile', color: INSIGHT_COLORS.violet, values: ins.views.map((r) => r.mm) },
              ]}
            />
            <AreaPanel
              title="Actions"
              totalLabel="Total Actions"
              height={h}
              labels={ins.actions.map((r) => r.date)}
              series={[
                { name: 'Website clicks', color: INSIGHT_COLORS.green, values: ins.actions.map((r) => r.web) },
                { name: 'Request direction', color: INSIGHT_COLORS.yellow, values: ins.actions.map((r) => r.dir) },
                { name: 'Call you', color: INSIGHT_COLORS.blue, values: ins.actions.map((r) => r.call) },
              ]}
            />
            <CallsPanel calls={ins.calls} height={h} />
          </>
        )}
      </div>
    </div>
  );
}

function ReviewsPage({ n, gmb, src }: { n: number; gmb: Gmb; src: (p: string) => string }) {
  const r = gmb.reviews;
  return (
    <LetterPage n={n}>
      <Area top={115}>
        <Chip>Reviews</Chip>
        {r.mode === 'image' ? (
          r.image ? <Shot src={src(r.image)} alt="Reviews" style={{ marginTop: 14, width: 717, height: 760 }} /> : <Placeholder label="Reviews screenshot" style={{ marginTop: 14, height: 760 }} />
        ) : (
          <>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 28, fontSize: 15 }}>
              <span>
                Reviews&nbsp;&nbsp; {r.total}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Average Rating <Stars n={Math.round(r.rating)} size={16} />
              </span>
            </div>
            <div style={{ marginTop: 16, fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 20 }}>Last {Math.max(1, r.items.length)} Review(s)</div>
            <div style={{ marginTop: 8, width: 717, border: '1px solid #BDBDBD' }}>
              {r.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '106px 356px 125px 1fr', alignItems: 'start', padding: it.text.length > 120 ? '20px 0 22px' : '22px 0', borderTop: i ? '1px solid #BDBDBD' : undefined, minHeight: 88 }}>
                  <div style={{ paddingLeft: 36 }}>
                    <GoogleG />
                  </div>
                  <div style={{ fontSize: 15, lineHeight: '21px', paddingRight: 8 }}>
                    {it.text ? <div style={{ marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 9, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.text}</div> : null}
                    <div style={{ fontWeight: 700, marginTop: it.text ? 0 : 8 }}>Detected on: {it.date || '—'}</div>
                  </div>
                  <div>
                    <Stars n={it.stars} size={16} />
                  </div>
                  <div>
                    <a
                      href={it.url || undefined}
                      style={{ display: 'inline-block', background: '#7ED07E', border: '1.5px solid #2E7D32', borderRadius: 14, padding: '3px 9px', color: '#0B3D0B', fontSize: 13, textDecoration: 'none' }}
                    >
                      View Review
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Area>
    </LetterPage>
  );
}

function VideosPage({ n, gmb, src }: { n: number; gmb: Gmb; src: (p: string) => string }) {
  const v = gmb.videos;
  const imgs = v.images;
  const h = imgs.length > 1 ? 300 : 410;
  return (
    <LetterPage n={n}>
      <Bar>Business Story through Videos</Bar>
      <Area top={198} left={43} width={730}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {imgs.length ? imgs.map((p, i) => <Shot key={i} src={src(p)} alt={`Video ${i + 1}`} style={{ width: 730, height: h }} />) : <Placeholder label="Video thumbnail" style={{ height: 410 }} />}
        </div>
        {v.links.length ? <LinkBox title="Live View" links={v.links} style={{ marginTop: 46, marginLeft: 5, width: 726 }} /> : null}
      </Area>
    </LetterPage>
  );
}

function RankingsPage({ n, gmb, client, rows, first }: { n: number; gmb: Gmb; client: Client; rows: Gmb['rankings']['keywords']; first: boolean }) {
  const rk = gmb.rankings;
  const cell: React.CSSProperties = { padding: '10px 12px', borderTop: '1px solid #000', fontSize: 13.3, lineHeight: '18px' };
  return (
    <LetterPage n={n}>
      <Area top={144} left={46} width={727}>
        <div style={{ border: '1px solid #000' }}>
          {first ? (
            <div style={{ padding: '10px 6px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 16, background: '#CFF5D8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#0A9129" strokeWidth="1.3" aria-hidden>
                      <path d="M2 16V11h3v5zM7.5 16V7h3v9zM13 16V2h3v14z" />
                    </svg>
                  </span>
                  <span style={{ color: '#0074BE', fontWeight: 700, fontSize: 17.3 }}>Rankings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 40, fontSize: 9.5 }}>
                  <span>Status:</span>
                  <span style={{ display: 'inline-flex', width: 120, height: 24, borderRadius: 4, overflow: 'hidden' }}>
                    <span style={{ flex: 1, background: '#CFF5D8' }} />
                    <span style={{ flex: 1, background: rk.status === 'ok' ? '#0A9129' : '#CE6C01' }} />
                  </span>
                </div>
              </div>
              <ul style={{ margin: '12px 0 0', paddingLeft: 52, fontSize: 13.3, lineHeight: '18px', listStyle: "'➢  '" }}>
                <li>This section reports the positions {rk.showRanks ? '(rankings) ' : ''}that your Google Business Profile appears in for your important keywords.</li>
                <li>We report on your {rk.showRanks ? 'rankings' : 'target keywords'} in Google (Maps).</li>
              </ul>
            </div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: rk.showRanks ? '1fr 1fr' : '1fr', fontSize: 9.5, textAlign: 'center', color: '#444' }}>
            <div style={{ borderTop: first ? '1px solid #000' : undefined, padding: '3px 0' }}>
              <span style={{ color: '#E53935' }}>●</span> {rk.location || client.locality}
            </div>
            {rk.showRanks ? <div style={{ borderTop: first ? '1px solid #000' : undefined, borderLeft: '1px solid #000', padding: '3px 0' }}>Google Maps</div> : null}
            <div style={{ borderTop: '1px solid #000', padding: '3px 0' }}>Keyword</div>
            {rk.showRanks ? <div style={{ borderTop: '1px solid #000', borderLeft: '1px solid #000', padding: '3px 0' }}>Current Ranking</div> : null}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: rk.showRanks ? '1fr 1fr' : '1fr' }}>
            {rows.map((k, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <div style={cell}>{k.keyword}</div>
                {rk.showRanks ? <div style={{ ...cell, borderLeft: '1px solid #000', textAlign: 'center' }}>{k.rank || '—'}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </Area>
    </LetterPage>
  );
}

function GridPage({ n, title, images, src, label }: { n: number; title: string; images: string[]; src: (p: string) => string; label: string }) {
  return (
    <LetterPage n={n}>
      <Bar>{title}</Bar>
      <div style={{ position: 'absolute', left: 38, top: 193, width: 743, display: 'grid', gridTemplateColumns: '340px 340px', columnGap: 63, rowGap: 38 }}>
        {images.map((p, i) => (
          <Shot key={i} src={src(p)} alt={`${label} ${i + 1}`} style={{ width: 340, height: 330 }} fit="contain" />
        ))}
      </div>
    </LetterPage>
  );
}

type LinkRow = { kind: 'head' } | { kind: 'client' } | { kind: 'gap' } | { kind: 'group'; title: string } | { kind: 'link'; url: string };
const rowH = (r: LinkRow) => (r.kind === 'head' ? 46 : r.kind === 'client' ? 75 : r.kind === 'gap' ? 40 : r.kind === 'group' ? 46 : r.url.length > 96 ? 80 : 54);

function LinksPage({ n, rows, client, first }: { n: number; rows: LinkRow[]; client: Client; first: boolean }) {
  return (
    <LetterPage n={n}>
      <Area top={first ? 93 : 114} left={42} width={715}>
        <div style={{ border: '1px solid #000' }}>
          {rows.map((r, i) => {
            const bt = i ? '1px solid #000' : undefined;
            if (r.kind === 'head') return <div key={i} style={{ height: 46, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 18.7, borderTop: bt }}>Local SEO Working Report For</div>;
            if (r.kind === 'client') return <div key={i} style={{ height: 75, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 36, borderTop: bt, textAlign: 'center' }}>{client.name}</div>;
            if (r.kind === 'gap') return <div key={i} style={{ height: 40, borderTop: bt }} />;
            if (r.kind === 'group') return <div key={i} style={{ height: 46, background: GRAD, display: 'flex', alignItems: 'center', padding: '0 7px', fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 18.7, borderTop: bt }}>{r.title}</div>;
            return (
              <div key={i} style={{ minHeight: rowH(r), display: 'flex', alignItems: 'center', padding: '6px 7px', borderTop: bt, wordBreak: 'break-all', lineHeight: '27px' }}>
                <a href={r.url} style={{ color: LINK_COLOR, fontSize: 14.7, textDecoration: 'none', fontFamily: "'Lato', " + BODY_FONT }}>
                  {r.url}
                </a>
              </div>
            );
          })}
        </div>
      </Area>
    </LetterPage>
  );
}

function QuoraPage({ n, gmb, src }: { n: number; gmb: Gmb; src: (p: string) => string }) {
  const q = gmb.quora;
  const imgs = q.images;
  const h = imgs.length === 1 ? 560 : imgs.length === 2 ? 300 : 200;
  return (
    <LetterPage n={n}>
      <Bar>Quora</Bar>
      <Area top={187} left={43} width={730}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {imgs.length ? imgs.map((p, i) => <Shot key={i} src={src(p)} alt={`Quora ${i + 1}`} style={{ width: 730, height: h }} />) : <Placeholder label="Quora profile screenshot" style={{ height: 560 }} />}
        </div>
        {q.link ? <LinkBox title="Live View" links={[q.link]} label={() => q.linkLabel || q.link} style={{ marginTop: 30, width: 726, marginLeft: 1 }} /> : null}
      </Area>
    </LetterPage>
  );
}

function AiPage({ n, slug }: { n: number; slug: (typeof SECTIONS)[number]['slug'] }) {
  // The AI page is a 960x1240 sheet; scale it into the content area under the logo.
  const scale = Math.min(736 / SHEET_W, 880 / SHEET_H);
  const w = SHEET_W * scale;
  return (
    <LetterPage n={n}>
      <div style={{ position: 'absolute', top: 104, left: (PAGE_W - w) / 2, width: w, height: SHEET_H * scale, overflow: 'hidden' }}>
        <div style={{ width: SHEET_W, height: SHEET_H, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
          <ReportDocument section={slug} />
        </div>
      </div>
    </LetterPage>
  );
}

/* ------------------------------------------------------------------ */
/* Assemble                                                            */
/* ------------------------------------------------------------------ */

/** Turn a month's data into the ordered list of report pages (empty sections are skipped). */
export function buildReport({ client, month, note, src: srcIn, placeholders = false }: BuildInput, opts: { monthLabelText: string; hasAiData: boolean }): BuiltReport {
  SHOW_PLACEHOLDERS = placeholders;
  const gmb = month.gmb;
  const on = gmb.sections;
  const src = srcIn ?? mediaUrl;
  const toc: string[] = [];
  const warnings: string[] = [];
  const body: PageSpec[] = [];

  if (on.note) {
    if (note && (note.body.trim() || note.image_path)) body.push({ key: 'note', render: (n) => <NotePage n={n} note={note} src={src} /> });
    else warnings.push('Google update note is on, but there is no note for this month yet (Admin → Google updates). It was left out.');
  }

  if (on.summary || on.insights) {
    const both = on.summary && on.insights;
    if (on.summary) toc.push('Summary');
    if (on.insights) toc.push('Insights');
    if (on.insights && gmb.insights.mode === 'data' && !gmb.insights.views.length && !gmb.insights.actions.length && !gmb.insights.calls.some(Boolean)) warnings.push('Insights has no data yet. Paste Views / Actions rows or switch to a screenshot.');
    body.push({
      key: 'summary',
      render: (n) => (
        <LetterPage n={n}>
          <Area top={102} left={35} width={746}>
            {on.summary ? <SummaryBlock client={client} gmb={gmb} /> : null}
            {on.insights ? (
              <div style={{ marginTop: on.summary ? 12 : 0 }}>
                <InsightsBlock gmb={gmb} src={src} compact={both} monthLabelText={opts.monthLabelText} />
              </div>
            ) : null}
          </Area>
        </LetterPage>
      ),
    });
  }

  if (on.reviews) {
    const empty = gmb.reviews.mode === 'data' ? !gmb.reviews.items.length && !gmb.reviews.total : !gmb.reviews.image;
    if (empty && !placeholders) warnings.push('Reviews is on but empty. Add reviews or upload a screenshot. It was left out.');
    else {
      toc.push('Reviews');
      body.push({ key: 'reviews', render: (n) => <ReviewsPage n={n} gmb={gmb} src={src} /> });
    }
  }

  if (on.videos) {
    if (!gmb.videos.images.length && !gmb.videos.links.length && !placeholders) warnings.push('Business Videos is on but has no screenshot or link. It was left out.');
    else {
      toc.push('Business Videos');
      body.push({ key: 'videos', render: (n) => <VideosPage n={n} gmb={gmb} src={src} /> });
    }
  }

  if (on.rankings) {
    const kws = gmb.rankings.keywords.filter((k) => k.keyword.trim());
    if (!kws.length) warnings.push('Rankings is on but has no keywords. It was left out.');
    else {
      toc.push('Rankings');
      const [firstRows, ...rest] = [kws.slice(0, 18), ...chunk(kws.slice(18), 22)];
      body.push({ key: 'rankings-0', render: (n) => <RankingsPage n={n} gmb={gmb} client={client} rows={firstRows!} first /> });
      rest.forEach((rows, i) => body.push({ key: `rankings-${i + 1}`, render: (n) => <RankingsPage n={n} gmb={gmb} client={client} rows={rows} first={false} /> }));
    }
  }

  if (on.posting) {
    if (!gmb.posting.images.length) warnings.push('GMB Posting is on but has no screenshots. It was left out.');
    else {
      toc.push('Posting');
      chunk(gmb.posting.images, 4).forEach((imgs, i) => body.push({ key: `posting-${i}`, render: (n) => <GridPage n={n} title="GMB Posting" images={imgs} src={src} label="GMB post" /> }));
    }
  }

  if (on.localSeo) {
    const groups = gmb.localSeo.groups.map((g) => ({ ...g, links: g.links.map((l) => l.trim()).filter(Boolean) })).filter((g) => g.links.length);
    if (!groups.length) warnings.push('Local SEO Working is on but has no links. It was left out.');
    else {
      toc.push('Local SEO Working');
      const rows: LinkRow[] = [{ kind: 'head' }, { kind: 'client' }, { kind: 'gap' }];
      groups.forEach((g, gi) => {
        rows.push({ kind: 'group', title: g.title });
        g.links.forEach((url) => rows.push({ kind: 'link', url }));
        if (gi < groups.length - 1) rows.push({ kind: 'gap' });
      });
      const pages: LinkRow[][] = [];
      let cur: LinkRow[] = [];
      let h = 0;
      const cap = (first: boolean) => (first ? 880 : 860);
      for (const r of rows) {
        // Keep a group header with at least its first link.
        const need = rowH(r) + (r.kind === 'group' ? 54 : 0);
        if (cur.length && h + need > cap(pages.length === 0)) {
          pages.push(cur);
          cur = [];
          h = 0;
          if (r.kind === 'gap') continue;
        }
        cur.push(r);
        h += rowH(r);
      }
      if (cur.length) pages.push(cur);
      pages.forEach((p, i) => body.push({ key: `links-${i}`, render: (n) => <LinksPage n={n} rows={p} client={client} first={i === 0} /> }));
    }
  }

  if (on.backlinks) {
    if (!gmb.backlinks.images.length) warnings.push('Local Backlink Acquisitions is on but has no screenshots. It was left out.');
    else {
      toc.push('Local Backlink Acquisitions');
      chunk(gmb.backlinks.images, 4).forEach((imgs, i) => body.push({ key: `backlinks-${i}`, render: (n) => <GridPage n={n} title="Local Backlink Acquisitions" images={imgs} src={src} label="Backlink" /> }));
    }
  }

  if (on.quora) {
    if (!gmb.quora.images.length && !gmb.quora.link && !placeholders) warnings.push('Quora is on but has no screenshot or link. It was left out.');
    else {
      toc.push('Quora');
      body.push({ key: 'quora', render: (n) => <QuoraPage n={n} gmb={gmb} src={src} /> });
    }
  }

  if (on.ai) {
    if (!opts.hasAiData) warnings.push('AI Optimization is on, but the AI numbers for this month are all zero.');
    toc.push('AI Optimization');
    SECTIONS.forEach((s) => body.push({ key: `ai-${s.slug}`, render: (n) => <AiPage n={n} slug={s.slug} /> }));
  }

  toc.push('Thank You');
  const pages: PageSpec[] = [{ key: 'cover', render: () => <CoverPage client={client} gmb={gmb} toc={toc} /> }, ...body, { key: 'thanks', render: () => <ThanksPage /> }];
  return { pages, toc, warnings };
}

