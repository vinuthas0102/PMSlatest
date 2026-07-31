import { useState, useMemo } from 'react';
import { Search, Paperclip, FileText, ClipboardList, History, CheckCircle2, Clock, AlertCircle, User, CalendarDays, Wallet, TrendingUp } from 'lucide-react';
import type { TrackingEntry, Spec, AuditLogEntry } from '@/types';
import { formatINR, formatDateShort, formatDate } from '@/lib/format';
import { generateAuditLog } from '@/hooks/useDashboardData';

interface TrackingScreenProps {
  trackingEntries: TrackingEntry[];
  specs: Spec[];
  scheduleSeqNo: string;
  scheduleTitle: string;
}

const TAG_COLORS: Record<string, string> = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Approved: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Upcoming: 'bg-slate-50 text-slate-500 border-slate-200',
};

const TAG_BAR: Record<string, string> = {
  Completed: 'bg-emerald-500',
  Approved: 'bg-cyan-500',
  Pending: 'bg-amber-500',
  Upcoming: 'bg-slate-400',
};

const TAG_ICONS: Record<string, typeof CheckCircle2> = {
  Completed: CheckCircle2,
  Approved: CheckCircle2,
  Pending: Clock,
  Upcoming: AlertCircle,
};

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function MiniStat({ label, value, sub, icon: Icon, accent }: { label: string; value: string; sub?: string; icon: typeof User; accent: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
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

export function TrackingScreen({ trackingEntries, specs, scheduleSeqNo, scheduleTitle }: TrackingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(trackingEntries[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<'detail' | 'audit'>('detail');
  const [specFilter, setSpecFilter] = useState('');

  const selected = trackingEntries.find((t) => t.id === selectedId) ?? trackingEntries[0];

  const trackingSpecs = useMemo(() => {
    return specs.filter((s) => s.level === 'tracking' && s.parent_id === selected?.id);
  }, [specs, selected]);

  const filteredSpecs = useMemo(() => {
    const q = specFilter.toLowerCase();
    return trackingSpecs.filter(
      (s) => s.spec_code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [trackingSpecs, specFilter]);

  const auditLog = useMemo(() => {
    return selected ? generateAuditLog(selected) : [];
  }, [selected]);

  if (!selected) {
    return <div className="p-4 text-center text-sm text-slate-500">No tracking entries available.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[400px] border-t border-slate-200">
      {/* Left Pane - 40% */}
      <div className="w-2/5 min-w-[300px] border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="px-3 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
          <h3 className="text-xs font-bold text-white">
            Tracking Entries — {scheduleSeqNo}
          </h3>
          <p className="text-[10px] text-slate-400 truncate">{scheduleTitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {trackingEntries.map((entry) => {
            const isSelected = entry.id === selectedId;
            const TagIcon = TAG_ICONS[entry.completion_tag] || AlertCircle;
            return (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                className={`flex w-full items-stretch overflow-hidden rounded-lg border text-left transition-all ${isSelected ? 'border-cyan-300 bg-white shadow-md ring-1 ring-cyan-200' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
              >
                {/* Status stripe */}
                <div className={`w-1 shrink-0 ${TAG_BAR[entry.completion_tag] || 'bg-slate-300'}`} />
                <div className="flex-1 px-2.5 py-2 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{entry.seq_no}</span>
                    <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${TAG_COLORS[entry.completion_tag] || TAG_COLORS.Upcoming}`}>
                      <TagIcon className="w-2.5 h-2.5" />
                      {entry.completion_tag}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 truncate mt-1">{entry.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span className="truncate">{entry.site_officer}</span>
                    <span className="whitespace-nowrap">{formatDateShort(entry.measurement_date)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane - 60% */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('detail')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'detail' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Tracking Detail &amp; Specs
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'audit' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Log
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'detail' ? (
            <>
              {/* Header Info — banner + stat cards */}
              <div className="px-4 pt-3 pb-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {selected.seq_no}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${TAG_COLORS[selected.completion_tag] || TAG_COLORS.Upcoming}`}>
                    {selected.completion_tag}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 truncate">{selected.title}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <MiniStat label="Site Officer" value={selected.site_officer} icon={User} accent="bg-indigo-50 text-indigo-600" />
                  <MiniStat label="Measurement Date" value={formatDate(selected.measurement_date)} icon={CalendarDays} accent="bg-slate-100 text-slate-600" />
                  <MiniStat label="MBook Entry" value={formatINR(selected.mbook_entry)} icon={Wallet} accent="bg-blue-50 text-blue-600" />
                  <MiniStat label="Billed / Paid" value={formatINR(selected.billed_amount)} sub={`Paid ${formatINR(selected.paid_amount)}`} icon={TrendingUp} accent="bg-emerald-50 text-emerald-600" />
                </div>
              </div>

              {/* Spec Filter */}
              <div className="flex items-center justify-between px-4 py-2.5 sticky top-0 bg-white border-b border-slate-100 z-10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <h4 className="text-xs font-bold text-slate-700">Spec Items</h4>
                  <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700 ring-1 ring-cyan-200">{filteredSpecs.length}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1 ring-1 ring-slate-200">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter specs..."
                    value={specFilter}
                    onChange={(e) => setSpecFilter(e.target.value)}
                    className="bg-transparent text-[11px] outline-none w-32 text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Spec Table */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2 font-semibold text-slate-600" style={{ width: '110px' }}>Spec Code</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">Description</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-600 whitespace-nowrap" style={{ width: '80px' }}>Exec. Qty</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap" style={{ width: '90px' }}>Meas. Date</th>
                    <th className="text-center px-3 py-2 font-semibold text-slate-600" style={{ width: '60px' }}>Photo/Att</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecs.map((spec, idx) => (
                    <tr key={spec.id} className={`border-b border-slate-100 transition-colors hover:bg-cyan-50/40 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{spec.spec_code}</td>
                      <td className="px-3 py-2 text-slate-700"><div className="line-clamp-2">{spec.description}</div></td>
                      <td className="px-3 py-2 text-right text-slate-600 whitespace-nowrap tabular-nums">{spec.executed_qty.toFixed(0)} {spec.unit}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateShort(spec.measurement_date)}</td>
                      <td className="px-3 py-2 text-center">
                        {spec.has_attachment ? (
                          <Paperclip className="w-3.5 h-3.5 text-cyan-600 inline" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSpecs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-400 text-xs">No specs match the filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            /* Audit Log Tab */
            <div className="p-4">
              <div className="relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200" />
                {auditLog.map((log: AuditLogEntry) => (
                  <div key={log.id} className="flex gap-3 mb-4 last:mb-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 border-2 border-cyan-500 flex items-center justify-center text-[11px] font-bold text-cyan-700">
                        {initials(log.officer)}
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 px-3 py-2 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{log.revision}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mb-1.5">{log.details}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-medium text-slate-500">{log.officer}</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
