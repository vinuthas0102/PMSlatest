import { X, PieChart as PieIcon, BarChart3, Layers, FolderTree } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { BaseEntity } from '@/types';
import { SUBCATEGORIES, formatINRShort, formatINR } from '@/lib/format';

interface SubcategoryModalProps {
  category: string;
  items: BaseEntity[];
  onClose: () => void;
}

const COLORS = ['#0891b2', '#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed'];

export function SubcategoryModal({ category, items, onClose }: SubcategoryModalProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const data = useMemo(() => {
    const subs = SUBCATEGORIES[category] || [];
    return subs.map((sub, idx) => {
      const subItems = items.filter((i) => i.subcategory === sub);
      return {
        name: sub,
        count: subItems.length,
        value: subItems.reduce((s, i) => s + i.mbook_entry, 0),
        color: COLORS[idx % COLORS.length],
      };
    }).filter((d) => d.count > 0);
  }, [category, items]);

  const totalProjects = data.reduce((s, d) => s + d.count, 0);
  const totalValue = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
              <FolderTree className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{category}</h2>
              <p className="text-[11px] text-slate-400">Subcategory Breakdown · {totalProjects} projects · {formatINR(totalValue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-800 p-0.5 ring-1 ring-slate-700">
              <button
                onClick={() => setChartType('pie')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${chartType === 'pie' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <PieIcon className="h-3.5 w-3.5" /> Pie
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${chartType === 'bar' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Bar
              </button>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body: two-column layout */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-5">
          {/* Chart column */}
          <div className="flex flex-col border-b border-slate-200 bg-slate-50 p-4 md:col-span-3 md:border-b-0 md:border-r">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Layers className="h-3.5 w-3.5" />
              {chartType === 'pie' ? 'Distribution by Project Count' : 'Project Count per Subcategory'}
            </div>
            <div className="flex flex-1 items-center justify-center">
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={45}
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(v: number, _n: string, p: { payload?: { value?: number } }) => [`${v} projects · ${formatINRShort(p?.payload?.value ?? 0)}`, '']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(v: number, _n: string, p: { payload?: { value?: number } }) => [`${v} projects · ${formatINRShort(p?.payload?.value ?? 0)}`, '']}
                        cursor={{ fill: 'rgba(8,145,178,0.08)' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={70}>
                        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">No subcategory data available.</div>
              )}
            </div>
          </div>

          {/* Legend / summary table column */}
          <div className="flex flex-col overflow-hidden md:col-span-2">
            <div className="border-b border-slate-200 bg-white px-4 py-2.5">
              <h3 className="text-xs font-bold text-slate-700">Subcategory Summary</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Subcategory</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Projects</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.name} className="border-b border-slate-100 transition-colors hover:bg-cyan-50/40">
                      <td className="px-3 py-2 text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">{d.count}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-blue-700">{formatINRShort(d.value)}</td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-8 text-center text-slate-400">No data</td>
                    </tr>
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="sticky bottom-0 bg-slate-100">
                    <tr className="border-t-2 border-slate-200">
                      <td className="px-3 py-2.5 font-bold text-slate-700">Total</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-700">{totalProjects}</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-blue-700">{formatINRShort(totalValue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
