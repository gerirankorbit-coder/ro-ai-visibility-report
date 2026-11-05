import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SectionSlug } from '@/lib/constants';
import { CAPTURE_WIDTH, nodeToBlob, setCapturing, waitForStableLayout } from '@/lib/export';
import { CaptureHeader, ReportFooter, ReportHeader } from './Frame';
import { useReport } from './ReportContext';
import { OverviewSection } from './sections/Overview';
import { SignalsSection } from './sections/Signals';
import { CommunitySection } from './sections/Community';
import { ProgressSection } from './sections/Progress';
import { ProfileSection } from './sections/Profile';

export function SectionBody({ section }: { section: SectionSlug }) {
  switch (section) {
    case 'signals':
      return <SignalsSection />;
    case 'community':
      return <CommunitySection />;
    case 'progress':
      return <ProgressSection />;
    case 'profile':
      return <ProfileSection />;
    default:
      return <OverviewSection />;
  }
}

/** The capturable report frame: capture header, report header, section body, footer. */
export function ReportDocument({ section, id, animate = true }: { section: SectionSlug; id?: string; animate?: boolean }) {
  const { currentKey } = useReport();
  return (
    <div id={id} className="@container bg-paper text-ink">
      <CaptureHeader section={section} />
      <ReportHeader />
      <div key={`${section}-${currentKey}`} className={animate ? 'enter' : undefined}>
        <SectionBody section={section} />
      </div>
      <ReportFooter />
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
 * Renders the requested sections offscreen at a fixed 1440px width and captures
 * each as a PNG. Must be used inside a ReportProvider; render `stage` somewhere.
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
          if (!node) throw new Error(`Section ${s} did not render`);
          out.push(await nodeToBlob(node, job.ratio));
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
        <div aria-hidden="true" style={{ position: 'fixed', left: -100_000, top: 0, width: CAPTURE_WIDTH, pointerEvents: 'none', zIndex: -1 }}>
          {job.sections.map((s) => (
            <div
              key={s}
              ref={(el) => {
                refs.current[s] = el;
              }}
              style={{ width: CAPTURE_WIDTH }}
            >
              <ReportDocument section={s} animate={false} />
            </div>
          ))}
        </div>,
        document.body,
      )
    : null;

  return { capture, stage, busy: job !== null };
}
