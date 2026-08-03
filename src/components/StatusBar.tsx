import { useState } from 'react';
import { ChevronDown, ChevronUp, Building2, Activity, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import type { BaseEntity, DelayStatus } from '@/types';
import { formatINRShort, delayStatusShort, DELAY_STATUSES } from '@/lib/format';

interface StatusBarProps {
  items: BaseEntity[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

interface DPCard {
  key: string;
  label: string;
  icon: typeof Building2;
  accent: string;        // border-l color
  gradFrom: string;      // gradient start
  gradTo: string;        // gradient end
  numColor: string;      // large count color
  barColor: string;      // progress bar fill
  iconBg: string;        // icon backdrop
  iconColor: string;
  borderColor: string;   // card outline
  hoverBorder: string;
}

const TOP_DPS: DPCard[] = [
  {
    key: 'total',
    label: 'Total Projects',
    icon: Building2,
    accent: 'border-l-slate-500',
    gradFrom: 'from-slate-50',
    gradTo: 'to-white',
    numColor: 'text-slate-700',
    barColor: 'bg-slate-500',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    hoverBorder: 'hover:border-slate-400',
  },
  {
    key: 'active',
    label: 'Active Projects',
    icon: Activity,
    accent: 'border-l-blue-500',
    gradFrom: 'from-blue-50',
    gradTo: 'to-white',
    numColor: 'text-blue-700',
    barColor: 'bg-blue-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    accent: 'border-l-emerald-500',
    gradFrom: 'from-emerald-50',
    gradTo: 'to-white',
    numColor: 'text-emerald-700',
    barColor: 'bg-emerald-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
  },
  {
    key: 'inprogress',
    label: 'In Progress',
    icon: Loader2,
    accent: 'border-l-cyan-500',
    gradFrom: 'from-cyan-50',
    gradTo: 'to-white',
    numColor: 'text-cyan-700',
    barColor: 'bg-cyan-500',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    borderColor: 'border-cyan-200',
    hoverBorder: 'hover:border-cyan-400',
  },
  {
    key: 'delayed',
    label: 'Delayed Projects',
    icon: AlertTriangle,
    accent: 'border-l-amber-500',
    gradFrom: 'from-amber-50',
    gradTo: 'to-white',
    numColor: 'text-amber-700',
    barColor: 'bg-amber-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    hoverBorder: 'hover:border-amber-400',
  },
];

interface SubConfig {
  accent: string;
  gradFrom: string;
  numColor: string;
  barColor: string;
  dotColor: string;
  borderColor: string;
  labelColor: string;
}

const SUB_CONFIG: Record<DelayStatus, SubConfig> = {
  'On Time': {
    accent: 'border-l-emerald-500',
    gradFrom: 'from-emerald-50',
    numColor: 'text-emerald-700',
    barColor: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
    borderColor: 'border-emerald-200',
    labelColor: 'text-emerald-700',
  },
  'Delayed - Warning': {
    accent: 'border-l-amber-400',
    gradFrom: 'from-amber-50',
    numColor: 'text-amber-700',
    barColor: 'bg-amber-400',
    dotColor: 'bg-amber-400',
    borderColor: 'border-amber-200',
    labelColor: 'text-amber-700',
  },
  'Delayed - Serious': {
    accent: 'border-l-orange-500',
    gradFrom: 'from-orange-50',
    numColor: 'text-orange-700',
    barColor: 'bg-orange-500',
    dotColor: 'bg-orange-500',
    borderColor: 'border-orange-200',
    labelColor: 'text-orange-700',
  },
  'Delayed - Critical': {
    accent: 'border-l-red-500',
    gradFrom: 'from-red-50',
    numColor: 'text-red-700',
    barColor: 'bg-red-500',
    dotColor: 'bg-red-500',
    borderColor: 'border-red-200',
    labelColor: 'text-red-700',
  },
};

const SUB_DPS: { key: DelayStatus; label: string }[] = [
  { key: 'On Time', label: 'On Time' },
  { key: 'Delayed - Warning', label: 'Warning' },
  { key: 'Delayed - Serious', label: 'Serious' },
  { key: 'Delayed - Critical', label: 'Critical' },
];

export function StatusBar({ items, activeFilter, onFilterChange }: StatusBarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const total = items.length;
  const completedItems = items.filter((i) => i.completed_pct >= 100);
  const activeItems = items.filter((i) => i.completed_pct < 100 && i.completed_pct > 0);
  const inProgressItems = items.filter((i) => i.completed_pct > 0 && i.completed_pct < 100);
  const delayedItems = items.filter((i) => i.delay_status !== 'On Time');

  const completed = completedItems.length;
  const active = activeItems.length;
  const inProgress = inProgressItems.length;
  const delayed = delayedItems.length;

  const totalFinancial = items.reduce((s, i) => s + i.mbook_entry, 0);
  const avgCompletion = total > 0 ? items.reduce((s, i) => s + i.completed_pct, 0) / total : 0;
  const avgOf = (arr: BaseEntity[]) => arr.length > 0 ? arr.reduce((s, i) => s + i.completed_pct, 0) / arr.length : 0;

  const stats: Record<string, { count: number; pct: number; value: number }> = {
    total: { count: total, pct: avgCompletion, value: totalFinancial },
    active: {
      count: active,
      pct: avgOf(activeItems),
      value: activeItems.reduce((s, i) => s + i.mbook_entry, 0),
    },
    completed: {
      count: completed,
      pct: completed > 0 ? 100 : 0,
      value: completedItems.reduce((s, i) => s + i.mbook_entry, 0),
    },
    inprogress: {
      count: inProgress,
      pct: avgOf(inProgressItems),
      value: inProgressItems.reduce((s, i) => s + i.mbook_entry, 0),
    },
    delayed: {
      count: delayed,
      pct: avgOf(delayedItems),
      value: delayedItems.reduce((s, i) => s + i.mbook_entry, 0),
    },
  };

  const subStats: Record<DelayStatus, { count: number; pct: number; value: number }> = {
    'On Time': {
      count: items.filter((i) => i.delay_status === 'On Time').length,
      pct: avgCompletion,
      value: items.filter((i) => i.delay_status === 'On Time').reduce((s, i) => s + i.mbook_entry, 0),
    },
    'Delayed - Warning': {
      count: items.filter((i) => i.delay_status === 'Delayed - Warning').length,
      pct: avgCompletion,
      value: items.filter((i) => i.delay_status === 'Delayed - Warning').reduce((s, i) => s + i.mbook_entry, 0),
    },
    'Delayed - Serious': {
      count: items.filter((i) => i.delay_status === 'Delayed - Serious').length,
      pct: avgCompletion,
      value: items.filter((i) => i.delay_status === 'Delayed - Serious').reduce((s, i) => s + i.mbook_entry, 0),
    },
    'Delayed - Critical': {
      count: items.filter((i) => i.delay_status === 'Delayed - Critical').length,
      pct: avgCompletion,
      value: items.filter((i) => i.delay_status === 'Delayed - Critical').reduce((s, i) => s + i.mbook_entry, 0),
    },
  };

  const handleCardClick = (key: string) => {
    if (key === 'inprogress' || key === 'delayed') {
      setExpanded(expanded === key ? null : key);
    }
    onFilterChange(activeFilter === key ? null : key);
  };

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top DP cards */}
      <div className="flex items-stretch gap-2 px-3 py-2 overflow-x-auto">
        {TOP_DPS.map((dp) => {
          const s = stats[dp.key];
          const isActive = activeFilter === dp.key;
          const Icon = dp.icon;
          const pct = Math.min(s.pct, 100);
          const canExpand = dp.key === 'inprogress' || dp.key === 'delayed';

          return (
            <button
              key={dp.key}
              onClick={() => handleCardClick(dp.key)}
              className={`
                relative flex flex-col justify-between overflow-hidden
                min-w-[158px] rounded-lg border-l-4 border border-r
                bg-gradient-to-br ${dp.gradFrom} ${dp.gradTo}
                ${dp.accent} ${dp.borderColor} ${dp.hoverBorder}
                transition-all duration-200
                ${isActive ? `ring-2 ring-offset-1 ring-cyan-400 shadow-md` : 'shadow-sm hover:shadow-md'}
                ${canExpand ? 'cursor-pointer' : 'cursor-default'}
              `}
              style={{
                boxShadow: isActive
                  ? undefined
                  : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(15,23,42,0.07)',
              }}
            >
              {/* Sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none rounded-lg" />

              <div className="relative px-3 pt-2.5 pb-1 flex items-start gap-2.5">
                {/* Icon badge */}
                <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${dp.iconBg}`}>
                  <Icon className={`w-4 h-4 ${dp.iconColor}`} />
                </div>

                {/* Text block */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none mb-1">
                    {dp.label}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-extrabold leading-none ${dp.numColor}`}>{s.count}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{s.pct.toFixed(0)}% done</span>
                  </div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${dp.numColor} opacity-80`}>
                    {formatINRShort(s.value)}
                  </div>
                </div>

                {/* Expand chevron */}
                {canExpand && (
                  <div className="shrink-0 mt-1">
                    {expanded === dp.key
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                )}
              </div>

              {/* Progress bar footer */}
              <div className="relative h-1.5 w-full bg-black/5 mt-1 rounded-b-lg overflow-hidden">
                <div
                  className={`h-full ${dp.barColor} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-DP cards */}
      {expanded && (
        <div className="flex items-stretch gap-2 px-3 pb-2 overflow-x-auto border-t border-slate-100 pt-1.5">
          {(expanded === 'inprogress' ? SUB_DPS : SUB_DPS.filter((s) => s.key !== 'On Time')).map((sub) => {
            const s = subStats[sub.key];
            const cfg = SUB_CONFIG[sub.key];
            const isActive = activeFilter === sub.key;
            const totalCount = Object.values(subStats).reduce((acc, v) => acc + v.count, 0);
            const barPct = totalCount > 0 ? (s.count / totalCount) * 100 : 0;

            return (
              <button
                key={sub.key}
                onClick={() => onFilterChange(activeFilter === sub.key ? null : sub.key)}
                className={`
                  relative flex flex-col justify-between overflow-hidden
                  min-w-[138px] rounded-lg border-l-4 border
                  bg-gradient-to-br ${cfg.gradFrom} to-white
                  ${cfg.accent} ${cfg.borderColor}
                  transition-all duration-200 shadow-sm hover:shadow-md
                  ${isActive ? 'ring-2 ring-offset-1 ring-cyan-400' : ''}
                `}
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(15,23,42,0.07)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none rounded-lg" />

                <div className="relative px-2.5 pt-2 pb-1 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dotColor}`} />
                  <div className="text-left">
                    <div className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.labelColor}`}>
                      {sub.label}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={`text-xl font-extrabold leading-none ${cfg.numColor}`}>{s.count}</span>
                      <span className="text-[10px] text-slate-400">{formatINRShort(s.value)}</span>
                    </div>
                  </div>
                </div>

                {/* Bar = proportion of total sub count */}
                <div className="relative h-1.5 w-full bg-black/5 mt-1 rounded-b-lg overflow-hidden">
                  <div
                    className={`h-full ${cfg.barColor} transition-all duration-500`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
