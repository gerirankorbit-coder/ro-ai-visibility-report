import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ReportProvider } from '@/features/report/ReportContext';
import { ReportShell } from '@/features/report/ReportShell';
import { DEMO_KEYS, DEMO_REPORTS, type DemoKey } from '@/lib/demo';

function DemoBanner({ client }: { client: DemoKey }) {
  const nav = useNavigate();
  return (
    <div className="no-capture border-b border-line-d bg-black text-white">
      <div className="mx-auto flex h-9 max-w-content items-center justify-between gap-4 px-5 md:px-12">
        <p className="t-meta text-muted-d">
          Demo data · <Link to="/styleguide" className="underline underline-offset-4 hover:text-white">Styleguide</Link>
        </p>
        <label className="t-meta flex items-center gap-2 text-muted-d">
          Client
          <select value={client} onChange={(e) => nav(`/demo/${e.target.value}`)} className="t-mono h-7 cursor-pointer bg-black text-[11px] text-white">
            {DEMO_KEYS.map((k) => (
              <option key={k} value={k}>
                {DEMO_REPORTS[k].client.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export default function DemoReport() {
  const { client = 'summit' } = useParams();
  if (!(client in DEMO_REPORTS)) return <Navigate to="/demo/summit" replace />;
  const key = client as DemoKey;
  return (
    <ReportProvider report={DEMO_REPORTS[key]} basePath={`/demo/${key}`} mode="demo">
      <ReportShell banner={<DemoBanner client={key} />} />
    </ReportProvider>
  );
}
