/**
 * Letter-size page building blocks that reproduce the Rank Orbit Word report.
 * Measurements are in CSS px at 96 dpi (1in = 96px), taken from the sample report.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const PAGE_W = 816;
export const PAGE_H = 1056;
/** Content box used by most pages (Word: 1in page, content from x=40 to x=776). */
export const CONTENT_X = 40;
export const CONTENT_W = 736;

export const GRAD = 'linear-gradient(90deg, #30FEFE 0%, #B227FF 100%)';
export const BODY_FONT = "'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', 'Segoe UI', 'Montserrat Variable', sans-serif";
export const HEAD_FONT = "'Montserrat Variable', Montserrat, 'Segoe UI', sans-serif";
export const LINK_COLOR = '#1155CC';

/** "RANK ORBIT" wordmark. `light` turns the black letters white for dark pages. */
export function Logo({ light = false, style }: { light?: boolean; style?: CSSProperties }) {
  return (
    <img
      src="/brand/logo.png"
      alt="Rank Orbit"
      width={255}
      height={26}
      style={{ display: 'block', width: 255, height: 'auto', ...(light ? { filter: 'invert(1) hue-rotate(180deg)' } : null), ...style }}
    />
  );
}

/** Gradient corner triangles (top-right with page number, bottom-left), as in the Word header/footer. */
function Corners({ n }: { n?: number }) {
  return (
    <>
      <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, width: 140, height: 160 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg, #B227FF 10%, #7FB8FF 55%, #30FEFE 85%)', clipPath: 'polygon(30% 0, 100% 0, 100% 72%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg, rgba(178,39,255,.35), rgba(48,254,254,.25))', clipPath: 'polygon(12% 0, 30% 0, 100% 72%, 100% 84%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg, rgba(178,39,255,.18), rgba(48,254,254,.12))', clipPath: 'polygon(0 0, 12% 0, 100% 84%, 100% 100%)' }} />
      </div>
      {n ? (
        <div style={{ position: 'absolute', right: 20, top: 21, fontFamily: HEAD_FONT, fontSize: 14, color: '#0A0A0A' }} className="num">
          {n}
        </div>
      ) : null}
      <div aria-hidden style={{ position: 'absolute', left: 0, bottom: 0, width: 96, height: 100 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #30FEFE 0%, #7FB8FF 45%, #B227FF 95%)', clipPath: 'polygon(0 0, 0 100%, 72% 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(48,254,254,.25), rgba(178,39,255,.3))', clipPath: 'polygon(0 0, 72% 100%, 88% 100%)' }} />
      </div>
    </>
  );
}

/** A standard white report page: logo header, corners, page number and rankorbit.com footer. */
export function LetterPage({ n, children, className }: { n?: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn('letter-page relative overflow-hidden bg-white', className)} style={{ width: PAGE_W, height: PAGE_H, fontFamily: BODY_FONT, color: '#0A0A0A' }}>
      <Corners n={n} />
      <div style={{ position: 'absolute', left: 40, top: 31 }}>
        <Logo />
      </div>
      {children}
      <a href="https://rankorbit.com" style={{ position: 'absolute', right: 43, bottom: 32, fontFamily: BODY_FONT, fontSize: 13, fontStyle: 'italic', color: LINK_COLOR, textDecoration: 'underline' }}>
        rankorbit.com
      </a>
    </div>
  );
}

/** Absolutely positioned content area below the logo. */
export function Area({ top = 115, left = CONTENT_X, width = CONTENT_W, children, style }: { top?: number; left?: number; width?: number; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', top, left, width, ...style }}>{children}</div>;
}

/** Gradient label chip ("Summary", "Reviews", "Note"): Montserrat ExtraBold 14pt. */
export function Chip({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', height: 43, padding: '0 12px', background: GRAD, fontFamily: HEAD_FONT, fontWeight: 800, fontSize: 18.7, color: '#000', ...style }}>
      {children}
    </div>
  );
}

/** Full-width gradient title bar ("GMB Posting", "Quora"): Montserrat ExtraBold 18pt, centered. */
export function Bar({ children, top = 116 }: { children: ReactNode; top?: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: 43, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD_FONT, fontWeight: 800, fontSize: 24, color: '#000' }}>
      {children}
    </div>
  );
}

/** Screenshot with the soft drop shadow used in the Word report. */
export function Shot({ src, alt, style, fit = 'contain' }: { src: string; alt: string; style?: CSSProperties; fit?: 'contain' | 'cover' }) {
  return (
    <div style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.35)', overflow: 'hidden', ...style }}>
      <img src={src} alt={alt} crossOrigin="anonymous" style={{ display: 'block', width: '100%', height: '100%', objectFit: fit, imageRendering: 'auto' }} />
    </div>
  );
}

/** "Live View" style table: gradient header row + link rows with black borders. */
export function LinkBox({ title, links, label, style, bold = true }: { title: string; links: string[]; label?: (url: string) => string; style?: CSSProperties; bold?: boolean }) {
  return (
    <div style={{ border: '1px solid #000', ...style }}>
      <div style={{ background: GRAD, borderBottom: '1px solid #000', height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD_FONT, fontSize: 18.7, color: '#000' }}>{title}</div>
      {links.map((u, i) => (
        <div key={i} style={{ padding: '10px 6px', borderTop: i ? '1px solid #000' : undefined, lineHeight: '27px', wordBreak: 'break-all' }}>
          <a href={u} style={{ color: LINK_COLOR, fontWeight: bold ? 700 : 400, fontSize: 14.7, textDecoration: 'none' }}>
            {label ? label(u) : u}
          </a>
        </div>
      ))}
    </div>
  );
}

/** Black cover / closing page backdrop: spotlight, wireframe and city skyline. */
export function DarkPage({ children, wireframe = 'cover' }: { children: ReactNode; wireframe?: 'cover' | 'thanks' }) {
  // Positions, sizes and rotations taken from the Word document's drawing anchors.
  const cover = wireframe === 'cover';
  return (
    <div className="letter-page relative overflow-hidden" style={{ width: PAGE_W, height: PAGE_H, background: '#000', color: '#fff', fontFamily: BODY_FONT }}>
      <img src="/brand/spotlight.jpg" alt="" aria-hidden style={{ position: 'absolute', left: -46, top: cover ? -18 : -23, width: cover ? 917 : 861, height: cover ? 754 : 757 }} />
      {/* City skyline; the Word cover crops the top 12.5% of the photo (srcRect t=12554). */}
      <div aria-hidden style={{ position: 'absolute', left: 0, top: cover ? 735 : 744, width: PAGE_W, height: cover ? 395 : 450, overflow: 'hidden' }}>
        <img src="/brand/city.jpg" alt="" style={{ position: 'absolute', left: 0, top: cover ? -57 : 0, width: PAGE_W, height: cover ? 452 : 450, objectFit: 'cover' }} />
      </div>
      {cover ? (
        <img src="/brand/wireframe.png" alt="" aria-hidden style={{ position: 'absolute', left: WF.cover.x, top: WF.cover.y, width: 782, height: 542, transform: 'rotate(120.88deg)' }} />
      ) : (
        <img src="/brand/wireframe-thanks.png" alt="" aria-hidden style={{ position: 'absolute', left: WF.thanks.x, top: WF.thanks.y, width: 787, height: 546, transform: 'rotate(162.5deg)' }} />
      )}
      {children}
    </div>
  );
}

/** Top-left of the (unrotated) wireframe boxes; rotation is around their centre. */
const WF = { cover: { x: 260, y: 218 }, thanks: { x: 110, y: 273 } };
