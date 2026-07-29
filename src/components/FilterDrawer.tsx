import { useState } from 'react';
import { X, RotateCcw, Map as MapIcon, List, Search, XCircle } from 'lucide-react';
import type { Filters, DelayStatus } from '@/types';
import {
  CATEGORIES, SUBCATEGORIES, STATES, DISTRICTS,
  DELAY_STATUSES, delayStatusColor, delayStatusShort,
} from '@/lib/format';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onApply: () => void;
  onReset: () => void;
  items: { state: string; district: string; mbook_entry: number }[];
}

const INDIA_MAP_PATHS: Record<string, string> = {
  Karnataka: 'M180,220 L230,210 L250,230 L240,270 L210,280 L190,260 L180,240 Z',
  Maharashtra: 'M190,140 L240,130 L260,170 L250,210 L230,210 L210,180 L190,170 L180,150 Z',
  'Tamil Nadu': 'M220,290 L250,280 L260,320 L240,340 L220,330 L215,310 Z',
};

export function FilterDrawer({ open, onClose, filters, onFiltersChange, onApply, onReset, items }: FilterDrawerProps) {
  const [mapView, setMapView] = useState(true);
  const [districtPopup, setDistrictPopup] = useState(false);
  const [subcatPopup, setSubcatPopup] = useState<string | null>(null);

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

  const getStateStats = (state: string) => {
    const stateItems = items.filter((i) => i.state === state);
    return { count: stateItems.length, value: stateItems.reduce((s, i) => s + i.mbook_entry, 0) };
  };

  const availableDistricts = filters.states.length > 0
    ? filters.states.flatMap((s) => DISTRICTS[s] || [])
    : Object.values(DISTRICTS).flat();

  const activeSelections = [
    ...filters.states.map((s) => ({ type: 'state', value: s })),
    ...filters.districts.map((d) => ({ type: 'district', value: d })),
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/20" onClick={onClose} />
          <div className="w-2/5 max-w-[600px] min-w-[400px] bg-white shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-700">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Filter Conditions</h2>
              </div>
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
                  <div className="relative bg-slate-50 rounded border border-slate-200 p-2">
                    <svg viewBox="100 100 200 280" className="w-full h-auto" style={{ maxHeight: '200px' }}>
                      {STATES.map((state) => {
                        const isSelected = filters.states.includes(state);
                        const stats = getStateStats(state);
                        return (
                          <g key={state}>
                            <path
                              d={INDIA_MAP_PATHS[state] || ''}
                              fill={isSelected ? '#0891b2' : '#e2e8f0'}
                              stroke="#475569"
                              strokeWidth="1"
                              className="cursor-pointer hover:fill-cyan-400 transition-all"
                              onClick={() => toggleState(state)}
                            >
                              <title>{state} - {stats.count} projects, ₹{stats.value.toFixed(0)}L</title>
                            </path>
                            <text
                              x="50%"
                              y="50%"
                              textAnchor="middle"
                              dy="-2"
                              fontSize="7"
                              fill={isSelected ? '#fff' : '#475569'}
                              className="pointer-events-none font-bold"
                            >
                              {state.slice(0, 3).toUpperCase()}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div className="text-[10px] text-slate-400 text-center mt-1">Click states to select · Hover for stats</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded border border-slate-200 max-h-[140px] overflow-y-auto">
                    {STATES.map((state) => {
                      const isSelected = filters.states.includes(state);
                      const stats = getStateStats(state);
                      return (
                        <button
                          key={state}
                          onClick={() => toggleState(state)}
                          className={`flex items-center justify-between w-full px-2 py-1 text-[11px] border-b border-slate-100 last:border-0 transition-colors ${isSelected ? 'bg-cyan-50 text-cyan-700 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}
                        >
                          <span className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded border ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`} />
                            {state}
                          </span>
                          <span className="text-slate-400">{stats.count} · ₹{stats.value.toFixed(0)}L</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setDistrictPopup(true)}
                  className="mt-1.5 text-[11px] font-medium text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2 py-1 rounded transition-colors w-full text-left"
                >
                  Select Districts/City ({filters.districts.length} selected)
                </button>

                {/* Active Selection Tag Cloud */}
                {activeSelections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {activeSelections.map((sel) => (
                      <span
                        key={sel.value}
                        className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sel.type === 'state' ? 'bg-cyan-100 text-cyan-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {sel.value}
                        <button
                          onClick={() => sel.type === 'state' ? toggleState(sel.value) : toggleDistrict(sel.value)}
                          className="hover:text-red-600"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
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
                        <button onClick={() => toggleSubcategory(sub)} className="hover:text-red-600">
                          <XCircle className="w-3 h-3" />
                        </button>
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
      )}

      {/* District Popup */}
      {districtPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDistrictPopup(false)}>
          <div className="bg-white rounded shadow-2xl max-w-md w-full mx-4 max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Select Districts/City</h3>
              <button onClick={() => setDistrictPopup(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {availableDistricts.map((d) => {
                const isSelected = filters.districts.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDistrict(d)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded transition-colors ${isSelected ? 'bg-cyan-50 text-cyan-700 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`} />
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-slate-200">
              <button
                onClick={() => setDistrictPopup(false)}
                className="w-full bg-cyan-700 text-white text-sm font-medium py-1.5 rounded hover:bg-cyan-800 transition-colors"
              >
                Done ({filters.districts.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
