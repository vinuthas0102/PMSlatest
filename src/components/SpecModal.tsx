import { useState, useMemo } from 'react';
import { X, Search, Paperclip, FileText } from 'lucide-react';
import type { BaseEntity, Spec, Level } from '@/types';
import { formatINR, formatDateShort, delayStatusColor, delayStatusShort } from '@/lib/format';

interface SpecModalProps {
  item: BaseEntity;
  level: Level;
  specs: Spec[];
  onClose: () => void;
}

export function SpecModal({ item, level, specs, onClose }: SpecModalProps) {
  const [specFilter, setSpecFilter] = useState('');
  const colors = delayStatusColor(item.delay_status);

  const levelSpecs = useMemo(() => {
    return specs.filter((s) => s.level === level && s.parent_id === item.id);
  }, [specs, level, item.id]);

  const filteredSpecs = useMemo(() => {
    const q = specFilter.toLowerCase();
    return levelSpecs.filter(
      (s) => s.spec_code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [levelSpecs, specFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-700 rounded-t">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold">{item.title}</h2>
              <p className="text-[10px] text-slate-400">
                <span className="font-mono">{item.seq_no}</span> · {item.code} · {level.toUpperCase()} Level
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div>
              <div className="text-slate-400">Manager</div>
              <div className="font-medium text-slate-700">{item.manager}</div>
            </div>
            <div>
              <div className="text-slate-400">Location</div>
              <div className="font-medium text-slate-700">{item.state} · {item.district}</div>
            </div>
            <div>
              <div className="text-slate-400">Category</div>
              <div className="font-medium text-slate-700">{item.category}</div>
            </div>
            <div>
              <div className="text-slate-400">Subcategory</div>
              <div className="font-medium text-slate-700">{item.subcategory}</div>
            </div>
            <div>
              <div className="text-slate-400">Physical Progress</div>
              <div className="font-medium text-slate-700">{item.completed_pct.toFixed(0)}% / {item.target_pct.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-slate-400">Delay Status</div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                {delayStatusShort(item.delay_status)}
              </span>
            </div>
            <div>
              <div className="text-slate-400">MBook Entry</div>
              <div className="font-medium text-blue-700">{formatINR(item.mbook_entry)}</div>
            </div>
            <div>
              <div className="text-slate-400">Billed / Paid</div>
              <div className="font-medium text-slate-700">
                <span className="text-cyan-600">{formatINR(item.billed_amount)}</span> / <span className="text-emerald-600">{formatINR(item.paid_amount)}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-400">Start Date</div>
              <div className="font-medium text-slate-700">{formatDateShort(item.start_date)}</div>
            </div>
            <div>
              <div className="text-slate-400">End Date</div>
              <div className="font-medium text-slate-700">{formatDateShort(item.end_date)}</div>
            </div>
            <div>
              <div className="text-slate-400">Qty Deviations</div>
              <div className="font-medium text-orange-600">{item.qty_deviations}</div>
            </div>
            <div>
              <div className="text-slate-400">Spec Deviations</div>
              <div className="font-medium text-amber-600">{item.spec_deviations}</div>
            </div>
          </div>
        </div>

        {/* Specs Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-1.5 sticky top-0 bg-white border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700">Specs ({filteredSpecs.length})</h3>
            <div className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5">
              <Search className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter specs..."
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
                className="bg-transparent text-[11px] outline-none w-32"
              />
            </div>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Spec Code</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Description</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Unit</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Est. Qty</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Exec. Qty</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Rate</th>
                <th className="text-right px-2 py-1.5 font-semibold text-slate-600">Amount</th>
                <th className="text-center px-2 py-1.5 font-semibold text-slate-600">Att</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecs.map((spec, idx) => (
                <tr key={spec.id} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-2 py-1.5 font-mono text-slate-600 font-medium whitespace-nowrap">{spec.spec_code}</td>
                  <td className="px-2 py-1.5 text-slate-700">{spec.description}</td>
                  <td className="px-2 py-1.5 text-slate-500 whitespace-nowrap">{spec.unit}</td>
                  <td className="px-2 py-1.5 text-right text-slate-600 whitespace-nowrap">{spec.estimated_qty.toFixed(0)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-600 whitespace-nowrap">{spec.executed_qty.toFixed(0)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-600 whitespace-nowrap">₹{spec.rate.toFixed(0)}</td>
                  <td className="px-2 py-1.5 text-right font-medium text-blue-700 whitespace-nowrap">{formatINR(spec.amount)}</td>
                  <td className="px-2 py-1.5 text-center">
                    {spec.has_attachment ? (
                      <Paperclip className="w-3.5 h-3.5 text-cyan-600 inline" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSpecs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-slate-400 text-xs">No specs match the filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
