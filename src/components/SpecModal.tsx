import { useState, useMemo } from 'react';
import {
  X, FileText, FileCheck,
  MapPin, Calendar, AlertTriangle, Ruler, CalendarClock,
  ChevronDown, ChevronRight, Clock, Truck, TrendingUp, User,
} from 'lucide-react';
import type { BaseEntity, Level, TrackingUpdate, TrackingType } from '@/types';
import { formatINR, formatDateShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface SpecModalProps {
  item: BaseEntity;
  level: Level;
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
  { key: 'delivery', label: 'Schedule Deviations', icon: Truck, color: 'text-amber-600' },
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

export function SpecModal({ item, level, trackingUpdates, onClose }: SpecModalProps) {
  const [expandedDeviation, setExpandedDeviation] = useState<TrackingType | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<TrackingType>('spec');
  const [showHistory, setShowHistory] = useState(false);
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

  const progressPct = item.target_pct > 0 ? Math.min(100, (item.completed_pct / item.target_pct) * 100) : 0;

  const totalDeviationCount = projectUpdates.length;

  const deviationRows: { type: TrackingType; label: string; count: number; value: string; valueClass: string; icon: typeof AlertTriangle }[] = [
    { type: 'spec', label: 'Spec Deviations', count: updatesByType.spec.length, value: updatesByType.spec[0]?.deviation_value ?? '0', valueClass: 'text-amber-700', icon: FileText },
    { type: 'quantity', label: 'Qty Deviations', count: updatesByType.quantity.length, value: updatesByType.quantity[0]?.deviation_value ?? '0', valueClass: 'text-orange-700', icon: Ruler },
    { type: 'price', label: 'Price Escalations', count: updatesByType.price.length, value: updatesByType.price[0]?.deviation_value ?? '0', valueClass: 'text-emerald-700', icon: TrendingUp },
    { type: 'delay', label: 'Extension / Delay', count: updatesByType.delay.length, value: updatesByType.delay[0]?.deviation_value ?? '0', valueClass: 'text-rose-700', icon: Clock },
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
              <MetaRow label="Total Project Value" value={formatINR(item.project_value)} valueClass="text-indigo-700" />
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
                        {dr.value}
                      </span>
                      {dr.count > 0 && (
                        <span className="ml-1.5 text-[9px] font-medium text-slate-400">
                          {dr.count} {dr.count === 1 ? 'log' : 'logs'}
                        </span>
                      )}
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

        {/* Scrollable body — deviation history only */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {totalDeviationCount === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-5 py-10 text-center">
              <FileCheck className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-400">No deviations recorded for this {LEVEL_LABELS[level].toLowerCase()}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
