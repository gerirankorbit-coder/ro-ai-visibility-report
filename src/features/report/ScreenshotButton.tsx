import { useEffect, useState } from 'react';
import { Button, Camera, Modal, useToast } from '@/components/ui';
import type { SectionSlug } from '@/lib/constants';
import { sectionBySlug } from '@/lib/constants';
import { copyImage, downloadBlob, exportFileName } from '@/lib/export';
import { useReport } from './ReportContext';
import { useSectionCapture } from './ReportDocument';

interface Shot {
  blob: Blob;
  url: string;
  name: string;
  w: number;
  h: number;
}

export function ScreenshotButton({ section }: { section: SectionSlug }) {
  const { report, currentKey } = useReport();
  const { capture, stage, busy } = useSectionCapture();
  const toast = useToast();
  const [shot, setShot] = useState<Shot | null>(null);
  const [open, setOpen] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  useEffect(() => () => (shot ? URL.revokeObjectURL(shot.url) : undefined), [shot]);

  const run = async () => {
    try {
      const [blob] = await capture([section], 3);
      if (!blob) throw new Error('No image');
      const url = URL.createObjectURL(blob);
      const dims = await new Promise<{ w: number; h: number }>((res) => {
        const img = new Image();
        img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => res({ w: 0, h: 0 });
        img.src = url;
      });
      const name = exportFileName(report.client.name, sectionBySlug(section).file, currentKey);
      setShot({ blob, url, name, ...dims });
      setCopyMsg(null);
      downloadBlob(blob, name);
      setOpen(true);
    } catch (e) {
      console.warn('Screenshot failed', e);
      toast('Screenshot failed. Please try again.');
    }
  };

  const copy = async () => {
    if (!shot) return;
    const ok = await copyImage(shot.blob);
    setCopyMsg(ok ? 'Image copied to clipboard.' : 'Copying images is not supported in this browser. Use Download, or right-click the preview to copy it.');
  };

  return (
    <>
      <Button size="sm" onClick={run} disabled={busy} arrow={<Camera size={11} />} aria-label={`Screenshot ${sectionBySlug(section).title} as PNG`}>
        {busy ? 'Capturing…' : 'Screenshot'}
      </Button>
      {stage}
      <Modal
        open={open && !!shot}
        onClose={() => setOpen(false)}
        title="Screenshot ready"
        wide
        footer={
          shot ? (
            <>
              {copyMsg ? (
                <p className="t-meta mr-auto text-ink-2" role="status">
                  {copyMsg}
                </p>
              ) : (
                <p className="t-meta t-mono mr-auto text-muted">
                  {shot.name} · {shot.w}×{shot.h}px
                </p>
              )}
              <Button variant="outline" size="sm" arrow="none" onClick={copy}>
                Copy image
              </Button>
              <Button size="sm" arrow="right" onClick={() => downloadBlob(shot.blob, shot.name)}>
                Download PNG
              </Button>
            </>
          ) : null
        }
      >
        {shot ? <img src={shot.url} alt={`Screenshot preview: ${shot.name}`} className="mx-auto block h-auto w-full border border-line" /> : null}
      </Modal>
    </>
  );
}
