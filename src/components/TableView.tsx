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

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: 'seq_no', label: 'Seq #' },
    { key: 'title', label: 'Title' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'category', label: 'Category' },
    { key: 'completed_pct', label: 'Comp %' },
    { key: 'delay_status', label: 'Status' },
    { key: 'mbook_entry', label: 'MBook ₹' },
    { key: 'billed_amount', label: 'Billed ₹' },
    { key: 'paid_amount', label: 'Paid ₹' },
  ];

  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="text-left px-2 py-1.5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <ArrowUpDown className={`w-2.5 h-2.5 ${sortKey === col.key ? 'text-cyan-600' : 'text-slate-300'}`} />
                </div>
              </th>
            ))}
            <th className="text-left px-2 py-1.5 font-semibold text-slate-600 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => {
            const colors = delayStatusColor(item.delay_status);
            return (
              <tr
                key={item.id}
                className={`border-b border-slate-100 hover:bg-cyan-50/30 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
              >
                <td className="px-2 py-1.5 font-mono font-bold text-slate-500 whitespace-nowrap">{item.seq_no}</td>
                <td className="px-2 py-1.5 text-slate-800 font-medium max-w-[200px] truncate">{item.title}</td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{item.state}</td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{item.district}</td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{item.category}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${item.completed_pct}%` }} />
                    </div>
                    <span className="text-slate-600">{item.completed_pct.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {delayStatusShort(item.delay_status)}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-blue-700 font-medium whitespace-nowrap">{formatINRShort(item.mbook_entry)}</td>
                <td className="px-2 py-1.5 text-cyan-600 font-medium whitespace-nowrap">{formatINRShort(item.billed_amount)}</td>
                <td className="px-2 py-1.5 text-emerald-600 font-medium whitespace-nowrap">{formatINRShort(item.paid_amount)}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onShowDetails(item)}
                      className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                    </button>
                    <span
                      className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded"
                    >
                      Show CMS WOs <ChevronRight className="w-3 h-3" />
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
