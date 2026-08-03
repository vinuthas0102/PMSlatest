import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, RefreshCw } from 'lucide-react';
import type { BaseEntity } from '@/types';
import { formatINRShort, CATEGORIES, delayStatusColor } from '@/lib/format';

interface ChartViewProps {
  items: BaseEntity[];
  onCategoryClick: (category: string) => void;
}

type ChartType = 'bar' | 'pie' | 'line';

const CHART_COLORS = ['#0891b2', '#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed'];
const STATUS_COLORS: Record<string, string> = {
  'On Time': '#059669',
  'Delayed - Warning': '#d97706',
  'Delayed - Serious': '#ea580c',
  'Delayed - Critical': '#dc2626',
};

const CHART_H = 260;

function ChartCard({
  title,
  chartType,
  onChartTypeChange,
  children,
}: {
  title: string;
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mirror-card rounded p-2 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onChartTypeChange('bar')}
            className={`p-1 rounded ${chartType === 'bar' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChartTypeChange('pie')}
            className={`p-1 rounded ${chartType === 'pie' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <PieIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChartTypeChange('line')}
            className={`p-1 rounded ${chartType === 'line' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <LineIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-[260px]">{children}</div>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ChartView({ items, onCategoryClick }: ChartViewProps) {
  const [chart1Type, setChart1Type] = useState<ChartType>('bar');
  const [chart2Type, setChart2Type] = useState<ChartType>('bar');
  const [chart3Type, setChart3Type] = useState<ChartType>('pie');
  const [chart4Type, setChart4Type] = useState<ChartType>('bar');
  const [timelineMode, setTimelineMode] = useState<'yearly' | 'monthly'>('monthly');

  const physicalData = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.completed_pct < 100 && i.completed_pct > 0).length;
    const completed = items.filter((i) => i.completed_pct >= 100).length;
    return [
      { name: 'Total', value: total, color: '#1e40af' },
      { name: 'Active', value: active, color: '#0891b2' },
      { name: 'Completed', value: completed, color: '#059669' },
    ];
  }, [items]);

  const financialData = useMemo(() => {
    const mbook = items.reduce((s, i) => s + i.mbook_entry, 0);
    const billed = items.reduce((s, i) => s + i.billed_amount, 0);
    const paid = items.reduce((s, i) => s + i.paid_amount, 0);
    return [
      { name: 'Total Mbook', value: mbook, color: '#0891b2' },
      { name: 'Billed', value: billed, color: '#1e40af' },
      { name: 'Paid', value: paid, color: '#059669' },
    ];
  }, [items]);

  const categoryData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      return {
        name: cat,
        value: catItems.length,
        financial: catItems.reduce((s, i) => s + i.mbook_entry, 0),
        color: CHART_COLORS[CATEGORIES.indexOf(cat) % CHART_COLORS.length],
      };
    }).filter((d) => d.value > 0);
  }, [items]);

  const timelineData = useMemo(() => {
    const labels = timelineMode === 'yearly'
      ? ['2023', '2024', '2025', '2026']
      : MONTHS;

    return labels.map((label, idx) => {
      const seed = idx + 1;
      const completedCount = Math.floor(items.filter((i) => i.completed_pct >= 100).length * (seed / 12));
      const activeCount = Math.min(
        items.length - completedCount,
        Math.max(1, Math.floor(items.length * (0.3 + (idx % 3) * 0.1)))
      );
      const outflow = items.reduce((s, i) => s + i.paid_amount, 0) * (seed / 12);
      return {
        name: label,
        Completed: completedCount,
        Active: activeCount,
        Outflow: Math.round(outflow),
      };
    });
  }, [items, timelineMode]);

  const renderPhysicalChart = () => {
    if (chart1Type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <PieChart>
            <Pie data={physicalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={(e) => `${e.name}: ${e.value}`}>
              {physicalData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (chart1Type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <BarChart data={physicalData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50} maxBarSize={60}>
              {physicalData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={CHART_H}>
        <LineChart data={physicalData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line dataKey="value" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderFinancialChart = () => {
    if (chart2Type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <BarChart data={financialData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} angle={-20} textAnchor="end" height={50} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatINRShort(v)} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} formatter={(v: number) => formatINRShort(v)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} maxBarSize={50}>
              {financialData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chart2Type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <PieChart>
            <Pie data={financialData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={(e) => `${e.name}: ${formatINRShort(e.value as number)}`}>
              {financialData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v: number) => formatINRShort(v)} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={CHART_H}>
        <LineChart data={financialData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatINRShort(v)} />
          <Tooltip formatter={(v: number) => formatINRShort(v)} />
          <Line dataKey="value" stroke="#1e40af" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderCategoryChart = () => {
    if (chart3Type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={(e) => e.name} onClick={(_, idx) => onCategoryClick(categoryData[idx].name)}>
              {categoryData.map((d, i) => <Cell key={i} fill={d.color} className="cursor-pointer" />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (chart3Type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={CHART_H}>
          <BarChart data={categoryData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} angle={-20} textAnchor="end" height={50} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} maxBarSize={50} onClick={(_, idx) => onCategoryClick(categoryData[idx].name)} className="cursor-pointer">
              {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={CHART_H}>
        <LineChart data={categoryData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line dataKey="value" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderTimelineChart = () => {
    return (
      <ResponsiveContainer width="100%" height={CHART_H}>
        <ComposedChart data={timelineData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => formatINRShort(v)} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar yAxisId="left" dataKey="Completed" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} barSize={30} maxBarSize={40} />
          <Bar yAxisId="left" dataKey="Active" stackId="a" fill="#0891b2" radius={[6, 6, 0, 0]} barSize={30} maxBarSize={40} />
          <Line yAxisId="right" type="monotone" dataKey="Outflow" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1.5 p-2">
      <ChartCard title="Project Status" chartType={chart1Type} onChartTypeChange={setChart1Type}>
        {renderPhysicalChart()}
      </ChartCard>
      <ChartCard title="Financial Progress (₹)" chartType={chart2Type} onChartTypeChange={setChart2Type}>
        {renderFinancialChart()}
      </ChartCard>
      <ChartCard title="Category Breakdown" chartType={chart3Type} onChartTypeChange={setChart3Type}>
        {renderCategoryChart()}
      </ChartCard>
      <div className="mirror-card rounded p-2 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-semibold text-slate-700">Timeline Trend</h3>
          <div className="flex items-center bg-slate-100 rounded text-[10px]">
            {(['yearly', 'monthly'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTimelineMode(m)}
                className={`px-1.5 py-0.5 rounded font-medium capitalize transition-colors ${timelineMode === m ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                {m === 'yearly' ? 'Year' : 'Month'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-[260px]">{renderTimelineChart()}</div>
      </div>
    </div>
  );
}
