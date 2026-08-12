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

const MINI_H = 120;

type ChartType = 'bar' | 'pie';

function MiniChartCard({
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
    <div className="mirror-card rounded border-t-2 border-t-cyan-600 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-slate-700 truncate">{title}</h3>
          {subtitle && <p className="text-[9px] text-slate-500 font-medium truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onChartTypeChange('bar')}
            className={`p-0.5 rounded ${chartType === 'bar' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onChartTypeChange('pie')}
            className={`p-0.5 rounded ${chartType === 'pie' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <PieIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-[120px]">{children}</div>
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
    <ResponsiveContainer width="100%" height={MINI_H}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 2" className="stroke-slate-100" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 600 }} angle={-15} textAnchor="end" height={28} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis domain={percent ? [0, 100] : undefined} tick={{ fontSize: 8 }} width={money ? 40 : 28} tickFormatter={(v) => (money ? formatINRShort(v) : percent ? `${v}%` : v)} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28} maxBarSize={36}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPie = (data: { name: string; value: number; color: string }[], money = false, percent = false) => (
    <ResponsiveContainer width="100%" height={MINI_H}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={42}
          innerRadius={20}
          label={(e: any) => (money ? formatINRShort(e.value) : percent ? `${e.value}%` : e.value)}
          labelLine={false}
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2">
      <MiniChartCard title="Schedule Status" chartType={scheduleType} onChartTypeChange={setScheduleType} subtitle="WO count by delay severity">
        {scheduleType === 'bar' ? renderBar(scheduleData) : renderPie(scheduleData)}
      </MiniChartCard>
      <MiniChartCard title="Financial Progress" chartType={financialType} onChartTypeChange={setFinancialType} subtitle={`Total WO Value: ${formatINRShort(totalWOValue)}`}>
        {financialType === 'bar' ? renderBar(financialData, true) : renderPie(financialData, true)}
      </MiniChartCard>
      <MiniChartCard title="Physical Progress (%)" chartType={physicalType} onChartTypeChange={setPhysicalType} subtitle="Avg target vs actual completion">
        {physicalType === 'bar' ? renderBar(physicalData, false, true) : renderPie(physicalData, false, true)}
      </MiniChartCard>
    </div>
  );
}
