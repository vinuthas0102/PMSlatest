import { FileText, ChevronRight, MapPin, User, AlertTriangle, Ruler, CalendarClock } from 'lucide-react';
import type { BaseEntity } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface TileViewProps {
  items: BaseEntity[];
  onShowDetails: (item: BaseEntity) => void;
  onDrillDown: (item: BaseEntity) => void;
  drillLabel: string;
}

interface MiniColumnProps {
  label: string;
  value: number;
  max: number;
  color: string;
  textColor: string;
}

function MiniColumn({ label, value, max, color, textColor }: MiniColumnProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="text-[9px] font-bold text-slate-600 mb-0.5 whitespace-nowrap">{formatINRShort(value)}</div>
      <div className="w-full h-12 bg-slate-100 rounded-sm overflow-hidden flex items-end relative">
        <div
          className={`w-full rounded-t-sm ${color} transition-all duration-500`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <div className={`text-[9px] font-semibold ${textColor} mt-0.5 uppercase tracking-wide`}>{label}</div>
    </div>
  );
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
        const progressPct = Math.min(item.completed_pct, 100);
        const targetPct = Math.min(item.target_pct, 100);

        return (
          <div key={item.id} className="mirror-card rounded p-2">
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

            {/* Line 2: Physical Progress + deviation badges */}
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span className="font-medium text-slate-600">Physical Progress</span>
                  <span>
                    <span className="font-semibold text-cyan-700">{progressPct.toFixed(0)}%</span>
                    <span className="text-slate-400"> / target {targetPct.toFixed(0)}%</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  {/* Target marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60 z-10"
                    style={{ left: `${targetPct}%` }}
                  />
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                {item.spec_deviations > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    <AlertTriangle className="w-2.5 h-2.5" /> {item.spec_deviations} Spec
                  </span>
                )}
                {item.qty_deviations > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                    <Ruler className="w-2.5 h-2.5" /> {item.qty_deviations} Qty
                  </span>
                )}
                {item.extension_days > 0 && (
                  <span className="flex items-center gap-0.5 text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                    <CalendarClock className="w-2.5 h-2.5" /> {item.extension_days}d Ext
                  </span>
                )}
              </div>
            </div>

            {/* Line 3: Financial Mini Bar Charts (Vertical Columns) */}
            <div className="mt-1.5 bg-slate-50/70 rounded px-2 py-1.5 border border-slate-100">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Financial</div>
              <div className="flex items-end gap-1.5">
                <MiniColumn label="MBook" value={item.mbook_entry} max={item.mbook_entry} color="bg-blue-600" textColor="text-blue-700" />
                <MiniColumn label="Billed" value={item.billed_amount} max={item.mbook_entry} color="bg-cyan-500" textColor="text-cyan-700" />
                <MiniColumn label="Paid" value={item.paid_amount} max={item.mbook_entry} color="bg-emerald-500" textColor="text-emerald-700" />
                <MiniColumn label="Bal" value={balance} max={item.mbook_entry} color="bg-red-400" textColor="text-red-600" />
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
