import { useEffect, useRef, useState } from 'react';
import { UnderlineTabs } from '@/components/ui';
import { SECTIONS, SHEET_W, type SectionSlug } from '@/lib/constants';
import { monthKey } from '@/lib/format';
import { ReportProvider } from '@/features/report/ReportContext';
import { ReportDocument } from '@/features/report/ReportDocument';
import type { Client, Month } from '@/types/schema';

/** Right-hand live preview: the client report at 1440px layout, scaled to the pane. */
export function LivePreview({ client, months, current }: { client: Client; months: Month[]; current: Month }) {
  const [section, setSection] = useState<SectionSlug>('summary');
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [h, setH] = useState(0);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (outer.current) setScale(outer.current.clientWidth / SHEET_W);
      if (inner.current) setH(inner.current.offsetHeight);
    });
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);

  const report = { client: { ...client, logo_url: null }, months };
  return (
    <aside aria-label="Live preview" className="flex h-full flex-col border border-line bg-white">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="flex items-center gap-2 text-[11px] font-medium">
          <span className="inline-block h-[6px] w-[6px] bg-accent" aria-hidden />
          Live preview
        </span>
        <UnderlineTabs label="Preview section" value={section} onChange={setSection} items={SECTIONS.map((s) => ({ value: s.slug, title: s.nav }))} className="!gap-4" />
      </div>
      <div ref={outer} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ height: h * scale }}>
          <div ref={inner} style={{ width: SHEET_W, transform: `scale(${scale})`, transformOrigin: '0 0', pointerEvents: 'none' }} {...{ inert: '' }} aria-hidden="true">
            <ReportProvider report={report} basePath="#" mode="preview" monthOverride={monthKey(current.period)}>
              <ReportDocument section={section} />
            </ReportProvider>
          </div>
        </div>
      </div>
    </aside>
  );
}
