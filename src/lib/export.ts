/**
 * HD screenshot + PDF export.
 *
 * Captures are always rendered at a fixed 1440px layout width (see CaptureStage),
 * so every PNG is 1440 × pixelRatio wide (4320px at 3×) regardless of viewport.
 */
import { T } from './tokens';
import { clientSlug } from './format';

export const CAPTURE_WIDTH = 1440;

let fontCssCache: Promise<string> | null = null;

const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** Toggle capture mode: disables motion, hides tooltips/hover-only UI, shows capture-only header. */
export function setCapturing(on: boolean) {
  if (on) document.documentElement.setAttribute('data-capturing', 'true');
  else document.documentElement.removeAttribute('data-capturing');
}

export async function waitForStableLayout() {
  await document.fonts.ready;
  await raf();
  await raf();
}

const skip = (node: HTMLElement) => {
  const cl = node.classList;
  if (!cl) return true;
  return !(cl.contains('chart-tip') || cl.contains('no-capture') || cl.contains('sr-only-table'));
};

/** Max canvas area Safari/iOS allows (~16.7M px). Chromium/Firefox allow far more. */
function maxCanvasArea(): number {
  const ua = navigator.userAgent;
  const isSafari = /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua);
  return isSafari ? 16_700_000 : 260_000_000;
}

export async function nodeToBlob(node: HTMLElement, pixelRatio = 3): Promise<Blob> {
  const { toBlob, getFontEmbedCSS } = await import('html-to-image');
  const height = Math.ceil(node.scrollHeight);
  let ratio = pixelRatio;
  while (ratio > 1 && (CAPTURE_WIDTH * ratio * height * ratio > maxCanvasArea() || height * ratio > 32_000)) ratio -= 0.5;
  if (!fontCssCache) fontCssCache = getFontEmbedCSS(node).catch(() => '');
  const fontEmbedCSS = await fontCssCache;
  const blob = await toBlob(node, {
    pixelRatio: ratio,
    cacheBust: true,
    backgroundColor: T.paper,
    width: CAPTURE_WIDTH,
    height,
    canvasWidth: CAPTURE_WIDTH,
    canvasHeight: height,
    style: { width: `${CAPTURE_WIDTH}px`, margin: '0', transform: 'none' },
    fontEmbedCSS: fontEmbedCSS || undefined,
    filter: skip,
    preferredFontFormat: 'woff2',
    // We size the canvas ourselves (above); never let the library shrink it.
    skipAutoScale: true,
  });
  if (!blob) throw new Error('The browser returned an empty image.');
  return blob;
}

export function exportFileName(clientName: string, sectionFile: string, key: string, ext = 'png') {
  return `${clientSlug(clientName)}_${sectionFile}_${key}.${ext}`;
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Copy a PNG to the clipboard. Resolves false when the browser does not allow it. */
export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    if (!('clipboard' in navigator) || typeof ClipboardItem === 'undefined') return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

async function imageSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = rej;
    img.src = url;
  });
}

/** Combine section PNGs into a PDF: one page per section, page height fit to content. */
export async function blobsToPdf(blobs: Blob[], pixelRatio: number): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  let doc: InstanceType<typeof jsPDF> | null = null;
  for (const b of blobs) {
    const url = await blobToDataUrl(b);
    const { w, h } = await imageSize(url);
    // 1 CSS px = 0.75pt; images are pixelRatio× CSS size.
    const pw = (w / pixelRatio) * 0.75;
    const ph = (h / pixelRatio) * 0.75;
    const orientation = pw > ph ? 'landscape' : 'portrait';
    if (!doc) doc = new jsPDF({ unit: 'pt', format: [pw, ph], orientation, compress: true });
    else doc.addPage([pw, ph], orientation);
    doc.addImage(url, 'PNG', 0, 0, pw, ph, undefined, 'FAST');
  }
  if (!doc) throw new Error('Nothing to export');
  return doc.output('blob');
}
