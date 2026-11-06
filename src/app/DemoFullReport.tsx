import { Link, Navigate, useParams } from 'react-router-dom';
import { ReportProvider, useReport } from '@/features/report/ReportContext';
import { FullReportView } from '@/features/fullreport/FullReportView';
import { DEMO_REPORTS, type DemoKey } from '@/lib/demo';
import { monthKey, monthLabel } from '@/lib/format';
import type { Note } from '@/types/gmb';

const demoNote = (period: string): Note => ({
  period,
  title: 'Google Core Update',
  image_path: null,
  body: `Google has started rolling out its **${monthLabel(monthKey(period))} Core Update**.\n\nYou may notice some temporary changes in your website’s rankings during this period. This is a normal part of Google’s update process as search results adjust. Please note that your Google Maps rankings may also fluctuate during this time.\n\nWe want to assure you that our SEO team is closely monitoring the situation to ensure your website maintains strong performance.`,
  link: 'https://status.search.google.com/',
});

function Inner({ client }: { client: DemoKey }) {
  const { current, months, currentKey, setMonth } = useReport();
  return (
    <FullReportView
      note={demoNote(current.period)}
      placeholders
      toolbarExtra={
        <>
          <Link to={`/demo/${client}/summary`} className="text-[12px] underline underline-offset-4">
            AI pages
          </Link>
          <select value={currentKey} onChange={(e) => setMonth(e.target.value)} className="h-8 border border-line bg-white px-2 text-[12px] font-semibold" aria-label="Month">
            {months
              .slice()
              .reverse()
              .map((m) => (
                <option key={m.period} value={monthKey(m.period)}>
                  {monthLabel(monthKey(m.period))}
                </option>
              ))}
          </select>
        </>
      }
    />
  );
}

export default function DemoFullReport() {
  const { client = 'summit' } = useParams();
  if (!(client in DEMO_REPORTS)) return <Navigate to="/demo/summit/full" replace />;
  const key = client as DemoKey;
  return (
    <div className="min-h-screen bg-canvas">
      <ReportProvider report={DEMO_REPORTS[key]} basePath={`/demo/${key}`} mode="demo">
        <Inner client={key} />
      </ReportProvider>
    </div>
  );
}
