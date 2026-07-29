import { X, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BaseEntity } from '@/types';
import { SUBCATEGORIES, formatINRShort } from '@/lib/format';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded shadow-2xl max-w-lg w-full mx-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-700 rounded-t">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">{category} - Subcategory Breakdown</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded">
              <button onClick={() => setChartType('pie')} className={`p-1 rounded ${chartType === 'pie' ? 'bg-cyan-700 text-white' : 'text-slate-400'}`}>
                <PieIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setChartType('bar')} className={`p-1 rounded ${chartType === 'bar' ? 'bg-cyan-700 text-white' : 'text-slate-400'}`}>
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3" style={{ minHeight: '260px' }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name}: ${e.count}`}>
                    {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-slate-400 text-sm py-8">No subcategory data available.</div>
          )}
        </div>

        <div className="px-3 pb-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Subcategory</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Projects</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.name} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-600">{d.count}</td>
                  <td className="px-2 py-1.5 text-right font-medium text-blue-700">{formatINRShort(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
