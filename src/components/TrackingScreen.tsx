import { useState, useMemo } from 'react';
import {
  Search, Paperclip, CalendarDays, Wallet, FileCheck, FileText,
  ChevronRight, Hash,
} from 'lucide-react';
import type { TrackingEntry, Spec } from '@/types';
import { formatINR, formatDateShort } from '@/lib/format';

interface TrackingScreenProps {
  trackingEntries: TrackingEntry[];
  specs: Spec[];
  scheduleSeqNo: string;
  scheduleTitle: string;
}

function MetaCell({
  label,
  value,
  valueClass = 'text-slate-800',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`truncate text-xs font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}

export function TrackingScreen({
  trackingEntries,
  specs,
  scheduleSeqNo,
  scheduleTitle,
}: TrackingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    trackingEntries[0]?.id ?? null
  );
  const [search, setSearch] = useState('');

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return trackingEntries.filter(
      (t) => t.seq_no.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
    );
  }, [trackingEntries, search]);

  const selected = useMemo(
    () => trackingEntries.find((t) => t.id === selectedId) ?? null,
    [trackingEntries, selectedId]
  );

  const selectedSpecs = useMemo(() => {
    if (!selected) return [];
    return specs.filter((s) => s.level === 'tracking' && s.parent_id === selected.id);
  }, [specs, selected]);

  const totals = useMemo(() => {
    return {
      estQty: selectedSpecs.reduce((s, sp) => s + sp.estimated_qty, 0),
      execQty: selectedSpecs.reduce((s, sp) => s + sp.executed_qty, 0),
      amount: selectedSpecs.reduce((s, sp) => s + sp.amount, 0),
      attachments: selectedSpecs.filter((s) => s.has_attachment).length,
    };
  }, [selectedSpecs]);

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-0 flex-col gap-3 p-3 sm:p-4 lg:flex-row">
      {/* Left pane — tracking entries list */}
      <div className="flex w-full shrink-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:w-2/5 xl:w-[36%]">
        <div className="shrink-0 rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-700">Tracking Entries</h3>
            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700 ring-1 ring-cyan-200">
              {filteredEntries.length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-b-xl">
          {filteredEntries.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
              No tracking entries found.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => {
                const isActive = entry.id === selectedId;
                return (
                  <li key={entry.id}>
                    <button
                      onClick={() => setSelectedId(entry.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isActive
                          ? 'bg-cyan-50 ring-1 ring-inset ring-cyan-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-500">{entry.seq_no}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            entry.completion_tag === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : entry.completion_tag === 'In Progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {entry.completion_tag}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-sm font-semibold text-slate-800">{entry.title}</div>
                        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDateShort(entry.measurement_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            {formatINR(entry.billed_amount)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`mt-2 h-4 w-4 shrink-0 ${isActive ? 'text-cyan-600' : 'text-slate-300'}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right pane — entry detail (independently scrollable) */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        {selected ? (
          <>
            {/* Dark header — title only, pinned */}
            <div className="shrink-0 overflow-hidden rounded-t-xl border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
                  <FileText className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                      {selected.seq_no}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      selected.completion_tag === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30'
                        : selected.completion_tag === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30'
                        : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'
                    }`}>
                      {selected.completion_tag}
                    </span>
                  </div>
                  <h2 className="mt-1 truncate text-base font-bold text-white">{selected.title}</h2>
                  <p className="truncate text-[11px] text-slate-400">
                    Schedule {scheduleSeqNo} · {scheduleTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Light metadata strip — readable values, pinned */}
            <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="grid grid-cols-3 gap-x-5 gap-y-2.5 sm:grid-cols-4 lg:grid-cols-6">
                <MetaCell label="Site Officer" value={selected.site_officer} />
                <MetaCell label="Meas. Date" value={formatDateShort(selected.measurement_date)} />
                <MetaCell label="Completion" value={selected.completion_tag} />
                <MetaCell label="MBook Entry" value={formatINR(selected.mbook_entry)} valueClass="text-blue-700" />
                <MetaCell label="Billed Amount" value={formatINR(selected.billed_amount)} valueClass="text-cyan-700" />
                <MetaCell label="Paid Amount" value={formatINR(selected.paid_amount)} valueClass="text-emerald-700" />
              </div>
            </div>

            {/* Scrollable body — vertical scroll only */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-b-xl">
              {/* Spec table section header (sticky) */}
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-2.5">
                <FileCheck className="h-4 w-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-700">Specification Items</h3>
                <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700 ring-1 ring-cyan-200">
                  {selectedSpecs.length}
                </span>
              </div>

              {/* Horizontal scroll wrapper for the table */}
              <div className="overflow-x-auto">
                <table className="min-w-[740px] border-collapse text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600" style={{ width: '110px' }}>Spec Code</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Description</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-600" style={{ width: '80px' }}>Exec. Qty</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600" style={{ width: '110px' }}>Meas. Date</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-600" style={{ width: '60px' }}>Photo/Att</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSpecs.map((spec, idx) => (
                      <tr key={spec.id} className={`border-b border-slate-100 transition-colors hover:bg-cyan-50/40 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                        <td className="whitespace-nowrap px-4 py-2 font-mono font-medium text-slate-700">{spec.spec_code}</td>
                        <td className="px-4 py-2 text-slate-700">
                          <div className="line-clamp-2">{spec.description}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">{spec.executed_qty.toFixed(0)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-slate-500">{formatDateShort(spec.measurement_date)}</td>
                        <td className="px-4 py-2 text-center">
                          {spec.has_attachment ? (
                            <Paperclip className="mx-auto h-4 w-4 text-cyan-600" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {selectedSpecs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                          No specification items recorded for this entry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {selectedSpecs.length > 0 && (
                    <tfoot className="bg-slate-100">
                      <tr className="border-t-2 border-slate-200">
                        <td className="px-4 py-2.5 font-bold text-slate-700" colSpan={2}>Totals ({selectedSpecs.length} items)</td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums text-slate-700">{totals.execQty.toFixed(0)}</td>
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5 text-center text-slate-500">{totals.attachments}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <div>
              <FileCheck className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">Select an entry to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
