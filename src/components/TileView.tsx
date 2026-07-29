import { FileText, ChevronRight, MapPin, User, AlertTriangle, Ruler, CalendarClock } from 'lucide-react';
import type { BaseEntity } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface TileViewProps {
  items: BaseEntity[];
  onShowDetails: (item: BaseEntity) => void;
  onDrillDown: (item: BaseEntity) => void;
  drillLabel: string;
}

export function TileView({ items, onShowDetails, onDrillDown, drillLabel }: TileViewProps) {
  if (items.length === 0) {
    return <div className="p-4 text-center text-sm text-slate-500">No items match the current filters.</div>;
  }

  return (
    <div className="flex flex-col gap-1.5 p-2">
      {items.map((item) => {
        const colors = delayStatusColor(item.delay_status);
        const balance = item.mbook_entry - item.paid_amount;
        const mbookPct = item.mbook_entry > 0 ? 100 : 0;
        const billedPct = item.mbook_entry > 0 ? (item.billed_amount / item.mbook_entry) * 100 : 0;
        const paidPct = item.mbook_entry > 0 ? (item.paid_amount / item.mbook_entry) * 100 : 0;
        const progressPct = Math.min(item.completed_pct, 100);

        return (
          <div key={item.id} className="bg-white border border-slate-200 rounded p-2 hover:border-cyan-300 transition-colors">
            {/* Line 1: Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Seq # {item.seq_no}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                {delayStatusShort(item.delay_status)}
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate flex-1 min-w-0">{item.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">{item.code}</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <User className="w-3 h-3" />
                <span>{item.manager}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{item.state} · {item.district}</span>
              </div>
            </div>

            {/* Line 2: Physical Progress */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span>Physical: {item.completed_pct.toFixed(0)}% / Target: {item.target_pct.toFixed(0)}%</span>
                  <span className="font-medium text-slate-600">{progressPct.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${progressPct}%` }} />
                  <div className="h-full bg-slate-300" style={{ width: `${Math.max(0, item.target_pct - progressPct)}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                {item.spec_deviations > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-2.5 h-2.5" /> {item.spec_deviations} Spec
                  </span>
                )}
                {item.qty_deviations > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                    <Ruler className="w-2.5 h-2.5" /> {item.qty_deviations} Qty
                  </span>
                )}
                {item.extension_days > 0 && (
                  <span className="flex items-center gap-0.5 text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    <CalendarClock className="w-2.5 h-2.5" /> {item.extension_days}d Ext
                  </span>
                )}
              </div>
            </div>

            {/* Line 3: Financial Progress */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 min-w-0">
                <div className="h-2.5 flex rounded-full overflow-hidden bg-slate-100">
                  <div className="h-full bg-blue-700" style={{ width: `${mbookPct}%` }} title="MBook" />
                  <div className="h-full bg-cyan-500" style={{ width: `${billedPct}%` }} title="Billed" />
                  <div className="h-full bg-emerald-500" style={{ width: `${paidPct}%` }} title="Paid" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] shrink-0">
                <span className="text-blue-700 font-medium">MBook {formatINRShort(item.mbook_entry)}</span>
                <span className="text-cyan-600 font-medium">Billed {formatINRShort(item.billed_amount)}</span>
                <span className="text-emerald-600 font-medium">Paid {formatINRShort(item.paid_amount)}</span>
                <span className="text-red-600 font-medium">Bal {formatINRShort(balance)}</span>
              </div>
            </div>

            {/* Line 4: Action Bar */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                onClick={() => onShowDetails(item)}
                className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2 py-1 rounded transition-colors"
              >
                <FileText className="w-3 h-3" /> Show Details
              </button>
              <button
                onClick={() => onDrillDown(item)}
                className="flex items-center gap-1 text-[10px] font-medium text-white bg-slate-700 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
              >
                {drillLabel} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
