import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Check, X, Filter } from 'lucide-react';
import type { BaseEntity, DelayStatus } from '@/types';
import { formatINRShort, CATEGORIES, delayStatusShort, DELAY_STATUSES } from '@/lib/format';

type FilterField = 'states' | 'categories' | 'delayStatuses';

interface ChartViewProps {
  items: BaseEntity[];
  selectedStates: string[];
  selectedCategories: string[];
  selectedDelayStatuses: DelayStatus[];
  onToggleSelection: (field: FilterField, value: string) => void;
}

type ChartType = 'bar' | 'pie';

const CHART_COLORS = ['#0891b2', '#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed'];
const STATUS_COLORS: Record<string, string> = {
  'On Time': '#059669',
  'Delayed - Warning': '#d97706',
  'Delayed - Serious': '#ea580c',
  'Delayed - Critical': '#dc2626',
};

const CHART_H = 300;

interface StatusInfo {
  onTime: number;
  warning: number;
  serious: number;
  critical: number;
}

interface ChartPoint {
  name: string;
  value: number;
  color: string;
  unit?: string;
  count: number;
  statuses: StatusInfo;
  filterField?: FilterField;
  filterValue?: string;
  selected?: boolean;
  anySelected?: boolean;
}

function computeStatuses(arr: BaseEntity[]): StatusInfo {
  return {
    onTime: arr.filter((i) => i.delay_status === 'On Time').length,
    warning: arr.filter((i) => i.delay_status === 'Delayed - Warning').length,
    serious: arr.filter((i) => i.delay_status === 'Delayed - Serious').length,
    critical: arr.filter((i) => i.delay_status === 'Delayed - Critical').length,
  };
}

function makePoint(
  name: string,
  value: number,
  color: string,
  subset: BaseEntity[],
  unit?: string,
  filterField?: FilterField,
  filterValue?: string,
  selected?: boolean,
  anySelected?: boolean,
): ChartPoint {
  return {
    name,
    value,
    color,
    unit,
    count: subset.length,
    statuses: computeStatuses(subset),
    filterField,
    filterValue,
    selected,
    anySelected,
  };
}

function StatusTooltip({
  active,
  payload,
  onToggle,
}: {
  active?: boolean;
  payload?: any[];
  onToggle?: (field: FilterField, value: string) => void;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as ChartPoint;
  const isMoney = p.unit === '₹';
  const display = isMoney ? formatINRShort(p.value) : p.value;
  const canSelect = !!p.filterField && !!p.filterValue;
  return (
    <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 px-3 py-2 text-xs min-w-[160px]">
      <div className="font-semibold text-slate-800 mb-0.5">{p.name}</div>
      <div className="text-slate-600 mb-1.5">
        {display} {isMoney ? '' : 'projects'}
      </div>
      <div className="pt-1.5 border-t border-slate-100 space-y-1">
        <div className="font-medium text-slate-500">Projects: {p.count}</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#059669' }} />On Time: {p.statuses.onTime}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#d97706' }} />Warning: {p.statuses.warning}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#ea580c' }} />Serious: {p.statuses.serious}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />Critical: {p.statuses.critical}</div>
        </div>
      </div>
      {canSelect && onToggle && (
        <button
          onClick={() => onToggle(p.filterField!, p.filterValue!)}
          className={`mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded transition-colors ${
            p.selected
              ? 'bg-cyan-600 text-white hover:bg-cyan-700'
              : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
          }`}
        >
          {p.selected ? <><Check className="w-3 h-3" /> Selected</> : <><Filter className="w-3 h-3" /> Select</>}
        </button>
      )}
    </div>
  );
}

function TimelineTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as any;
  const s = p.statuses as StatusInfo;
  return (
    <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 px-3 py-2 text-xs min-w-[150px]">
      <div className="font-semibold text-slate-800 mb-0.5">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="text-slate-600">
          {entry.name}: {entry.dataKey === 'Outflow' ? formatINRShort(entry.value) : entry.value}
        </div>
      ))}
      <div className="pt-1.5 mt-1.5 border-t border-slate-100 space-y-1">
        <div className="font-medium text-slate-500">Projects: {p.count}</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#059669' }} />On Time: {s.onTime}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#d97706' }} />Warning: {s.warning}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#ea580c' }} />Serious: {s.serious}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />Critical: {s.critical}</div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  chartType,
  onChartTypeChange,
  selectedCount,
  children,
}: {
  title: string;
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  selectedCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mirror-card rounded p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {selectedCount !== undefined && selectedCount > 0 && (
            <span className="text-[10px] font-bold bg-cyan-600 text-white px-1.5 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onChartTypeChange('bar')}
            className={`p-1 rounded ${chartType === 'bar' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChartTypeChange('pie')}
            className={`p-1 rounded ${chartType === 'pie' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <PieIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">{children}</div>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ChartView({
  items,
  selectedStates,
  selectedCategories,
  selectedDelayStatuses,
  onToggleSelection,
}: ChartViewProps) {
  const [chart1Type, setChart1Type] = useState<ChartType>('bar');
  const [chart2Type, setChart2Type] = useState<ChartType>('bar');
  const [chart3Type, setChart3Type] = useState<ChartType>('bar');
  const [chart4Type, setChart4Type] = useState<ChartType>('bar');
  const [chart5Type, setChart5Type] = useState<ChartType>('bar');
  const [timelineMode, setTimelineMode] = useState<'yearly' | 'monthly'>('monthly');

  const physicalData = useMemo<ChartPoint[]>(() => {
    const total = items;
    const active = items.filter((i) => i.completed_pct < 100 && i.completed_pct > 0);
    const completed = items.filter((i) => i.completed_pct >= 100);
    return [
      makePoint('Total', total.length, '#1e40af', total),
      makePoint('Active', active.length, '#0891b2', active),
      makePoint('Completed', completed.length, '#059669', completed),
    ];
  }, [items]);

  const deliveryData = useMemo<ChartPoint[]>(() => {
    const active = items.filter((i) => i.completed_pct < 100);
    return DELAY_STATUSES.map((status) => {
      const subset = active.filter((i) => i.delay_status === status);
      return makePoint(
        delayStatusShort(status),
        subset.length,
        STATUS_COLORS[status],
        subset,
        undefined,
        'delayStatuses',
        status,
        selectedDelayStatuses.includes(status),
        selectedDelayStatuses.length > 0,
      );
    });
  }, [items, selectedDelayStatuses]);

  const financialData = useMemo<ChartPoint[]>(() => {
    const mbook = items.reduce((s, i) => s + i.mbook_entry, 0);
    const billed = items.reduce((s, i) => s + i.billed_amount, 0);
    const paid = items.reduce((s, i) => s + i.paid_amount, 0);
    return [
      makePoint('Total Mbook', mbook, '#0891b2', items, '₹'),
      makePoint('Billed', billed, '#1e40af', items, '₹'),
      makePoint('Paid', paid, '#059669', items, '₹'),
    ];
  }, [items]);

  const regionData = useMemo<ChartPoint[]>(() => {
    const byState = new Map<string, BaseEntity[]>();
    items.forEach((i) => {
      const arr = byState.get(i.state) || [];
      arr.push(i);
      byState.set(i.state, arr);
    });
    const entries = Array.from(byState.entries()).sort((a, b) => b[1].length - a[1].length);
    const top5 = entries.slice(0, 5);
    const others = entries.slice(5);
    const data: ChartPoint[] = top5.map(([state, arr], idx) =>
      makePoint(
        state,
        arr.length,
        CHART_COLORS[idx % CHART_COLORS.length],
        arr,
        undefined,
        'states',
        state,
        selectedStates.includes(state),
        selectedStates.length > 0,
      ),
    );
    if (others.length) {
      const otherItems = others.flatMap(([, arr]) => arr);
      data.push(makePoint('Others', otherItems.length, '#94a3b8', otherItems));
    }
    return data;
  }, [items, selectedStates]);

  const categoryData = useMemo<ChartPoint[]>(() => {
    return CATEGORIES.map((cat, idx) => {
      const catItems = items.filter((i) => i.category === cat);
      return makePoint(
        cat,
        catItems.length,
        CHART_COLORS[idx % CHART_COLORS.length],
        catItems,
        undefined,
        'categories',
        cat,
        selectedCategories.includes(cat),
        selectedCategories.length > 0,
      );
    }).filter((d) => d.value > 0);
  }, [items, selectedCategories]);

  const timelineData = useMemo(() => {
    const labels = timelineMode === 'yearly' ? ['2023', '2024', '2025', '2026'] : MONTHS;
    const overallStatuses = computeStatuses(items);
    return labels.map((label, idx) => {
      const seed = idx + 1;
      const completedCount = Math.floor(items.filter((i) => i.completed_pct >= 100).length * (seed / 12));
      const activeCount = Math.min(
        items.length - completedCount,
        Math.max(1, Math.floor(items.length * (0.3 + (idx % 3) * 0.1))),
      );
      const outflow = items.reduce((s, i) => s + i.paid_amount, 0) * (seed / 12);
      return {
        name: label,
        Completed: completedCount,
        Active: activeCount,
        Outflow: Math.round(outflow),
        count: items.length,
        statuses: overallStatuses,
      };
    });
  }, [items, timelineMode]);

  const cellFill = (d: ChartPoint) => {
    if (d.filterField && d.anySelected && !d.selected) {
      return d.color + '40';
    }
    return d.color;
  };

  const renderBar = (data: ChartPoint[], money = false) => (
    <ResponsiveContainer width="100%" height={CHART_H}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (money ? formatINRShort(v) : v)} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} content={<StatusTooltip onToggle={onToggleSelection} />} />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          barSize={50}
          maxBarSize={60}
          cursor={data.some((d) => d.filterField) ? 'pointer' : undefined}
          onClick={(_payload: any, idx: number) => {
            const d = data[idx];
            if (d.filterField && d.filterValue) onToggleSelection(d.filterField, d.filterValue);
          }}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={cellFill(d)}
              stroke={d.selected ? '#0891b2' : 'none'}
              strokeWidth={d.selected ? 2 : 0}
              className={d.filterField ? 'cursor-pointer' : ''}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPie = (data: ChartPoint[], money = false) => (
    <ResponsiveContainer width="100%" height={CHART_H}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={45}
          label={(e: any) => (money ? `${e.name}` : `${e.name}: ${e.value}`)}
          cursor={data.some((d) => d.filterField) ? 'pointer' : undefined}
          onClick={(_: any, idx: number) => {
            const d = data[idx];
            if (d.filterField && d.filterValue) onToggleSelection(d.filterField, d.filterValue);
          }}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={cellFill(d)}
              stroke={d.selected ? '#0891b2' : '#fff'}
              strokeWidth={d.selected ? 3 : 1}
              className={d.filterField ? 'cursor-pointer' : ''}
            />
          ))}
        </Pie>
        <Tooltip content={<StatusTooltip onToggle={onToggleSelection} />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderTimelineChart = () => (
    <ResponsiveContainer width="100%" height={CHART_H}>
      <ComposedChart data={timelineData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => formatINRShort(v)} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} content={<TimelineTooltip />} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar yAxisId="left" dataKey="Completed" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} barSize={30} maxBarSize={40} />
        <Bar yAxisId="left" dataKey="Active" stackId="a" fill="#0891b2" radius={[6, 6, 0, 0]} barSize={30} maxBarSize={40} />
        <Line yAxisId="right" type="monotone" dataKey="Outflow" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const allChips: { field: FilterField; label: string; value: string }[] = [
    ...selectedStates.map((s) => ({ field: 'states' as FilterField, label: s, value: s })),
    ...selectedCategories.map((c) => ({ field: 'categories' as FilterField, label: c, value: c })),
    ...selectedDelayStatuses.map((d) => ({ field: 'delayStatuses' as FilterField, label: delayStatusShort(d), value: d })),
  ];

  const hasSelections = allChips.length > 0;

  return (
    <div>
      {hasSelections && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 flex-wrap bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
            <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wide flex items-center gap-1">
              <Filter className="w-3 h-3" /> Active Selections:
            </span>
            {allChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => onToggleSelection(chip.field, chip.value)}
                className="flex items-center gap-1 text-[11px] font-medium bg-white text-cyan-700 border border-cyan-300 rounded-full px-2 py-0.5 hover:bg-cyan-100 transition-colors"
              >
                {chip.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={() => allChips.forEach((c) => onToggleSelection(c.field, c.value))}
              className="text-[11px] font-medium text-red-500 hover:text-red-700 flex items-center gap-0.5 ml-auto"
            >
              <X className="w-3 h-3" /> Clear All
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
        {/* Row 1 */}
        <ChartCard title="Project Status" chartType={chart1Type} onChartTypeChange={setChart1Type}>
          {chart1Type === 'bar' ? renderBar(physicalData) : renderPie(physicalData)}
        </ChartCard>
        <ChartCard title="Delivery Status" chartType={chart2Type} onChartTypeChange={setChart2Type} selectedCount={selectedDelayStatuses.length}>
          {chart2Type === 'bar' ? renderBar(deliveryData) : renderPie(deliveryData)}
        </ChartCard>
        <ChartCard title="Financial Progress (₹)" chartType={chart3Type} onChartTypeChange={setChart3Type}>
          {chart3Type === 'bar' ? renderBar(financialData, true) : renderPie(financialData, true)}
        </ChartCard>

        {/* Row 2 */}
        <ChartCard title="Region-wise" chartType={chart4Type} onChartTypeChange={setChart4Type} selectedCount={selectedStates.length}>
          {chart4Type === 'bar' ? renderBar(regionData) : renderPie(regionData)}
        </ChartCard>
        <ChartCard title="Category-wise" chartType={chart5Type} onChartTypeChange={setChart5Type} selectedCount={selectedCategories.length}>
          {chart5Type === 'bar' ? renderBar(categoryData) : renderPie(categoryData)}
        </ChartCard>
        <div className="mirror-card rounded p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Timeline Trend</h3>
            <div className="flex items-center bg-slate-100 rounded text-[11px]">
              {(['yearly', 'monthly'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTimelineMode(m)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${timelineMode === m ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  {m === 'yearly' ? 'Year' : 'Month'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">{renderTimelineChart()}</div>
        </div>
      </div>
    </div>
  );
}
