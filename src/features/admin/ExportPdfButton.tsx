import { useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { SECTIONS } from '@/lib/constants';
import { blobsToPdf, downloadBlob, exportFileName } from '@/lib/export';
import { useReport } from '@/features/report/ReportContext';
import { useSectionCapture } from '@/features/report/ReportDocument';

/** Captures all 5 sections at 1440px / pixelRatio 2 and combines them into one PDF. */
export function ExportPdfButton() {
  const { report, currentKey } = useReport();
  const { capture, stage, busy } = useSectionCapture();
  const toast = useToast();
  const [working, setWorking] = useState(false);
  const run = async () => {
    setWorking(true);
    try {
      const blobs = await capture(SECTIONS.map((s) => s.slug), 2);
      const pdf = await blobsToPdf(blobs, 2);
      downloadBlob(pdf, exportFileName(report.client.name, 'full-report', currentKey, 'pdf'));
      toast('PDF exported');
    } catch (e) {
      console.warn('PDF export failed', e);
      toast('PDF export failed. Please try again.');
    } finally {
      setWorking(false);
    }
  };
  return (
    <>
      <Button size="sm" variant="outline" arrow="none" onClick={run} disabled={busy || working}>
        {busy || working ? 'Exporting PDF…' : 'Export full report (PDF)'}
      </Button>
      {stage}
    </>
  );
}
