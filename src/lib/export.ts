/**
 * HD screenshot + PDF export.
 *
 * Each report page is rendered offscreen at its fixed size (960 x 1240 CSS px) and captured at
 * pixelRatio 3, so every PNG is 2880 x 3720 regardless of the viewport: sharp when placed at
 * 6.5in wide in Word (~440 dpi).
 */
import { T } from './tokens';
import { clientSlug } from './format';
import { SHEET_H, SHEET_W } from './constants';

export const CAPTURE_WIDTH = SHEET_W;

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
  const height = SHEET_H;
  let ratio = pixelRatio;
  while (ratio > 1 && (CAPTURE_WIDTH * ratio * height * ratio > maxCanvasArea() || height * ratio > 32_000)) ratio -= 0.5;
  if (!fontCssCache) fontCssCache = getFontEmbedCSS(node).catch(() => '');
  const fontEmbedCSS = await fontCssCache;
  const blob = await toBlob(node, {
    pixelRatio: ratio,
    cacheBust: true,
    backgroundColor: T.white,
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

/**
 * Combine page PNGs into a Letter-size PDF laid out like the Word report: each page image is
 * 6.5in wide with 1in side margins.
 */
export async function blobsToPdf(blobs: Blob[]): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait', compress: true });
  const w = 6.5 * 72;
  const h = (w * SHEET_H) / SHEET_W;
  const x = 72;
  const y = (792 - h) / 2;
  for (let i = 0; i < blobs.length; i++) {
    if (i > 0) doc.addPage('letter', 'portrait');
    doc.addImage(await blobToDataUrl(blobs[i]!), 'PNG', x, y, w, h, undefined, 'FAST');
  }
  if (!blobs.length) throw new Error('Nothing to export');
  return doc.output('blob');
}
