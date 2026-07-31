import { useState, useMemo } from 'react';
import { X, Search, Paperclip, FileText, Layers, TrendingUp, Wallet, CalendarDays, AlertTriangle, FileCheck } from 'lucide-react';
import type { BaseEntity, Spec, Level } from '@/types';
import { formatINR, formatDateShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface SpecModalProps {
  item: BaseEntity;
  level: Level;
  specs: Spec[];
  onClose: () => void;
}

const LEVEL_LABELS: Record<Level, string> = {
  project: 'Project',
  wo: 'Work Order',
  schedule: 'Schedule',
  tracking: 'Tracking',
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof FileText;
  accent: string;
}) {
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="truncate text-sm font-bold text-slate-800">{value}</div>
        {sub && <div className="truncate text-[10px] text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export function SpecModal({ item, level, specs, onClose }: SpecModalProps) {
  const [specFilter, setSpecFilter] = useState('');
  const colors = delayStatusColor(item.delay_status);

  const levelSpecs = useMemo(() => {
    return specs.filter((s) => s.level === level && s.parent_id === item.id);
  }, [specs, level, item.id]);

  const filteredSpecs = useMemo(() => {
    const q = specFilter.toLowerCase();
    return levelSpecs.filter(
      (s) => s.spec_code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [levelSpecs, specFilter]);

  const totals = useMemo(() => {
    return {
      estQty: filteredSpecs.reduce((s, sp) => s + sp.estimated_qty, 0),
      execQty: filteredSpecs.reduce((s, sp) => s + sp.executed_qty, 0),
      amount: filteredSpecs.reduce((s, sp) => s + sp.amount, 0),
      attachments: filteredSpecs.filter((s) => s.has_attachment).length,
    };
  }, [filteredSpecs]);

  const progressPct = item.target_pct > 0 ? Math.min(100, (item.completed_pct / item.target_pct) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                    {item.seq_no}
                  </span>
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-400/30">
                    {LEVEL_LABELS[level]} Level
                  </span>
                </div>
                <h2 className="mt-1 truncate text-base font-bold text-white">{item.title}</h2>
                <p className="truncate text-[11px] text-slate-400">
                  {item.code} · {item.manager}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metadata stat cards */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Location" value={`${item.state}`} sub={item.district} icon={Layers} accent="bg-indigo-50 text-indigo-600" />
            <StatCard label="Category" value={item.category} sub={item.subcategory} icon={Layers} accent="bg-teal-50 text-teal-600" />

            {/* Progress card with bar */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Physical Progress</div>
                  <div className="text-sm font-bold text-slate-800">
                    {item.completed_pct.toFixed(0)}% <span className="text-[11px] font-medium text-slate-400">/ {item.target_pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <StatCard
              label="Delay Status"
              value={delayStatusShort(item.delay_status)}
              icon={AlertTriangle}
              accent={`${colors.bg} ${colors.text}`}
            />
            <StatCard label="MBook Entry" value={formatINR(item.mbook_entry)} icon={Wallet} accent="bg-blue-50 text-blue-600" />
            <StatCard label="Billed Amount" value={formatINR(item.billed_amount)} icon={Wallet} accent="bg-cyan-50 text-cyan-600" />
            <StatCard label="Paid Amount" value={formatINR(item.paid_amount)} icon={Wallet} accent="bg-emerald-50 text-emerald-600" />
            <StatCard label="Start Date" value={formatDateShort(item.start_date)} icon={CalendarDays} accent="bg-slate-100 text-slate-600" />
            <StatCard label="End Date" value={formatDateShort(item.end_date)} icon={CalendarDays} accent="bg-slate-100 text-slate-600" />
            <StatCard label="Qty Deviations" value={`${item.qty_deviations}`} icon={AlertTriangle} accent="bg-orange-50 text-orange-600" />
            <StatCard label="Spec Deviations" value={`${item.spec_deviations}`} icon={AlertTriangle} accent="bg-amber-50 text-amber-600" />
            <StatCard label="Extension Days" value={`${item.extension_days}`} icon={CalendarDays} accent="bg-rose-50 text-rose-600" />
          </div>
        </div>

        {/* Specs table */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-2.5">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-700">Specification Items</h3>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700 ring-1 ring-cyan-200">
                {filteredSpecs.length}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter specs..."
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
                className="w-40 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(15,23,42,0.08)]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600" style={{ width: '110px' }}>Spec Code</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Description</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600" style={{ width: '60px' }}>Unit</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-600" style={{ width: '80px' }}>Est. Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-600" style={{ width: '80px' }}>Exec. Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-600" style={{ width: '90px' }}>Rate</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-600" style={{ width: '110px' }}>Amount</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-slate-600" style={{ width: '50px' }}>Att</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpecs.map((spec, idx) => {
                  const ratio = spec.estimated_qty > 0 ? Math.min(100, (spec.executed_qty / spec.estimated_qty) * 100) : 0;
                  return (
                    <tr key={spec.id} className={`border-b border-slate-100 transition-colors hover:bg-cyan-50/40 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="whitespace-nowrap px-4 py-2 font-mono font-medium text-slate-700">{spec.spec_code}</td>
                      <td className="px-4 py-2 text-slate-700">
                        <div className="line-clamp-2">{spec.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-500">{spec.unit}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">{spec.estimated_qty.toFixed(0)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">
                        {spec.executed_qty.toFixed(0)}
                        {spec.estimated_qty > 0 && (
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${ratio}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">₹{spec.rate.toFixed(0)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-bold tabular-nums text-blue-700">{formatINR(spec.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        {spec.has_attachment ? (
                          <Paperclip className="mx-auto h-4 w-4 text-cyan-600" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredSpecs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                      No specs match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredSpecs.length > 0 && (
                <tfoot className="sticky bottom-0 bg-slate-100">
                  <tr className="border-t-2 border-slate-200">
                    <td className="px-4 py-2.5 font-bold text-slate-700" colSpan={3}>Totals ({filteredSpecs.length} items)</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-slate-700">{totals.estQty.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-slate-700">{totals.execQty.toFixed(0)}</td>
                    <td className="px-4 py-2.5"></td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-blue-700">{formatINR(totals.amount)}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{totals.attachments}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
