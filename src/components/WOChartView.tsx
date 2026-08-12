import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import type { PaymentEntry, WorkOrder, WorkOrderDetail } from '@/types';
import { formatINR, formatINRShort, DELAY_STATUSES, delayStatusShort } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  'On Time': '#059669',
  'Delayed - Warning': '#d97706',
  'Delayed - Serious': '#ea580c',
  'Delayed - Critical': '#dc2626',
};

const CHART_H = 260;

type ChartType = 'bar' | 'pie';

function ChartCard({
  title,
  chartType,
  onChartTypeChange,
  subtitle,
  children,
}: {
  title: string;
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mirror-card rounded border-t-2 border-t-cyan-600 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{subtitle}</p>}
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
      <div className="flex-1 min-h-[260px]">{children}</div>
    </div>
  );
}

interface WOChartViewProps {
  workOrders: WorkOrder[];
  workOrderDetails?: WorkOrderDetail[];
  paymentEntries?: PaymentEntry[];
}

export function WOChartView({ workOrders, workOrderDetails = [], paymentEntries = [] }: WOChartViewProps) {
  const [scheduleType, setScheduleType] = useState<ChartType>('bar');
  const [financialType, setFinancialType] = useState<ChartType>('bar');
  const [physicalType, setPhysicalType] = useState<ChartType>('bar');

  const scheduleData = useMemo(() => {
    return DELAY_STATUSES.map((status) => ({
      name: delayStatusShort(status),
      value: workOrders.filter((w) => w.delay_status === status).length,
      color: STATUS_COLORS[status],
    }));
  }, [workOrders]);

  const safeNum = (v: number | null | undefined): number => (typeof v === 'number' && !isNaN(v) ? v : 0);

  const financialData = useMemo(() => {
    const totalWOValue = workOrders.reduce((s, w) => {
      const approvedValue = workOrderDetails.find((d) => d.work_order_id === w.id)?.wo_value ?? w.project_value;
      return s + safeNum(approvedValue);
    }, 0);
    const billed = workOrders.reduce((s, w) => s + safeNum(w.billed_amount), 0);
    const paid = workOrders.reduce((s, w) => {
      const entries = paymentEntries.filter((p) => p.work_order_id === w.id);
      const cumulative = entries.length ? Math.max(...entries.map((p) => safeNum(p.cumulative_paid))) : safeNum(w.paid_amount);
      return s + cumulative;
    }, 0);
    return [
      { name: 'WO Value', value: totalWOValue, color: '#1e40af', raw: totalWOValue },
      { name: 'Billed', value: billed, color: '#0891b2', raw: billed },
      { name: 'Paid', value: paid, color: '#059669', raw: paid },
    ];
  }, [workOrders, workOrderDetails, paymentEntries]);

  const totalWOValue = workOrders.reduce((s, w) => {
    const approvedValue = workOrderDetails.find((d) => d.work_order_id === w.id)?.wo_value ?? w.project_value;
    return s + safeNum(approvedValue);
  }, 0);

  const physicalData = useMemo(() => {
    const avgTarget = workOrders.length > 0 ? workOrders.reduce((s, w) => s + safeNum(w.target_pct), 0) / workOrders.length : 0;
    const avgActual = workOrders.length > 0 ? workOrders.reduce((s, w) => s + safeNum(w.completed_pct), 0) / workOrders.length : 0;
    return [
      { name: 'Target', value: Number(avgTarget.toFixed(1)), color: '#1e40af' },
      { name: 'Actual', value: Number(avgActual.toFixed(1)), color: '#0891b2' },
    ];
  }, [workOrders]);

  const renderBar = (data: { name: string; value: number; color: string }[], money = false, percent = false) => (
    <ResponsiveContainer width="100%" height={CHART_H}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis domain={percent ? [0, 100] : undefined} tick={{ fontSize: 10 }} tickFormatter={(v) => (money ? formatINRShort(v) : percent ? `${v}%` : v)} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50} maxBarSize={60}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPie = (data: { name: string; value: number; color: string }[], money = false, percent = false) => (
    <ResponsiveContainer width="100%" height={CHART_H}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={40}
          label={(e: any) => (money ? formatINRShort(e.value) : percent ? `${e.value}%` : e.value)}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} stroke="#fff" strokeWidth={1} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => (money ? formatINR(v) : `${v}`)} />
      </PieChart>
    </ResponsiveContainer>
  );

  if (workOrders.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 py-8">
        No work orders found. Click "Create Agency" to add one.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
      <ChartCard title="Schedule Status" chartType={scheduleType} onChartTypeChange={setScheduleType} subtitle="WO count by delay severity">
        {scheduleType === 'bar' ? renderBar(scheduleData) : renderPie(scheduleData)}
      </ChartCard>
      <ChartCard title="Financial Progress" chartType={financialType} onChartTypeChange={setFinancialType} subtitle={`Total WO Value: ${formatINRShort(totalWOValue)}`}>
        {financialType === 'bar' ? renderBar(financialData, true) : renderPie(financialData, true)}
      </ChartCard>
      <ChartCard title="Physical Progress (%)" chartType={physicalType} onChartTypeChange={setPhysicalType} subtitle="Avg target vs actual completion">
        {physicalType === 'bar' ? renderBar(physicalData, false, true) : renderPie(physicalData, false, true)}
      </ChartCard>
    </div>
  );
}
