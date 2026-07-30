import { useState } from 'react';
import { ChevronDown, ChevronUp, Building2, Activity, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import type { BaseEntity, DelayStatus } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort, DELAY_STATUSES } from '@/lib/format';

interface StatusBarProps {
  items: BaseEntity[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

interface DPCard {
  key: string;
  label: string;
  icon: typeof Building2;
  iconColor: string;
}

const TOP_DPS: DPCard[] = [
  { key: 'total', label: 'Total Projects', icon: Building2, iconColor: 'text-slate-600' },
  { key: 'active', label: 'Active Projects', icon: Activity, iconColor: 'text-blue-600' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, iconColor: 'text-emerald-600' },
  { key: 'inprogress', label: 'In Progress', icon: Loader2, iconColor: 'text-cyan-600' },
  { key: 'delayed', label: 'Delayed Projects', icon: AlertTriangle, iconColor: 'text-amber-600' },
];

const SUB_DPS: { key: DelayStatus; label: string }[] = [
  { key: 'On Time', label: 'On Time' },
  { key: 'Delayed - Warning', label: 'Warning' },
  { key: 'Delayed - Serious', label: 'Serious' },
  { key: 'Delayed - Critical', label: 'Critical' },
];

export function StatusBar({ items, activeFilter, onFilterChange }: StatusBarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const total = items.length;
  const completed = items.filter((i) => i.completed_pct >= 100).length;
  const active = items.filter((i) => i.completed_pct < 100 && i.completed_pct > 0).length;
  const inProgress = items.filter((i) => i.completed_pct > 0 && i.completed_pct < 100).length;
  const delayed = items.filter((i) => i.delay_status !== 'On Time').length;

  const totalFinancial = items.reduce((s, i) => s + i.mbook_entry, 0);
  const avgCompletion = total > 0 ? items.reduce((s, i) => s + i.completed_pct, 0) / total : 0;

  const stats: Record<string, { count: number; pct: number; value: number }> = {
    total: { count: total, pct: avgCompletion, value: totalFinancial },
    active: { count: active, pct: avgCompletion, value: items.filter((i) => i.completed_pct < 100 && i.completed_pct > 0).reduce((s, i) => s + i.mbook_entry, 0) },
    completed: { count: completed, pct: 100, value: items.filter((i) => i.completed_pct >= 100).reduce((s, i) => s + i.mbook_entry, 0) },
    inprogress: { count: inProgress, pct: avgCompletion, value: items.filter((i) => i.completed_pct > 0 && i.completed_pct < 100).reduce((s, i) => s + i.mbook_entry, 0) },
    delayed: { count: delayed, pct: avgCompletion, value: items.filter((i) => i.delay_status !== 'On Time').reduce((s, i) => s + i.mbook_entry, 0) },
  };

  const subStats: Record<DelayStatus, { count: number; pct: number; value: number }> = {
    'On Time': { count: items.filter((i) => i.delay_status === 'On Time').length, pct: avgCompletion, value: items.filter((i) => i.delay_status === 'On Time').reduce((s, i) => s + i.mbook_entry, 0) },
    'Delayed - Warning': { count: items.filter((i) => i.delay_status === 'Delayed - Warning').length, pct: avgCompletion, value: items.filter((i) => i.delay_status === 'Delayed - Warning').reduce((s, i) => s + i.mbook_entry, 0) },
    'Delayed - Serious': { count: items.filter((i) => i.delay_status === 'Delayed - Serious').length, pct: avgCompletion, value: items.filter((i) => i.delay_status === 'Delayed - Serious').reduce((s, i) => s + i.mbook_entry, 0) },
    'Delayed - Critical': { count: items.filter((i) => i.delay_status === 'Delayed - Critical').length, pct: avgCompletion, value: items.filter((i) => i.delay_status === 'Delayed - Critical').reduce((s, i) => s + i.mbook_entry, 0) },
  };

  const handleCardClick = (key: string) => {
    if (key === 'inprogress' || key === 'delayed') {
      setExpanded(expanded === key ? null : key);
    }
    onFilterChange(activeFilter === key ? null : key);
  };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex items-stretch gap-1.5 px-3 py-1.5 overflow-x-auto">
        {TOP_DPS.map((dp) => {
          const s = stats[dp.key];
          const isActive = activeFilter === dp.key;
          const Icon = dp.icon;
          return (
            <button
              key={dp.key}
              onClick={() => handleCardClick(dp.key)}
              className={`mirror-card flex items-center gap-2 px-2.5 py-1.5 rounded min-w-[150px] ${isActive ? 'ring-2 ring-cyan-500 ring-offset-1' : ''} ${(dp.key === 'inprogress' || dp.key === 'delayed') ? 'cursor-pointer' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${dp.iconColor}`} />
              <div className="text-left leading-tight">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{dp.label}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-slate-800">{s.count}</span>
                  <span className="text-[10px] text-slate-500">{s.pct.toFixed(0)}% done</span>
                </div>
                <div className="text-[10px] font-medium text-slate-600">{formatINRShort(s.value)}</div>
              </div>
              {(dp.key === 'inprogress' || dp.key === 'delayed') && (
                expanded === dp.key
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
              )}
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="flex items-stretch gap-1.5 px-3 pb-1.5 overflow-x-auto border-t border-slate-100 pt-1.5">
          {(expanded === 'inprogress' ? SUB_DPS : SUB_DPS.filter((s) => s.key !== 'On Time')).map((sub) => {
            const s = subStats[sub.key];
            const colors = delayStatusColor(sub.key);
            const isActive = activeFilter === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => onFilterChange(activeFilter === sub.key ? null : sub.key)}
                className={`mirror-card flex items-center gap-2 px-2.5 py-1.5 rounded min-w-[130px] ${isActive ? 'ring-2 ring-cyan-500 ring-offset-1' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{sub.label}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-slate-800">{s.count}</span>
                    <span className="text-[10px] text-slate-500">{formatINRShort(s.value)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
