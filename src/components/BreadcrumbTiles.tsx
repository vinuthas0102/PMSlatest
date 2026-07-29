import { ArrowLeft, FileText } from 'lucide-react';
import type { BaseEntity } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface BreadcrumbTilesProps {
  parents: { label: string; item: BaseEntity; level: string }[];
  onBack: (level: string) => void;
  onShowDetails: (item: BaseEntity, level: string) => void;
}

export function BreadcrumbTiles({ parents, onBack, onShowDetails }: BreadcrumbTilesProps) {
  if (parents.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-3 pt-1.5">
      {parents.map((p) => {
        const colors = delayStatusColor(p.item.delay_status);
        return (
          <div
            key={p.item.id}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                {p.item.seq_no}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase">{p.label}</span>
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 truncate">{p.item.title}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                {delayStatusShort(p.item.delay_status)}
              </span>
              <span className="text-[10px] text-slate-500 hidden md:inline">
                {p.item.completed_pct.toFixed(0)}% / {p.item.target_pct.toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 hidden lg:inline">{formatINRShort(p.item.mbook_entry)}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onShowDetails(p.item, p.level)}
                className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-1.5 py-0.5 rounded transition-colors"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Show Details</span>
              </button>
              <button
                onClick={() => onBack(p.level)}
                className="flex items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Back to {p.label}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
