import { useState, useRef } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { STATE_PATHS, CONTEXT_PATHS, type StatePath } from '@/lib/indiaStatePaths';

export interface StateStats {
  count: number;
  value: number;
  delayed: number;
  avgCompletion: number;
}

interface IndiaMapProps {
  selectedStates: string[];
  onToggleState: (state: string) => void;
  getStateStats: (state: string) => StateStats;
  onFilterCity?: (state: string) => void;
  selectedCityCountFor?: (state: string) => number;
}

const VB_W = 600;
const VB_H = 700;

function stateAbbrev(name: string): string {
  if (name.length > 11) return name.slice(0, 3).toUpperCase();
  return name.split(' ').map((w) => w[0]).join('').toUpperCase();
}

export function IndiaMap({ selectedStates, onToggleState, getStateStats, onFilterCity, selectedCityCountFor }: IndiaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent, state: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHovered(state);
  };

  const renderStatePath = (sp: StatePath, isDataState: boolean) => {
    const isSelected = selectedStates.includes(sp.name);

    let fill = '#eef2f7';
    if (isDataState) {
      fill = isSelected ? '#0891b2' : '#bae6fd';
    }
    if (hovered === sp.name && isDataState) {
      fill = isSelected ? '#0e7490' : '#7dd3fc';
    }
    if (hovered === sp.name && !isDataState) {
      fill = '#e2e8f0';
    }

    return (
      <g key={sp.name}>
        <path
          d={sp.d}
          fill={fill}
          stroke={isDataState ? '#0c4a6e' : '#cbd5e1'}
          strokeWidth={isDataState ? 1.4 : 1}
          strokeLinejoin="round"
          className={isDataState ? 'cursor-pointer transition-colors duration-150' : 'transition-colors duration-150'}
          onClick={() => isDataState && onToggleState(sp.name)}
          onMouseMove={(e) => isDataState && handleMouseMove(e, sp.name)}
          onMouseLeave={() => setHovered(null)}
        />
        {isDataState && (
          <text
            x={sp.labelX}
            y={sp.labelY}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill={isSelected ? '#ffffff' : '#0c4a6e'}
            className="pointer-events-none select-none"
            style={{ paintOrder: 'stroke' }}
            stroke={isSelected ? 'none' : '#ffffff'}
            strokeWidth={2.5}
          >
            {stateAbbrev(sp.name)}
          </text>
        )}
      </g>
    );
  };

  const hoveredStats = hovered ? getStateStats(hovered) : null;

  return (
    <div ref={containerRef} className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-2">
      <svg viewBox={`-10 -10 ${VB_W + 20} ${VB_H + 20}`} className="w-full h-auto" style={{ maxHeight: '420px' }}>
        <defs>
          <filter id="india-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>
        <g filter="url(#india-shadow)">
          {CONTEXT_PATHS.map((sp) => renderStatePath(sp, false))}
          {STATE_PATHS.map((sp) => renderStatePath(sp, true))}
        </g>
      </svg>

      {/* Floating tooltip */}
      {hovered && hoveredStats && (
        <div
          className="absolute z-20 pointer-events-none bg-white shadow-lg rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] min-w-[150px]"
          style={{
            left: Math.min(tooltipPos.x + 12, (containerRef.current?.clientWidth ?? 200) - 170),
            top: Math.max(tooltipPos.y - 80, 4),
          }}
        >
          <div className="font-bold text-slate-800 text-[11px] mb-1 border-b border-slate-100 pb-1">{hovered}</div>
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Projects</span>
            <span className="font-semibold text-cyan-700">{hoveredStats.count}</span>
          </div>
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Contract Value</span>
            <span className="font-semibold text-blue-700">₹{hoveredStats.value.toFixed(0)}L</span>
          </div>
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Avg Progress</span>
            <span className="font-semibold text-emerald-700">{hoveredStats.avgCompletion.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Delayed</span>
            <span className="font-semibold text-amber-700">{hoveredStats.delayed}</span>
          </div>
        </div>
      )}

      <div className="text-[10px] text-slate-400 text-center mt-0.5">
        Click states to multi-select · Hover for details
      </div>
      <div className="flex items-center justify-center gap-3 mt-0.5 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sky-200 inline-block" /> Unselected</span>
      </div>

      {/* Drill-down: pick cities within a selected state */}
      {selectedStates.length > 0 && onFilterCity && (
        <div className="mt-2 bg-slate-50 rounded-lg border border-slate-200 p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-[11px] font-bold text-slate-700">Drill down by city</span>
            <span className="text-[10px] text-slate-400">— tap a state to choose its cities</span>
          </div>
          <div className="space-y-1">
            {selectedStates.map((s) => {
              const cityCount = selectedCityCountFor ? selectedCityCountFor(s) : 0;
              const hasCities = cityCount > 0;
              return (
                <button
                  key={s}
                  onClick={() => onFilterCity(s)}
                  className={`group flex items-center justify-between w-full px-2 py-1.5 rounded-md border transition-all ${hasCities ? 'bg-cyan-50 border-cyan-300 hover:border-cyan-400' : 'bg-white border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold ${hasCities ? 'text-cyan-700' : 'text-slate-700'}`}>{s}</span>
                    {hasCities && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-600 text-white">
                        {cityCount} {cityCount === 1 ? 'city' : 'cities'}
                      </span>
                    )}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-medium ${hasCities ? 'text-cyan-700' : 'text-slate-400 group-hover:text-cyan-600'}`}>
                    {hasCities ? 'Edit cities' : 'Pick cities'}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
