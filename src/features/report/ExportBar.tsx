import { useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { SECTIONS, sectionBySlug, type SectionSlug } from '@/lib/constants';
import { blobsToPdf, downloadBlob, exportFileName } from '@/lib/export';
import { useReport } from './ReportContext';
import { useSectionCapture } from './ReportDocument';

/**
 * Export actions for the report pages. "Copy page" puts the current page on the clipboard as a
 * PNG, ready to paste straight into the Word report.
 */
export function ExportBar({ section }: { section: SectionSlug }) {
  const { report, currentKey } = useReport();
  const { capture, stage, busy } = useSectionCapture();
  const toast = useToast();
  const [working, setWorking] = useState<string | null>(null);
  const name = (s: SectionSlug, ext = 'png') => exportFileName(report.client.name, sectionBySlug(s).file, currentKey, ext);
  const isBusy = busy || working !== null;

  const run = async (label: string, fn: () => Promise<void>) => {
    setWorking(label);
    try {
      await fn();
    } catch (e) {
      console.warn(`${label} failed`, e);
      toast(`${label} failed. Please try again.`);
    } finally {
      setWorking(null);
    }
  };

  const copy = () => {
    // The ClipboardItem must be created inside the click handler; the image itself can follow.
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      toast('This browser cannot copy images. Use Download PNG instead.');
      return;
    }
    const png = capture([section], 3).then(([b]) => {
      if (!b) throw new Error('No image');
      return b;
    });
    setWorking('Copy');
    navigator.clipboard
      .write([new ClipboardItem({ 'image/png': png })])
      .then(() => toast('Page copied. Paste it into Word with Ctrl+V.'))
      .catch((e) => {
        console.warn('Copy failed', e);
        toast('Copy was blocked by the browser. Use Download PNG instead.');
      })
      .finally(() => setWorking(null));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={copy} disabled={isBusy} arrow="none" aria-label={`Copy ${sectionBySlug(section).title} as an image`}>
        {working === 'Copy' ? 'Copying…' : 'Copy page'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        arrow="none"
        disabled={isBusy}
        onClick={() =>
          run('Download', async () => {
            const [b] = await capture([section], 3);
            if (b) downloadBlob(b, name(section));
          })
        }
      >
        {working === 'Download' ? 'Saving…' : 'Download PNG'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        arrow="none"
        disabled={isBusy}
        onClick={() =>
          run('All pages', async () => {
            const slugs = SECTIONS.map((s) => s.slug);
            const blobs = await capture(slugs, 3);
            blobs.forEach((b, i) => window.setTimeout(() => downloadBlob(b, name(slugs[i]!)), i * 400));
          })
        }
      >
        {working === 'All pages' ? 'Saving…' : `All ${SECTIONS.length} pages`}
      </Button>
      <Button
        size="sm"
        variant="outline"
        arrow="none"
        disabled={isBusy}
        onClick={() =>
          run('PDF', async () => {
            const blobs = await capture(
              SECTIONS.map((s) => s.slug),
              3,
            );
            downloadBlob(await blobsToPdf(blobs), exportFileName(report.client.name, 'ai-report', currentKey, 'pdf'));
          })
        }
      >
        {working === 'PDF' ? 'Building…' : 'PDF'}
      </Button>
      {stage}
    </div>
  );
}
