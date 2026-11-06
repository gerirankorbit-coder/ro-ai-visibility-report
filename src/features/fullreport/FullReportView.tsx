import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, useToast } from '@/components/ui';
import { downloadBlob, pagesToPdf, setCapturing, waitForStableLayout } from '@/lib/export';
import { clientSlug, monthKey, monthLabel } from '@/lib/format';
import { aiReadiness } from '@/lib/metrics';
import type { Note } from '@/types/gmb';
import { useReport } from '@/features/report/ReportContext';
import { buildReport } from './pages';
import { PAGE_H, PAGE_W } from './layout';

/** Scaled, stacked preview of every page plus the one-click PDF export. Must be inside a ReportProvider. */
export function FullReportView({ note, src, toolbarExtra, placeholders = false }: { note: Note | null; src?: (p: string) => string; toolbarExtra?: React.ReactNode; placeholders?: boolean }) {
  const { report, current, currentKey } = useReport();
  const toast = useToast();
  const built = useMemo(
    () => buildReport({ client: report.client, month: current, note, src, placeholders }, { monthLabelText: monthLabel(currentKey), hasAiData: aiReadiness(current) > 0 }),
    [report.client, current, note, src, currentKey, placeholders],
  );
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState<{ done: number; total: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 2) / PAGE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const exportPdf = async () => {
    setExporting({ done: 0, total: built.pages.length });
    setCapturing(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      await waitForStableLayout();
      const imgs = Array.from(stageRef.current?.querySelectorAll('img') ?? []);
      await Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => ((i.onload = r), (i.onerror = r))))));
      const nodes = Array.from(stageRef.current?.querySelectorAll<HTMLElement>(':scope > div > .letter-page') ?? []);
      const pdf = await pagesToPdf(nodes, (done, total) => setExporting({ done, total }));
      downloadBlob(pdf, `${clientSlug(report.client.name)}_report_${monthKey(current.period)}.pdf`);
      toast(`PDF ready: ${nodes.length} pages`);
    } catch (e) {
      console.warn('PDF export failed', e);
      toast('PDF export failed. Please try again.');
    } finally {
      setCapturing(false);
      setExporting(null);
    }
  };

  return (
    <div>
      <div className="no-capture sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-2.5">
          <div className="text-[12.5px]">
            <b>{built.pages.length} pages</b> · {built.toc.filter((t) => t !== 'Thank You').join(' · ')}
          </div>
          <div className="flex items-center gap-3">
            {toolbarExtra}
            <Button size="sm" arrow="none" onClick={exportPdf} disabled={exporting !== null}>
              {exporting ? `Building PDF ${exporting.done}/${exporting.total}…` : 'Download full report (PDF)'}
            </Button>
          </div>
        </div>
      </div>
      {built.warnings.length ? (
        <div className="no-capture mx-auto mt-4 max-w-[1100px] px-5">
          <ul className="border-l-[3px] border-warn bg-white px-4 py-3 text-[12px] leading-relaxed text-ink">
            {built.warnings.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div ref={wrap} className="mx-auto flex max-w-[860px] flex-col items-center gap-6 px-4 py-6">
        {built.pages.map((p, i) => (
          <div key={p.key} style={{ width: PAGE_W * scale, height: PAGE_H * scale }} className="border border-line bg-white">
            <div style={{ width: PAGE_W, height: PAGE_H, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: '0 0' }}>{p.render(i + 1)}</div>
          </div>
        ))}
      </div>
      {exporting
        ? createPortal(
            <div ref={stageRef} aria-hidden="true" style={{ position: 'fixed', left: -100_000, top: 0, width: PAGE_W, pointerEvents: 'none', zIndex: -1 }}>
              {built.pages.map((p, i) => (
                <div key={p.key} style={{ width: PAGE_W, height: PAGE_H }}>
                  {p.render(i + 1)}
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
