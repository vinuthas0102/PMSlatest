import { BarChart3, LayoutGrid, Table2, CreditCard, SlidersHorizontal } from 'lucide-react';
import type { ViewType } from '@/types';

interface ViewControlsProps {
  viewType: ViewType;
  onViewTypeChange: (v: ViewType) => void;
  isFiltered: boolean;
  onOpenFilterDrawer: () => void;
  onClearFilters: () => void;
  levelLabel: string;
}

const VIEWS: { key: ViewType; label: string; icon: typeof BarChart3 }[] = [
  { key: 'chart', label: 'Chart View', icon: BarChart3 },
  { key: 'tile', label: 'Tile View', icon: LayoutGrid },
  { key: 'table', label: 'Table View', icon: Table2 },
  { key: 'card', label: 'Card View', icon: CreditCard },
];

export function ViewControls({
  viewType,
  onViewTypeChange,
  isFiltered,
  onOpenFilterDrawer,
  onClearFilters,
  levelLabel,
}: ViewControlsProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-800 tracking-tight">
          {levelLabel}
        </span>
        <span className="text-slate-300">|</span>
        {isFiltered ? (
          <button
            onClick={onClearFilters}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 underline decoration-cyan-400 decoration-2 underline-offset-2 transition-colors"
          >
            Filtered Data (click to show ALL)
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            ALL Data
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const isActive = viewType === v.key;
            return (
              <button
                key={v.key}
                onClick={() => onViewTypeChange(v.key)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenFilterDrawer}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
    </div>
  );
}
