import { useState, useMemo } from 'react';
import { Search, Paperclip, FileText, ClipboardList, History, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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

const TAG_ICONS: Record<string, typeof CheckCircle2> = {
  Completed: CheckCircle2,
  Approved: CheckCircle2,
  Pending: Clock,
  Upcoming: AlertCircle,
};

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
      <div className="w-2/5 min-w-[280px] border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="px-2 py-1.5 bg-slate-100 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-700">
            Tracking Entries - {scheduleSeqNo}
          </h3>
          <p className="text-[10px] text-slate-500 truncate">{scheduleTitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {trackingEntries.map((entry) => {
            const isSelected = entry.id === selectedId;
            const TagIcon = TAG_ICONS[entry.completion_tag] || AlertCircle;
            return (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                className={`flex flex-col w-full text-left px-2 py-1.5 border-b border-slate-100 transition-colors ${isSelected ? 'bg-cyan-50 border-l-2 border-l-cyan-600' : 'hover:bg-white'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{entry.seq_no}</span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1 py-0.5 rounded border ${TAG_COLORS[entry.completion_tag] || TAG_COLORS.Upcoming}`}>
                    <TagIcon className="w-2.5 h-2.5" />
                    {entry.completion_tag}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-700 truncate mt-0.5">{entry.title}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>{entry.site_officer}</span>
                  <span>{formatDateShort(entry.measurement_date)}</span>
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
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'detail' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Tracking Detail &amp; Specs
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'audit' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Log
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'detail' ? (
            <>
              {/* Header Info */}
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {selected.seq_no}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${TAG_COLORS[selected.completion_tag] || TAG_COLORS.Upcoming}`}>
                    {selected.completion_tag}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800">{selected.title}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <div className="text-slate-400">Site Officer</div>
                    <div className="font-medium text-slate-700">{selected.site_officer}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Measurement Date</div>
                    <div className="font-medium text-slate-700">{formatDate(selected.measurement_date)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">MBook Entry</div>
                    <div className="font-medium text-blue-700">{formatINR(selected.mbook_entry)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Billed / Paid</div>
                    <div className="font-medium text-slate-700">
                      <span className="text-cyan-600">{formatINR(selected.billed_amount)}</span> / <span className="text-emerald-600">{formatINR(selected.paid_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spec Filter */}
              <div className="flex items-center justify-between px-3 py-1.5 sticky top-0 bg-white border-b border-slate-100 z-10">
                <h4 className="text-xs font-semibold text-slate-700">Spec Items ({filteredSpecs.length})</h4>
                <div className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5">
                  <Search className="w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter specs..."
                    value={specFilter}
                    onChange={(e) => setSpecFilter(e.target.value)}
                    className="bg-transparent text-[11px] outline-none w-32"
                  />
                </div>
              </div>

              {/* Spec Table */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Spec Code</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Description</th>
                    <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Exec. Qty</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Meas. Date</th>
                    <th className="text-center px-2 py-1.5 font-semibold text-slate-600">Photo/Att</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecs.map((spec, idx) => (
                    <tr key={spec.id} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-2 py-1.5 font-mono text-slate-600 font-medium whitespace-nowrap">{spec.spec_code}</td>
                      <td className="px-2 py-1.5 text-slate-700">{spec.description}</td>
                      <td className="px-2 py-1.5 text-right text-slate-600 whitespace-nowrap">{spec.executed_qty.toFixed(0)} {spec.unit}</td>
                      <td className="px-2 py-1.5 text-slate-500 whitespace-nowrap">{formatDateShort(spec.measurement_date)}</td>
                      <td className="px-2 py-1.5 text-center">
                        {spec.has_attachment ? (
                          <Paperclip className="w-3.5 h-3.5 text-cyan-600 inline" />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSpecs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2 py-4 text-center text-slate-400 text-xs">No specs match the filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            /* Audit Log Tab */
            <div className="p-3">
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
                {auditLog.map((log) => (
                  <div key={log.id} className="flex gap-3 mb-3 last:mb-0">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 border-2 border-cyan-500 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-cyan-700" />
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded border border-slate-200 px-2.5 py-1.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-slate-700">{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-400">{log.revision}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mb-1">{log.details}</p>
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
