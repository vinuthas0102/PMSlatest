import { FileText, MapPin, FilePlus, Wrench } from 'lucide-react';
import type { BaseEntity } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface CardViewProps {
  items: BaseEntity[];
  onShowDetails: (item: BaseEntity) => void;
  onMaintainProject?: (item: BaseEntity) => void;
  onCreateNew?: () => void;
}

export function CardView({ items, onShowDetails, onMaintainProject, onCreateNew }: CardViewProps) {
  return (
    <div className="p-2">
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 px-4 py-2 rounded-lg transition-colors mb-3 ml-auto shadow-sm"
        >
          <FilePlus className="w-4 h-4" />
          Create New Project
        </button>
      )}
      {items.length === 0 && (
        <div className="text-center text-sm text-slate-500 py-6">
          {onCreateNew ? 'No projects yet. Click "Create New Project" to add one.' : 'No items match the current filters.'}
        </div>
      )}
      {items.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {items.map((item) => {
        const colors = delayStatusColor(item.delay_status);
        const balance = Math.max(0, item.mbook_entry - item.paid_amount);
        const billedNotPaid = Math.max(0, item.billed_amount - item.paid_amount);
        const base = Math.max(1, item.project_value);
        const paidPct = Math.min(100, (item.paid_amount / base) * 100);
        const billedNotPaidPct = Math.min(100 - paidPct, (billedNotPaid / base) * 100);
        const remPct = Math.max(0, 100 - paidPct - billedNotPaidPct);

        return (
          <div
            key={item.id}
            className={`mirror-card rounded-r-lg rounded-l-sm p-3 flex flex-col gap-2 border-l-4 ${colors.borderAccent}`}
          >
            {/* Header: seq + status badge */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {item.seq_no}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                {delayStatusShort(item.delay_status)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">{item.title}</h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <MapPin className="w-3 h-3" />
              <span>{item.state} · {item.district}</span>
            </div>

            {/* Category */}
            <div className="text-[10px] text-slate-500">
              <span className="font-medium text-slate-600">{item.category}</span>
            </div>

            {/* Physical Progress */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span className="font-semibold text-slate-600">Physical Progress</span>
                </span>
                <span className="font-semibold text-slate-700">{item.completed_pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{ width: `${item.completed_pct}%` }}
                />
                {item.target_pct > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-500"
                    style={{ left: `${Math.min(item.target_pct, 100)}%` }}
                  />
                )}
              </div>
              {item.target_pct > 0 && (
                <div className="text-right text-[9px] text-slate-400 mt-0.5">Target: {item.target_pct.toFixed(0)}%</div>
              )}
            </div>

            {/* Financial: single stacked bar */}
            <div className="bg-slate-50/80 rounded px-2 py-1.5 border border-slate-200">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-600">Financial Progress</span>
                </span>
                <span className="font-semibold text-slate-700">
                  {item.project_value > 0 ? ((item.paid_amount / item.project_value) * 100).toFixed(0) : 0}%
                  {item.target_pct > 0 && (
                    <span className="text-slate-400 font-normal ml-1">/ target {item.target_pct.toFixed(0)}%</span>
                  )}
                </span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                {paidPct > 0 && (
                  <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${paidPct}%` }} />
                )}
                {billedNotPaidPct > 0 && (
                  <div className="bg-cyan-500 transition-all duration-500" style={{ width: `${billedNotPaidPct}%` }} />
                )}
                {remPct > 0 && (
                  <div className="bg-rose-400 transition-all duration-500" style={{ width: `${remPct}%` }} />
                )}
              </div>
              <div className="flex items-center justify-between mt-1 text-[9px]">
                <span className="flex items-center gap-0.5">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="font-semibold text-emerald-700">{formatINRShort(item.paid_amount)}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-2 h-2 rounded-sm bg-cyan-500" />
                  <span className="font-semibold text-cyan-700">{formatINRShort(billedNotPaid)}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-2 h-2 rounded-sm bg-rose-400" />
                  <span className="font-semibold text-rose-600">{formatINRShort(balance)}</span>
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5 text-[9px] text-slate-400">
                <span>Project: {formatINRShort(item.project_value)}</span>
                <span>MBook: {formatINRShort(item.mbook_entry)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 mt-auto">
              <button
                onClick={() => onShowDetails(item)}
                className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 border border-cyan-200 px-1.5 py-1 rounded transition-colors flex-1 justify-center"
              >
                <FileText className="w-3 h-3" /> Show Project
              </button>
              {onMaintainProject && (
                <button
                  onClick={() => onMaintainProject(item)}
                  className="flex items-center gap-1 text-[10px] font-medium text-amber-700 hover:text-white hover:bg-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-1 rounded transition-colors flex-1 justify-center"
                >
                  <Wrench className="w-3 h-3" /> Maintain
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
      )}
    </div>
  );
}
