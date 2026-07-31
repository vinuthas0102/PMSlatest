import { useState, useMemo } from 'react';
import { X, RotateCcw, Map as MapIcon, List, Search, XCircle, Check, ChevronRight } from 'lucide-react';
import type { Filters, DelayStatus } from '@/types';
import {
  CATEGORIES, SUBCATEGORIES, STATES, DISTRICTS,
  DELAY_STATUSES, delayStatusColor, delayStatusShort,
} from '@/lib/format';
import { IndiaMap } from '@/components/IndiaMap';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onApply: () => void;
  onReset: () => void;
  items: { state: string; district: string; mbook_entry: number; completed_pct: number; delay_status: DelayStatus }[];
}

interface StateStats {
  count: number;
  value: number;
  delayed: number;
  avgCompletion: number;
}

interface DistrictStats {
  count: number;
  value: number;
  delayed: number;
  avgCompletion: number;
}

export function FilterDrawer({ open, onClose, filters, onFiltersChange, onApply, onReset, items }: FilterDrawerProps) {
  const [mapView, setMapView] = useState(true);
  const [districtPopup, setDistrictPopup] = useState(false);
  const [subcatPopup, setSubcatPopup] = useState<string | null>(null);
  const [districtSearch, setDistrictSearch] = useState('');

  const toggleState = (state: string) => {
    const newStates = filters.states.includes(state)
      ? filters.states.filter((s) => s !== state)
      : [...filters.states, state];
    onFiltersChange({ ...filters, states: newStates });
  };

  const toggleDistrict = (district: string) => {
    const newDistricts = filters.districts.includes(district)
      ? filters.districts.filter((d) => d !== district)
      : [...filters.districts, district];
    onFiltersChange({ ...filters, districts: newDistricts });
  };

  const toggleCategory = (cat: string) => {
    const newCats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFiltersChange({ ...filters, categories: newCats });
  };

  const toggleSubcategory = (sub: string) => {
    const newSubs = filters.subcategories.includes(sub)
      ? filters.subcategories.filter((s) => s !== sub)
      : [...filters.subcategories, sub];
    onFiltersChange({ ...filters, subcategories: newSubs });
  };

  const toggleDelayStatus = (status: DelayStatus) => {
    const newStatuses = filters.delayStatuses.includes(status)
      ? filters.delayStatuses.filter((s) => s !== status)
      : [...filters.delayStatuses, status];
    onFiltersChange({ ...filters, delayStatuses: newStatuses });
  };

  const getStateStats = (state: string): StateStats => {
    const stateItems = items.filter((i) => i.state === state);
    return {
      count: stateItems.length,
      value: stateItems.reduce((s, i) => s + i.mbook_entry, 0),
      delayed: stateItems.filter((i) => i.delay_status !== 'On Time').length,
      avgCompletion: stateItems.length > 0
        ? stateItems.reduce((s, i) => s + i.completed_pct, 0) / stateItems.length
        : 0,
    };
  };

  const getDistrictStats = (district: string): DistrictStats => {
    const dItems = items.filter((i) => i.district === district);
    return {
      count: dItems.length,
      value: dItems.reduce((s, i) => s + i.mbook_entry, 0),
      delayed: dItems.filter((i) => i.delay_status !== 'On Time').length,
      avgCompletion: dItems.length > 0
        ? dItems.reduce((s, i) => s + i.completed_pct, 0) / dItems.length
        : 0,
    };
  };

  const availableDistricts = useMemo(() => {
    const base = filters.states.length > 0
      ? filters.states.flatMap((s) => DISTRICTS[s] || [])
      : Object.values(DISTRICTS).flat();
    if (!districtSearch.trim()) return base;
    return base.filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase()));
  }, [filters.states, districtSearch]);

  const groupedDistricts = useMemo(() => {
    const groups: Record<string, string[]> = {};
    availableDistricts.forEach((d) => {
      const parent = Object.entries(DISTRICTS).find(([, ds]) => ds.includes(d))?.[0] || 'Other';
      if (!groups[parent]) groups[parent] = [];
      groups[parent].push(d);
    });
    return groups;
  }, [availableDistricts]);

  const clearRegion = () => {
    onFiltersChange({ ...filters, states: [], districts: [] });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex">
        <div className="flex-1 bg-black/20" onClick={onClose} />
        <div className="w-2/5 max-w-[600px] min-w-[400px] bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-700">
            <h2 className="text-sm font-bold">Filter Conditions</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
              >
                <X className="w-3 h-3" /> Close
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 border-b border-slate-100">
            Enter filter conditions &amp; click <span className="font-semibold text-cyan-700">Search Now</span> to view filtered data
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* 1. Region Filter */}
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-semibold text-slate-700">1. Region Filter</h3>
                <div className="flex items-center bg-slate-100 rounded text-[10px]">
                  <button
                    onClick={() => setMapView(true)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-medium transition-colors ${mapView ? 'bg-cyan-700 text-white' : 'text-slate-500'}`}
                  >
                    <MapIcon className="w-3 h-3" /> Map
                  </button>
                  <button
                    onClick={() => setMapView(false)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-medium transition-colors ${!mapView ? 'bg-cyan-700 text-white' : 'text-slate-500'}`}
                  >
                    <List className="w-3 h-3" /> List
                  </button>
                </div>
              </div>

              {mapView ? (
                <IndiaMap
                  selectedStates={filters.states}
                  onToggleState={toggleState}
                  getStateStats={getStateStats}
                />
              ) : (
                <div className="bg-slate-50 rounded border border-slate-200 overflow-x-auto max-h-[200px] overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-slate-100 text-slate-500">
                      <tr>
                        <th className="px-1.5 py-1 text-left font-semibold w-6"></th>
                        <th className="px-1.5 py-1 text-left font-semibold">State</th>
                        <th className="px-1.5 py-1 text-right font-semibold">Projects</th>
                        <th className="px-1.5 py-1 text-right font-semibold whitespace-nowrap">Value (₹L)</th>
                        <th className="px-1.5 py-1 text-right font-semibold whitespace-nowrap">Avg %</th>
                        <th className="px-1.5 py-1 text-right font-semibold">Delayed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATES.map((state) => {
                        const isSelected = filters.states.includes(state);
                        const stats = getStateStats(state);
                        return (
                          <tr
                            key={state}
                            onClick={() => toggleState(state)}
                            className={`cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${isSelected ? 'bg-cyan-50' : 'hover:bg-slate-100'}`}
                          >
                            <td className="px-1.5 py-1">
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                            </td>
                            <td className={`px-1.5 py-1 font-medium ${isSelected ? 'text-cyan-700' : 'text-slate-600'}`}>{state}</td>
                            <td className="px-1.5 py-1 text-right text-slate-600">{stats.count}</td>
                            <td className="px-1.5 py-1 text-right text-blue-700 font-medium">{stats.value.toFixed(0)}</td>
                            <td className="px-1.5 py-1 text-right text-emerald-700">{stats.avgCompletion.toFixed(0)}%</td>
                            <td className="px-1.5 py-1 text-right text-amber-700">{stats.delayed}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={() => setDistrictPopup(true)}
                className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2 py-1 rounded transition-colors w-full"
              >
                <span>Select Districts / City</span>
                <span className="flex items-center gap-1">
                  <span className="bg-cyan-200 text-cyan-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {filters.districts.length}
                  </span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </button>

              {/* Selection Summary */}
              {(filters.states.length > 0 || filters.districts.length > 0) && (
                <div className="mt-1.5 bg-slate-50 rounded border border-slate-200 p-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      {filters.states.length} state{filters.states.length !== 1 ? 's' : ''} · {filters.districts.length} district{filters.districts.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={clearRegion}
                      className="text-[10px] font-medium text-red-500 hover:text-red-700 flex items-center gap-0.5"
                    >
                      <XCircle className="w-3 h-3" /> Clear Region
                    </button>
                  </div>
                  {filters.states.length > 0 && (
                    <div className="mb-1">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">States</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {filters.states.map((s) => (
                          <span key={s} className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
                            {s}
                            <button onClick={() => toggleState(s)} className="hover:text-red-600"><XCircle className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {filters.districts.length > 0 && (
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase">Districts</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {filters.districts.map((d) => (
                          <span key={d} className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {d}
                            <button onClick={() => toggleDistrict(d)} className="hover:text-red-600"><XCircle className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Category & Subcategory Filter */}
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-1.5">2. Category &amp; Subcategory Filter</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = filters.categories.includes(cat);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center gap-1.5 text-[11px] ${isSelected ? 'text-cyan-700 font-medium' : 'text-slate-600'}`}
                        >
                          <div className={`w-3 h-3 rounded border ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`} />
                          {cat}
                        </button>
                        <button
                          onClick={() => setSubcatPopup(subcatPopup === cat ? null : cat)}
                          className="text-[10px] font-medium text-slate-500 hover:text-cyan-700 underline"
                        >
                          Select Subcategories
                        </button>
                      </div>
                      {subcatPopup === cat && (
                        <div className="ml-4 mt-1 p-1.5 bg-slate-50 rounded border border-slate-200">
                          {(SUBCATEGORIES[cat] || []).map((sub) => {
                            const isSel = filters.subcategories.includes(sub);
                            return (
                              <button
                                key={sub}
                                onClick={() => toggleSubcategory(sub)}
                                className={`flex items-center gap-1.5 w-full px-1.5 py-0.5 text-[11px] ${isSel ? 'text-cyan-700 font-medium' : 'text-slate-600'}`}
                              >
                                <div className={`w-3 h-3 rounded border ${isSel ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`} />
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {filters.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {filters.subcategories.map((sub) => (
                    <span key={sub} className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {sub}
                      <button onClick={() => toggleSubcategory(sub)} className="hover:text-red-600"><XCircle className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Delay Status Filter */}
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-1.5">3. Delay Status Filter</h3>
              <div className="flex flex-wrap gap-1.5">
                {DELAY_STATUSES.map((status) => {
                  const isSelected = filters.delayStatuses.includes(status);
                  const colors = delayStatusColor(status);
                  return (
                    <button
                      key={status}
                      onClick={() => toggleDelayStatus(status)}
                      className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border transition-all ${isSelected ? `${colors.bg} ${colors.text} ${colors.border} ring-1 ring-cyan-400` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      {delayStatusShort(status)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Timeline / Period Filter */}
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-1.5">4. Timeline / Period Filter</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 block mb-0.5">Start (Month/Year)</label>
                  <input
                    type="month"
                    value={filters.startMonth}
                    onChange={(e) => onFiltersChange({ ...filters, startMonth: e.target.value })}
                    className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="text-slate-400 mt-4">→</div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 block mb-0.5">End (Month/Year)</label>
                  <input
                    type="month"
                    value={filters.endMonth}
                    onChange={(e) => onFiltersChange({ ...filters, endMonth: e.target.value })}
                    className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Search Now */}
          <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onApply}
              className="flex items-center justify-center gap-2 w-full bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-bold py-2 rounded transition-colors"
            >
              <Search className="w-4 h-4" />
              Search Now
            </button>
          </div>
        </div>
      </div>

      {/* District Popup */}
      {districtPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDistrictPopup(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Select Districts / City</h3>
              <button onClick={() => setDistrictPopup(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search bar */}
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  placeholder="Search districts..."
                  className="w-full text-[11px] border border-slate-200 rounded pl-7 pr-2 py-1.5 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* District list grouped by state */}
            <div className="overflow-y-auto p-2 flex-1">
              {Object.keys(groupedDistricts).length === 0 ? (
                <div className="text-center text-[11px] text-slate-400 py-4">No districts found</div>
              ) : (
                Object.entries(groupedDistricts).map(([state, dists]) => (
                  <div key={state} className="mb-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded mb-1">
                      {state}
                    </div>
                    <div className="space-y-0.5">
                      {dists.map((d) => {
                        const isSelected = filters.districts.includes(d);
                        const stats = getDistrictStats(d);
                        return (
                          <button
                            key={d}
                            onClick={() => toggleDistrict(d)}
                            className={`flex items-center gap-2 w-full px-2 py-1 text-[11px] rounded transition-colors ${isSelected ? 'bg-cyan-50 text-cyan-700 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="flex-1 text-left">{d}</span>
                            <span className="text-slate-400 text-[10px]">{stats.count} proj</span>
                            <span className="text-blue-700 text-[10px] font-medium">₹{stats.value.toFixed(0)}L</span>
                            <span className="text-emerald-700 text-[10px] w-8 text-right">{stats.avgCompletion.toFixed(0)}%</span>
                            {stats.delayed > 0 && <span className="text-amber-700 text-[10px]">{stats.delayed}d</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-3 py-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {filters.districts.length} district{filters.districts.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setDistrictPopup(false)}
                className="bg-cyan-700 text-white text-sm font-medium px-4 py-1.5 rounded hover:bg-cyan-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
