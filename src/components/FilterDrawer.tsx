import { useState, useMemo, useRef, useEffect } from 'react';
import { X, RotateCcw, Map as MapIcon, List, Search, XCircle, Check, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
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
  const [cityPopupState, setCityPopupState] = useState<string | null>(null);
  const [subcatPopup, setSubcatPopup] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityPopupState) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setCityPopupState(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cityPopupState]);

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

  const getCityPopupDistricts = useMemo(() => {
    if (!cityPopupState) return [];
    const base = DISTRICTS[cityPopupState] || [];
    if (!citySearch.trim()) return base;
    return base.filter((d) => d.toLowerCase().includes(citySearch.toLowerCase()));
  }, [cityPopupState, citySearch]);

  const clearRegion = () => {
    onFiltersChange({ ...filters, states: [], districts: [] });
  };

  const removeStateAndItsCities = (state: string) => {
    const stateCities = DISTRICTS[state] || [];
    const newDistricts = filters.districts.filter((d) => !stateCities.includes(d));
    onFiltersChange({ ...filters, states: filters.states.filter((s) => s !== state), districts: newDistricts });
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
                  onFilterCity={(s) => setCityPopupState(s)}
                />
              ) : (
                <div className="bg-slate-50 rounded border border-slate-200 overflow-x-auto max-h-[220px] overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-slate-200 text-slate-600 shadow-sm z-10">
                      <tr>
                        <th className="px-1.5 py-1.5 text-left font-bold w-6"></th>
                        <th className="px-1.5 py-1.5 text-left font-bold">State</th>
                        <th className="px-1.5 py-1.5 text-right font-bold">Projects</th>
                        <th className="px-1.5 py-1.5 text-right font-bold whitespace-nowrap">Value (₹L)</th>
                        <th className="px-1.5 py-1.5 text-right font-bold whitespace-nowrap">Avg %</th>
                        <th className="px-1.5 py-1.5 text-right font-bold">Delayed</th>
                        <th className="px-1.5 py-1.5 text-center font-bold w-16">Cities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATES.map((state, idx) => {
                        const isSelected = filters.states.includes(state);
                        const stats = getStateStats(state);
                        return (
                          <tr
                            key={state}
                            className={`cursor-pointer border-b border-slate-200 last:border-0 transition-colors ${isSelected ? 'bg-cyan-50 border-l-[3px] border-l-cyan-500' : idx % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}`}
                          >
                            <td className="px-1.5 py-1" onClick={() => toggleState(state)}>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                            </td>
                            <td className={`px-1.5 py-1 font-semibold ${isSelected ? 'text-cyan-700' : 'text-slate-700'}`} onClick={() => toggleState(state)}>{state}</td>
                            <td className="px-1.5 py-1 text-right text-slate-600 tabular-nums" onClick={() => toggleState(state)}>{stats.count}</td>
                            <td className="px-1.5 py-1 text-right text-blue-700 font-semibold tabular-nums" onClick={() => toggleState(state)}>{stats.value.toFixed(0)}</td>
                            <td className="px-1.5 py-1 text-right text-emerald-700 tabular-nums" onClick={() => toggleState(state)}>{stats.avgCompletion.toFixed(0)}%</td>
                            <td className="px-1.5 py-1 text-right text-amber-700 tabular-nums" onClick={() => toggleState(state)}>{stats.delayed}</td>
                            <td className="px-1 py-1 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); setCityPopupState(state); }}
                                className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors mx-auto ${isSelected ? 'text-cyan-700 hover:bg-cyan-100 bg-cyan-50 border border-cyan-200' : 'text-slate-400 hover:bg-slate-200 border border-transparent'}`}
                              >
                                <MapPin className="w-2.5 h-2.5" />
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Selected Region Frame */}
              {(filters.states.length > 0 || filters.districts.length > 0) && (
                <div className="mt-1.5 bg-slate-50 rounded border border-slate-200 p-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      Selected State/Cities
                    </span>
                    <button
                      onClick={clearRegion}
                      className="text-[10px] font-medium text-red-500 hover:text-red-700 flex items-center gap-0.5"
                    >
                      <XCircle className="w-3 h-3" /> Clear Region
                    </button>
                  </div>
                  <div className="space-y-1">
                    {filters.states.map((s) => {
                      const stateCities = (DISTRICTS[s] || []).filter((d) => filters.districts.includes(d));
                      return (
                        <div key={s} className="flex items-start gap-1 flex-wrap text-[10px]">
                          <span className="flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
                            {s}
                            <button onClick={() => removeStateAndItsCities(s)} className="hover:text-red-600"><XCircle className="w-3 h-3" /></button>
                          </span>
                          {stateCities.map((d) => (
                            <span key={d} className="flex items-center gap-1">
                              <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                              <span className="flex items-center gap-1 font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {d}
                                <button onClick={() => toggleDistrict(d)} className="hover:text-red-600"><XCircle className="w-3 h-3" /></button>
                              </span>
                            </span>
                          ))}
                        </div>
                      );
                    })}
                    {filters.districts.filter((d) => !filters.states.some((s) => (DISTRICTS[s] || []).includes(d))).length > 0 && (
                      <div className="flex items-start gap-1 flex-wrap text-[10px]">
                        {filters.districts
                          .filter((d) => !filters.states.some((s) => (DISTRICTS[s] || []).includes(d)))
                          .map((d) => (
                            <span key={d} className="flex items-center gap-1 font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {d}
                              <button onClick={() => toggleDistrict(d)} className="hover:text-red-600"><XCircle className="w-3 h-3" /></button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Category & Subcategory Filter */}
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-1.5">2. Category &amp; Subcategory Filter</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = filters.categories.includes(cat);
                  const subs = SUBCATEGORIES[cat] || [];
                  return (
                    <div key={cat} className="bg-slate-50 rounded border border-slate-200 px-1.5 py-1">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center gap-1.5 text-[11px] ${isSelected ? 'text-cyan-700 font-semibold' : 'text-slate-600'}`}
                        >
                          <div className={`w-3 h-3 rounded border ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`} />
                          {cat}
                        </button>
                        <button
                          onClick={() => setSubcatPopup(subcatPopup === cat ? null : cat)}
                          className="text-[10px] font-medium text-slate-500 hover:text-cyan-700 underline"
                        >
                          All
                        </button>
                      </div>
                      {/* Inline subcategory pills with scroll arrows */}
                      <SubcategoryPills
                        subs={subs}
                        selected={filters.subcategories}
                        onToggle={toggleSubcategory}
                      />
                      {subcatPopup === cat && (
                        <div className="mt-1 p-1.5 bg-white rounded border border-slate-200">
                          <div className="text-[9px] font-semibold text-slate-400 uppercase mb-1">All Subcategories</div>
                          {subs.map((sub) => {
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

      {/* City Popup - positioned panel, not centered overlay */}
      {cityPopupState && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-slate-200 w-72 max-h-[60vh] flex flex-col"
          style={{
            right: '420px',
            top: '120px',
          }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-900 text-white rounded-t-lg">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="text-xs font-bold">{cityPopupState} · Cities</h3>
            </div>
            <button onClick={() => setCityPopupState(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 py-1.5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search cities..."
                className="w-full text-[11px] border border-slate-200 rounded pl-6 pr-2 py-1 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-1.5 flex-1">
            {getCityPopupDistricts.length === 0 ? (
              <div className="text-center text-[11px] text-slate-400 py-4">No cities found</div>
            ) : (
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-slate-100 text-slate-500">
                  <tr>
                    <th className="px-1 py-0.5 text-left font-semibold w-5"></th>
                    <th className="px-1 py-0.5 text-left font-semibold">City</th>
                    <th className="px-1 py-0.5 text-right font-semibold">Proj</th>
                    <th className="px-1 py-0.5 text-right font-semibold">₹L</th>
                    <th className="px-1 py-0.5 text-right font-semibold">%</th>
                    <th className="px-1 py-0.5 text-right font-semibold">Dly</th>
                  </tr>
                </thead>
                <tbody>
                  {getCityPopupDistricts.map((d, idx) => {
                    const isSelected = filters.districts.includes(d);
                    const stats = getDistrictStats(d);
                    return (
                      <tr
                        key={d}
                        onClick={() => toggleDistrict(d)}
                        className={`cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${isSelected ? 'bg-cyan-50' : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100'}`}
                      >
                        <td className="px-1 py-0.5">
                          <div className={`w-3 h-3 rounded border flex items-center justify-center ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-2 h-2 text-white" />}
                          </div>
                        </td>
                        <td className={`px-1 py-0.5 font-medium ${isSelected ? 'text-cyan-700' : 'text-slate-600'}`}>{d}</td>
                        <td className="px-1 py-0.5 text-right text-slate-600 tabular-nums">{stats.count}</td>
                        <td className="px-1 py-0.5 text-right text-blue-700 font-medium tabular-nums">{stats.value.toFixed(0)}</td>
                        <td className="px-1 py-0.5 text-right text-emerald-700 tabular-nums">{stats.avgCompletion.toFixed(0)}</td>
                        <td className="px-1 py-0.5 text-right text-amber-700 tabular-nums">{stats.delayed}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-2 py-1.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-lg">
            <span className="text-[10px] text-slate-500">
              {(DISTRICTS[cityPopupState] || []).filter((d) => filters.districts.includes(d)).length} of {(DISTRICTS[cityPopupState] || []).length} selected
            </span>
            <button
              onClick={() => setCityPopupState(null)}
              className="bg-cyan-700 text-white text-[11px] font-medium px-3 py-1 rounded hover:bg-cyan-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* Inline subcategory pills with horizontal scroll arrows */
function SubcategoryPills({
  subs,
  selected,
  onToggle,
}: {
  subs: string[];
  selected: string[];
  onToggle: (sub: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateArrows();
  }, [subs]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -80 : 80, behavior: 'smooth' });
    setTimeout(updateArrows, 200);
  };

  return (
    <div className="flex items-center gap-0.5 mt-1">
      {canLeft && (
        <button onClick={() => scroll('left')} className="shrink-0 text-slate-400 hover:text-cyan-600 p-0.5">
          <ChevronLeft className="w-3 h-3" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-1 overflow-x-auto scrollbar-hide flex-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {subs.map((sub) => {
          const isSel = selected.includes(sub);
          return (
            <button
              key={sub}
              onClick={() => onToggle(sub)}
              className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${isSel ? 'bg-cyan-600 text-white border-cyan-600 font-medium' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}
            >
              {sub}
            </button>
          );
        })}
      </div>
      {canRight && (
        <button onClick={() => scroll('right')} className="shrink-0 text-slate-400 hover:text-cyan-600 p-0.5">
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
