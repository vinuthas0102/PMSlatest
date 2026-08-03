import { useState } from 'react';
import { ArrowUpDown, FileText, ChevronRight } from 'lucide-react';
import type { BaseEntity } from '@/types';
import { formatINRShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface TableViewProps {
  items: BaseEntity[];
  onShowDetails: (item: BaseEntity) => void;
}

type SortKey = keyof BaseEntity;
type SortDir = 'asc' | 'desc';

export function TableView({ items, onShowDetails }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('seq_no');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = [...items].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    let cmp = 0;
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const columns: { key: SortKey; label: string; align?: 'left' | 'right' }[] = [
    { key: 'seq_no', label: 'Seq #' },
    { key: 'title', label: 'Title' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'category', label: 'Category' },
    { key: 'completed_pct', label: 'Comp %', align: 'right' },
    { key: 'delay_status', label: 'Status' },
    { key: 'mbook_entry', label: 'MBook ₹', align: 'right' },
    { key: 'billed_amount', label: 'Billed ₹', align: 'right' },
    { key: 'paid_amount', label: 'Paid ₹', align: 'right' },
    { key: 'paid_amount', label: 'Balance ₹', align: 'right' },
  ];

  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-200 border-b-2 border-slate-300">
            {columns.map((col, ci) => (
              <th
                key={ci}
                onClick={() => handleSort(col.key)}
                className={`px-2 py-2 font-bold text-slate-700 cursor-pointer hover:bg-slate-300 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                  {col.label}
                  <ArrowUpDown className={`w-2.5 h-2.5 ${sortKey === col.key ? 'text-cyan-600' : 'text-slate-400'}`} />
                </div>
              </th>
            ))}
            <th className="text-left px-2 py-2 font-bold text-slate-700 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => {
            const colors = delayStatusColor(item.delay_status);
            const balance = Math.max(0, item.mbook_entry - item.paid_amount);
            return (
              <tr
                key={item.id}
                className={`border-b border-slate-200 hover:bg-cyan-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}
              >
                <td className="px-2 py-1.5 font-mono font-bold text-slate-500 whitespace-nowrap">{item.seq_no}</td>
                <td className="px-2 py-1.5 text-slate-800 font-medium max-w-[200px] truncate">{item.title}</td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{item.state}</td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{item.district}</td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{item.category}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                        style={{ width: `${item.completed_pct}%` }}
                      />
                    </div>
                    <span className="text-slate-700 font-medium tabular-nums">{item.completed_pct.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {delayStatusShort(item.delay_status)}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-blue-700 font-semibold whitespace-nowrap text-right tabular-nums">{formatINRShort(item.mbook_entry)}</td>
                <td className="px-2 py-1.5 text-cyan-700 font-semibold whitespace-nowrap text-right tabular-nums">{formatINRShort(item.billed_amount)}</td>
                <td className="px-2 py-1.5 text-emerald-700 font-semibold whitespace-nowrap text-right tabular-nums">{formatINRShort(item.paid_amount)}</td>
                <td className="px-2 py-1.5 text-rose-600 font-semibold whitespace-nowrap text-right tabular-nums">{formatINRShort(balance)}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onShowDetails(item)}
                      className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                    </button>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      CMS WOs <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
