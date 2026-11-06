import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { sizeOf, type SectionSlug } from '@/lib/constants';
import { nodeToBlob, setCapturing, waitForStableLayout } from '@/lib/export';
import { SummaryPage } from './pages/SummaryPage';
import { SignalsPage } from './pages/SignalsPage';
import { CommunityPage } from './pages/CommunityPage';
import { GbpSummaryBlock } from './GbpSummary';

/** One capturable tab: a fixed-size AI page, or the GBP Summary block. */
export function ReportDocument({ section, id }: { section: SectionSlug; id?: string; animate?: boolean }) {
  const { w, h } = sizeOf(section);
  return (
    <div id={id} className="bg-white" style={{ width: w, height: h }}>
      {section === 'gbp' ? <GbpSummaryBlock /> : section === 'signals' ? <SignalsPage /> : section === 'community' ? <CommunityPage /> : <SummaryPage />}
    </div>
  );
}

interface Job {
  sections: SectionSlug[];
  ratio: number;
  resolve: (b: Blob[]) => void;
  reject: (e: unknown) => void;
}

/**
 * Renders the requested pages offscreen at their fixed size and captures each as a PNG.
 * Must be used inside a ReportProvider; render `stage` somewhere.
 */
export function useSectionCapture() {
  const [job, setJob] = useState<Job | null>(null);
  const refs = useRef<Partial<Record<SectionSlug, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (!job) return;
    let cancelled = false;
    (async () => {
      try {
        await waitForStableLayout();
        await new Promise((r) => setTimeout(r, 60));
        const out: Blob[] = [];
        for (const s of job.sections) {
          const node = refs.current[s];
          if (!node) throw new Error(`Page ${s} did not render`);
          out.push(await nodeToBlob(node, job.ratio, sizeOf(s)));
          if (cancelled) return;
        }
        job.resolve(out);
      } catch (e) {
        job.reject(e);
      } finally {
        setCapturing(false);
        setJob(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [job]);

  const capture = useCallback((sections: SectionSlug[], ratio = 3) => {
    setCapturing(true);
    return new Promise<Blob[]>((resolve, reject) => setJob({ sections, ratio, resolve, reject }));
  }, []);

  const stage = job
    ? createPortal(
        <div aria-hidden="true" style={{ position: 'fixed', left: -100_000, top: 0, pointerEvents: 'none', zIndex: -1 }}>
          {job.sections.map((s) => (
            <div
              key={s}
              ref={(el) => {
                refs.current[s] = el;
              }}
              style={{ width: sizeOf(s).w, height: sizeOf(s).h }}
            >
              <ReportDocument section={s} />
            </div>
          ))}
        </div>,
        document.body,
      )
    : null;

  return { capture, stage, busy: job !== null };
}
