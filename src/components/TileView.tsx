import { FileText, ChevronRight, MapPin, AlertTriangle, Ruler, CalendarClock, FilePlus, ClipboardList } from 'lucide-react';
import type { BaseEntity, TrackingUpdate, TrackingType } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface TileViewProps {
  items: BaseEntity[];
  trackingUpdates?: TrackingUpdate[];
  onShowDetails: (item: BaseEntity) => void;
  onCreateNew?: () => void;
  onTrackUpdate?: (item: BaseEntity) => void;
  onShowWorkOrders?: (item: BaseEntity) => void;
}

function latestDeviationValue(updates: TrackingUpdate[], projectId: string, type: TrackingType): string | null {
  const match = updates.find((u) => u.project_id === projectId && u.tracking_type === type);
  return match ? match.deviation_value : null;
}

export function TileView({ items, trackingUpdates = [], onShowDetails, onCreateNew, onTrackUpdate, onShowWorkOrders }: TileViewProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 px-4 py-2.5 rounded-lg transition-colors self-end shadow-sm"
        >
          <FilePlus className="w-4 h-4" />
          Create New Project
        </button>
      )}
      {items.length === 0 && !onCreateNew && (
        <div className="text-center text-sm text-slate-500 py-4">No items match the current filters.</div>
      )}
      {items.length === 0 && onCreateNew && (
        <div className="text-center text-sm text-slate-500 py-4">No projects yet. Click "Create New Project" to add one.</div>
      )}
      {items.map((item) => {
        const colors = delayStatusColor(item.delay_status);
        const balance = Math.max(0, item.mbook_entry - item.paid_amount);
        const billedNotPaid = Math.max(0, item.billed_amount - item.paid_amount);
        const progressPct = Math.min(item.completed_pct, 100);
        const targetPct = Math.min(item.target_pct, 100);

        // Stacked bar segment widths (relative to project value)
        const base = Math.max(1, item.project_value);
        const paidPct = Math.min(100, (item.paid_amount / base) * 100);
        const billedNotPaidPct = Math.min(100 - paidPct, (billedNotPaid / base) * 100);
        const remPct = Math.max(0, 100 - paidPct - billedNotPaidPct);

        return (
          <div
            key={item.id}
            className={`mirror-card rounded-r-lg rounded-l-sm p-4 flex flex-col gap-3 border-l-4 ${colors.borderAccent}`}
          >
            {/* Line 1: Header — seq, status badge, title, location */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Seq # {item.seq_no}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                {delayStatusShort(item.delay_status)}
              </span>
              <span className="text-sm font-semibold text-slate-800 truncate flex-1 min-w-0">{item.title}</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{item.state} · {item.district}</span>
              </div>
            </div>

            {/* Line 2: Physical Progress + deviation badges */}
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span className="font-medium text-slate-600">Physical Progress</span>
                  <span>
                    <span className="font-semibold text-cyan-700">{progressPct.toFixed(0)}%</span>
                    <span className="text-slate-400"> / target {targetPct.toFixed(0)}%</span>
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
                    style={{ left: `${targetPct}%` }}
                  />
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                {(() => { const v = latestDeviationValue(trackingUpdates, item.id, 'spec'); return (item.spec_deviations > 0 || v) && (
                  <span className="flex items-center gap-0.5 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-medium">
                    <AlertTriangle className="w-2.5 h-2.5" /> {v ?? `${item.spec_deviations}`} Spec
                  </span>
                ); })()}
                {(() => { const v = latestDeviationValue(trackingUpdates, item.id, 'quantity'); return (item.qty_deviations > 0 || v) && (
                  <span className="flex items-center gap-0.5 text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-300 font-medium">
                    <Ruler className="w-2.5 h-2.5" /> {v ?? `${item.qty_deviations}`} Qty
                  </span>
                ); })()}
                {item.extension_days > 0 && (
                  <span className="flex items-center gap-0.5 text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300 font-medium">
                    <CalendarClock className="w-2.5 h-2.5" /> {item.extension_days}d Ext
                  </span>
                )}
              </div>
            </div>

            {/* Line 3: Financial — single horizontal stacked bar */}
            <div className="bg-slate-50/80 rounded px-3 py-2 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Financial Progress</span>
                <span className="text-[9px] font-semibold text-slate-400">
                  {item.project_value > 0 ? ((item.paid_amount / item.project_value) * 100).toFixed(0) : 0}% <span className="text-slate-400">/ target {item.target_pct.toFixed(0)}%</span>
                  <span className="ml-2 text-slate-400">Project: {formatINRShort(item.project_value)}</span>
                  <span className="ml-2 text-slate-400">MBook: {formatINRShort(item.mbook_entry)}</span>
                </span>
              </div>
              {/* Stacked bar */}
              <div className="flex h-4 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                {paidPct > 0 && (
                  <div
                    className="bg-emerald-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${paidPct}%` }}
                    title={`Paid: ${formatINRShort(item.paid_amount)}`}
                  />
                )}
                {billedNotPaidPct > 0 && (
                  <div
                    className="bg-cyan-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${billedNotPaidPct}%` }}
                    title={`Billed (not paid): ${formatINRShort(billedNotPaid)}`}
                  />
                )}
                {remPct > 0 && (
                  <div
                    className="bg-rose-400 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${remPct}%` }}
                    title={`Remaining: ${formatINRShort(balance)}`}
                  />
                )}
              </div>
              {/* Legend */}
              <div className="flex items-center justify-between mt-1.5 text-[10px]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span className="text-slate-500">Paid</span>
                    <span className="font-semibold text-emerald-700">{formatINRShort(item.paid_amount)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                    <span className="text-slate-500">Billed</span>
                    <span className="font-semibold text-cyan-700">{formatINRShort(billedNotPaid)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                    <span className="text-slate-500">Remaining</span>
                    <span className="font-semibold text-rose-600">{formatINRShort(balance)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Line 4: Action Bar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onShowDetails(item)}
                className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded transition-colors"
              >
                <FileText className="w-3 h-3" /> {onTrackUpdate ? 'Edit Details' : 'Show Details'}
              </button>
              {onTrackUpdate && (
                <button
                  onClick={() => onTrackUpdate(item)}
                  className="flex items-center gap-1 text-[10px] font-medium text-amber-700 hover:text-white hover:bg-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded transition-colors"
                >
                  <ClipboardList className="w-3 h-3" /> Update Tracking
                </button>
              )}
              {onShowWorkOrders ? <button onClick={() => onShowWorkOrders(item)} className="flex items-center gap-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                Show CMS WOs <ChevronRight className="w-3 h-3" />
              </button> : <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">Show CMS WOs <ChevronRight className="w-3 h-3" /></span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
