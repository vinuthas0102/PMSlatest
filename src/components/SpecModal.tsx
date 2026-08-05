import { useState, useMemo, Fragment } from 'react';
import {
  X, Search, Paperclip, FileText, FileCheck,
  MapPin, Calendar, AlertTriangle, Ruler, CalendarClock,
  ChevronDown, ChevronRight, Clock, Truck, TrendingUp, User,
} from 'lucide-react';
import type { BaseEntity, Spec, Level, TrackingUpdate, TrackingType } from '@/types';
import { formatINR, formatDateShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface SpecModalProps {
  item: BaseEntity;
  level: Level;
  specs: Spec[];
  trackingUpdates: TrackingUpdate[];
  onClose: () => void;
}

const LEVEL_LABELS: Record<Level, string> = {
  project: 'Project',
  wo: 'Work Order',
  schedule: 'Schedule',
  tracking: 'Tracking',
};

const DEVIATION_TABS: { key: TrackingType; label: string; icon: typeof Clock; color: string }[] = [
  { key: 'spec', label: 'Spec Deviations', icon: FileText, color: 'text-cyan-600' },
  { key: 'quantity', label: 'Qty Deviations', icon: Ruler, color: 'text-orange-600' },
  { key: 'price', label: 'Price Escalations', icon: TrendingUp, color: 'text-emerald-600' },
  { key: 'delay', label: 'Delay / Extension', icon: Clock, color: 'text-rose-600' },
  { key: 'delivery', label: 'Delivery Deviations', icon: Truck, color: 'text-amber-600' },
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetaRow({ label, value, valueClass = 'text-slate-800' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className="w-3.5 h-3.5 text-cyan-600" />
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{children}</h4>
    </div>
  );
}

function UpdateCard({ u, icon: Icon, color }: { u: TrackingUpdate; icon: typeof Clock; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            {u.deviation_value}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <CalendarClock className="w-3 h-3" />
          {formatTimestamp(u.created_at)}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2">
        <User className="w-3 h-3" />
        <span className="font-medium text-slate-600">{u.officer_name || 'Unknown'}</span>
      </div>
      <div
        className="text-xs text-slate-700 prose-sm max-w-none [&_b]:font-bold [&_i]:italic [&_u]:underline"
        dangerouslySetInnerHTML={{ __html: u.remarks }}
      />
    </div>
  );
}

export function SpecModal({ item, level, specs, trackingUpdates, onClose }: SpecModalProps) {
  const [specFilter, setSpecFilter] = useState('');
  const [expandedDeviation, setExpandedDeviation] = useState<TrackingType | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<TrackingType>('spec');
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSpecDeviation, setExpandedSpecDeviation] = useState<string | null>(null);
  const colors = delayStatusColor(item.delay_status);
  const balance = Math.max(0, item.mbook_entry - item.paid_amount);

  const projectUpdates = useMemo(
    () => trackingUpdates.filter((u) => u.project_id === item.id),
    [trackingUpdates, item.id]
  );

  const updatesByType = useMemo(() => {
    const map: Record<TrackingType, TrackingUpdate[]> = {
      spec: [], quantity: [], price: [], delay: [], delivery: [],
    };
    for (const u of projectUpdates) {
      map[u.tracking_type].push(u);
    }
    return map;
  }, [projectUpdates]);

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

  const totalDeviationCount = projectUpdates.length;

  const deviationRows: { type: TrackingType; label: string; count: number; valueClass: string; icon: typeof AlertTriangle }[] = [
    { type: 'spec', label: 'Spec Deviations', count: item.spec_deviations, valueClass: 'text-amber-700', icon: FileText },
    { type: 'quantity', label: 'Qty Deviations', count: item.qty_deviations, valueClass: 'text-orange-700', icon: Ruler },
    { type: 'price', label: 'Price Escalations', count: updatesByType.price.length, valueClass: 'text-emerald-700', icon: TrendingUp },
    { type: 'delay', label: 'Extension / Delay', count: updatesByType.delay.length, valueClass: 'text-rose-700', icon: Clock },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark header banner */}
        <div className="shrink-0 overflow-hidden rounded-t-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                    {item.seq_no}
                  </span>
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-400/30">
                    {LEVEL_LABELS[level]} Level
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                    {delayStatusShort(item.delay_status)}
                  </span>
                </div>
                <h2 className="mt-1 truncate text-base font-bold text-white">{item.title}</h2>
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

        {/* Metadata: sectioned, right-aligned values */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Location */}
            <div>
              <SectionTitle icon={MapPin}>Location</SectionTitle>
              <MetaRow label="State" value={item.state} />
              <MetaRow label="District" value={item.district} />
            </div>

            {/* Category */}
            <div>
              <SectionTitle icon={FileText}>Classification</SectionTitle>
              <MetaRow label="Category" value={item.category} />
              <MetaRow label="Subcategory" value={item.subcategory} />
            </div>

            {/* Progress */}
            <div>
              <SectionTitle icon={FileCheck}>Progress</SectionTitle>
              <MetaRow label="Completed" value={`${item.completed_pct.toFixed(0)}%`} valueClass="text-cyan-700" />
              <MetaRow label="Target" value={`${item.target_pct.toFixed(0)}%`} valueClass="text-slate-600" />
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Dates */}
            <div>
              <SectionTitle icon={Calendar}>Timeline</SectionTitle>
              <MetaRow label="Start Date" value={formatDateShort(item.start_date)} />
              <MetaRow label="End Date" value={formatDateShort(item.end_date)} />
            </div>

            {/* Financials */}
            <div>
              <SectionTitle icon={FileText}>Financials</SectionTitle>
              <MetaRow label="MBook Entry" value={formatINR(item.mbook_entry)} valueClass="text-blue-700" />
              <MetaRow label="Billed Amount" value={formatINR(item.billed_amount)} valueClass="text-cyan-700" />
              <MetaRow label="Paid Amount" value={formatINR(item.paid_amount)} valueClass="text-emerald-700" />
              <MetaRow label="Balance" value={formatINR(balance)} valueClass="text-rose-600" />
            </div>

            {/* Deviations — expandable */}
            <div>
              <SectionTitle icon={AlertTriangle}>Deviations</SectionTitle>
              {deviationRows.map((dr) => {
                const entries = updatesByType[dr.type];
                const isExpanded = expandedDeviation === dr.type;
                const hasEntries = entries.length > 0;
                return (
                  <div key={dr.type}>
                    <button
                      onClick={() => hasEntries ? setExpandedDeviation(isExpanded ? null : dr.type) : undefined}
                      disabled={!hasEntries}
                      className={`flex w-full items-center justify-between py-1.5 border-b border-slate-100 last:border-0 ${hasEntries ? 'cursor-pointer hover:bg-slate-100/60' : 'cursor-default'}`}
                    >
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        {hasEntries && isExpanded
                          ? <ChevronDown className="w-3 h-3 text-slate-400" />
                          : hasEntries
                            ? <ChevronRight className="w-3 h-3 text-slate-400" />
                            : <span className="w-3" />
                        }
                        {dr.label}
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${dr.valueClass}`}>
                        {dr.count}
                      </span>
                    </button>
                    {isExpanded && hasEntries && (
                      <div className="mt-1 mb-2 space-y-2 pl-4">
                        {entries.map((u) => {
                          const tabMeta = DEVIATION_TABS.find((t) => t.key === dr.type);
                          return <UpdateCard key={u.id} u={u} icon={tabMeta?.icon ?? FileText} color={tabMeta?.color ?? 'text-slate-400'} />;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deviation history toggle */}
          {totalDeviationCount > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 hover:text-cyan-800 transition-colors"
              >
                {showHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <AlertTriangle className="w-3.5 h-3.5" />
                Deviation History ({totalDeviationCount} {totalDeviationCount === 1 ? 'entry' : 'entries'})
              </button>
            </div>
          )}
        </div>

        {/* Deviation history panel */}
        {showHistory && totalDeviationCount > 0 && (
          <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex items-center gap-1 mb-3 overflow-x-auto">
              {DEVIATION_TABS.map((tab) => {
                const count = updatesByType[tab.key].length;
                if (count === 0) return null;
                const Icon = tab.icon;
                const isActive = activeHistoryTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveHistoryTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-slate-100 text-slate-800 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-400'}`} />
                    {tab.label}
                    <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {updatesByType[activeHistoryTab].length > 0 ? (
                updatesByType[activeHistoryTab].map((u) => {
                  const tabMeta = DEVIATION_TABS.find((t) => t.key === activeHistoryTab);
                  return <UpdateCard key={u.id} u={u} icon={tabMeta?.icon ?? FileText} color={tabMeta?.color ?? 'text-slate-400'} />;
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No entries for this category.</p>
              )}
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Totals banner */}
          {filteredSpecs.length > 0 && (
            <div className="flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-200 px-5 py-2.5">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-cyan-600" />
                <span className="text-xs font-bold text-slate-700">Specification Items</span>
                <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-bold text-cyan-700 ring-1 ring-cyan-200">
                  {filteredSpecs.length}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-slate-500">Est. Qty: <span className="font-bold text-slate-700 tabular-nums">{totals.estQty.toFixed(0)}</span></span>
                <span className="text-slate-500">Exec. Qty: <span className="font-bold text-slate-700 tabular-nums">{totals.execQty.toFixed(0)}</span></span>
                <span className="text-slate-500">Total Amount: <span className="font-bold text-blue-700 tabular-nums">{formatINR(totals.amount)}</span></span>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-2">
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
            {updatesByType.quantity.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {updatesByType.quantity.length} qty deviation {updatesByType.quantity.length === 1 ? 'log' : 'logs'} from maintenance
              </span>
            )}
          </div>

          {/* Specs table */}
          <div className="overflow-x-auto">
            <table className="min-w-[960px] border-collapse text-xs">
              <thead className="bg-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold text-slate-700" style={{ width: '110px' }}>Spec Code</th>
                  <th className="px-4 py-2.5 text-left font-bold text-slate-700">Description</th>
                  <th className="px-4 py-2.5 text-left font-bold text-slate-700" style={{ width: '60px' }}>Unit</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-700" style={{ width: '80px' }}>Est. Qty</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-700" style={{ width: '80px' }}>Exec. Qty</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-700" style={{ width: '90px' }}>Rate</th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-700" style={{ width: '110px' }}>Amount</th>
                  <th className="px-4 py-2.5 text-center font-bold text-slate-700" style={{ width: '90px' }}>Attachment</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpecs.map((spec, idx) => {
                  const ratio = spec.estimated_qty > 0 ? Math.min(100, (spec.executed_qty / spec.estimated_qty) * 100) : 0;
                  const hasDeviation = spec.executed_qty !== spec.estimated_qty;
                  const showQtyLog = hasDeviation && updatesByType.quantity.length > 0;
                  const isQtyExpanded = expandedSpecDeviation === spec.id;
                  return (
                    <Fragment key={spec.id}>
                      <tr
                        className={`border-b border-slate-200 transition-colors hover:bg-cyan-50/50 ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}
                      >
                        <td className="whitespace-nowrap px-4 py-2 font-mono font-medium text-slate-700">{spec.spec_code}</td>
                        <td className="px-4 py-2 text-slate-700">
                          <div className="line-clamp-2">{spec.description}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-slate-500">{spec.unit}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">{spec.estimated_qty.toFixed(0)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                          <span className={hasDeviation ? 'text-orange-700 font-semibold' : 'text-slate-600'}>
                            {spec.executed_qty.toFixed(0)}
                          </span>
                          {spec.estimated_qty > 0 && (
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200">
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
                      {showQtyLog && (
                        <tr className={`border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
                          <td colSpan={8} className="px-4 py-0">
                            <button
                              onClick={() => setExpandedSpecDeviation(isQtyExpanded ? null : spec.id)}
                              className="flex items-center gap-1.5 py-1.5 text-[10px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                            >
                              {isQtyExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <Ruler className="w-3 h-3" />
                              Qty deviation log ({updatesByType.quantity.length} {updatesByType.quantity.length === 1 ? 'entry' : 'entries'})
                            </button>
                          </td>
                        </tr>
                      )}
                      {isQtyExpanded && showQtyLog && (
                        <tr className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td colSpan={8} className="px-8 pb-3">
                            <div className="space-y-2">
                              {updatesByType.quantity.map((u) => (
                                <UpdateCard key={u.id} u={u} icon={Ruler} color="text-orange-600" />
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
                <tfoot className="bg-slate-200">
                  <tr className="border-t-2 border-slate-300">
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
