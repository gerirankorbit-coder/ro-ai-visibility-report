import type { ReactNode } from 'react';
import { IndexTable, LogoStrip, StatusChip } from '@/components/ui';
import { initials, todayIndex } from '@/lib/format';
import { verifiedListings } from '@/lib/metrics';
import type { HoursDay } from '@/types/schema';
import { Band, BlockHead } from '../Frame';
import { useReport } from '../ReportContext';

const fmtHours = (h: HoursDay | undefined) => (!h ? 'Not set' : h.closed ? 'Closed' : `${h.open} – ${h.close}`);

function Row({ label, value, score }: { label: string; value: ReactNode; score: number }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-3 border-t border-line py-3.5 @md:grid-cols-[110px_1fr_auto]">
      <span className="t-meta uppercase tracking-[0.06em] text-muted">{label}</span>
      <span className="min-w-0 truncate text-[13px] text-ink">{value}</span>
      <span className="col-start-2 @md:col-start-auto">
        {score >= 90 ? <StatusChip tone="good">Consistent</StatusChip> : <StatusChip tone="warn">Being aligned</StatusChip>}
      </span>
    </div>
  );
}

export function ProfileSection() {
  const { report, current: m } = useReport();
  const c = report.client;
  const today = todayIndex();
  const verified = m.sources.filter((s) => s.status === 'verified').map((s) => s.name);

  return (
    <>
      <Band>
        <div className="grid grid-cols-1 gap-16 @lg:grid-cols-12">
          <div className="@lg:col-span-7">
            <BlockHead label="How AI engines see your business" stacked />
            <div className="border border-line bg-white p-6 @md:p-8">
              <div className="mb-6 flex items-center gap-5">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={`${c.name} logo`} className="h-16 w-16 border border-line bg-white object-contain" style={{ imageRendering: 'auto' }} crossOrigin="anonymous" />
                ) : (
                  <div className="font-display flex h-16 w-16 shrink-0 items-center justify-center text-[22px] font-medium tracking-[-0.03em] text-white" style={{ background: c.brand_color }} aria-hidden>
                    {initials(c.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="t-h2 text-ink">{c.name}</div>
                  <div className="text-small text-muted">{c.category}</div>
                </div>
              </div>
              <Row label="Address" value={[c.address, c.locality].filter(Boolean).join(', ')} score={m.nap_fields.address} />
              <Row label="Phone" value={<span className="num">{c.phone}</span>} score={m.nap_fields.phone} />
              <Row label="Website" value={c.website} score={m.nap_fields.website} />
              <Row label="Hours today" value={fmtHours(c.hours[today])} score={m.nap_fields.hours} />
              <Row label="Name" value={c.name} score={m.nap_fields.name} />
            </div>
          </div>
          <div className="@lg:col-span-5">
            <BlockHead label="Business hours" stacked />
            <IndexTable<HoursDay>
              caption="Business hours"
              minWidth={280}
              rows={c.hours}
              rowKey={(r) => r.day}
              highlight={(_, i) => i === today}
              columns={[
                { key: 'day', header: 'Day', render: (r, i) => <span className={i === today ? 'font-medium' : ''}>{r.day}</span> },
                { key: 'h', header: 'Hours', align: 'right', render: (r) => <span className={`t-mono text-[12px] ${r.closed ? 'text-muted' : ''}`}>{fmtHours(r)}</span>, className: 'pr-0' },
              ]}
            />
          </div>
        </div>
      </Band>

      <Band tone="dark">
        <BlockHead tone="dark" label="Services" title="Topics we are strengthening in your entity profile" />
        {c.services.length ? (
          <p className="font-display max-w-[34ch] text-[28px] font-normal leading-[1.25] tracking-[-0.025em] text-white @md:text-[36px]">
            {c.services.map((s, i) => (
              <span key={s}>
                {s}
                {i < c.services.length - 1 ? <span className="text-[#5A5A5A]"> / </span> : null}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-muted-d">Services will appear here once added.</p>
        )}
      </Band>

      <Band>
        <BlockHead label="Verified on" title={`${verifiedListings(m)} directories confirm this exact business data`} />
        {verified.length ? <LogoStrip names={verified} /> : <p className="text-small text-muted">No verified listings yet. Listings are being aligned.</p>}
      </Band>
    </>
  );
}
