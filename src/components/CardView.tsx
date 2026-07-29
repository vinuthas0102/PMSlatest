import { FileText, ChevronRight, MapPin } from 'lucide-react';
import type { BaseEntity } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface CardViewProps {
  items: BaseEntity[];
  onShowDetails: (item: BaseEntity) => void;
  onDrillDown: (item: BaseEntity) => void;
  drillLabel: string;
}

export function CardView({ items, onShowDetails, onDrillDown, drillLabel }: CardViewProps) {
  if (items.length === 0) {
    return <div className="p-4 text-center text-sm text-slate-500">No items match the current filters.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 p-2">
      {items.map((item) => {
        const colors = delayStatusColor(item.delay_status);
        const balance = item.mbook_entry - item.paid_amount;
        return (
          <div key={item.id} className="bg-white border border-slate-200 rounded p-2 flex flex-col hover:border-cyan-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {item.seq_no}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                {delayStatusShort(item.delay_status)}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-800 leading-tight mb-1 line-clamp-2">{item.title}</h3>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1.5">
              <MapPin className="w-3 h-3" />
              <span>{item.state} · {item.district}</span>
            </div>
            <div className="mb-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span>Progress</span>
                <span className="font-medium text-slate-700">{item.completed_pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${item.completed_pct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
              <div className="bg-blue-50 rounded px-1.5 py-1">
                <div className="text-slate-400">MBook</div>
                <div className="font-semibold text-blue-700">{formatINRShort(item.mbook_entry)}</div>
              </div>
              <div className="bg-cyan-50 rounded px-1.5 py-1">
                <div className="text-slate-400">Billed</div>
                <div className="font-semibold text-cyan-700">{formatINRShort(item.billed_amount)}</div>
              </div>
              <div className="bg-emerald-50 rounded px-1.5 py-1">
                <div className="text-slate-400">Paid</div>
                <div className="font-semibold text-emerald-700">{formatINRShort(item.paid_amount)}</div>
              </div>
              <div className="bg-red-50 rounded px-1.5 py-1">
                <div className="text-slate-400">Balance</div>
                <div className="font-semibold text-red-700">{formatINRShort(balance)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              <button
                onClick={() => onShowDetails(item)}
                className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-1.5 py-1 rounded transition-colors flex-1 justify-center"
              >
                <FileText className="w-3 h-3" /> Details
              </button>
              <button
                onClick={() => onDrillDown(item)}
                className="flex items-center gap-1 text-[10px] font-medium text-white bg-slate-700 hover:bg-slate-800 px-1.5 py-1 rounded transition-colors flex-1 justify-center"
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
