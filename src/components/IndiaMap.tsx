import { useState, useRef } from 'react';
import { STATES } from '@/lib/format';

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
}

interface StatePath {
  name: string;
  d: string;
  labelX: number;
  labelY: number;
}

const STATE_PATHS: StatePath[] = [
  {
    name: 'Karnataka',
    d: 'M150,278 L172,272 L188,278 L196,292 L192,310 L175,318 L155,315 L142,300 L138,288 Z',
    labelX: 167, labelY: 296,
  },
  {
    name: 'Maharashtra',
    d: 'M148,195 L178,188 L200,195 L210,215 L205,235 L188,250 L168,252 L152,245 L142,225 L138,210 Z',
    labelX: 175, labelY: 222,
  },
  {
    name: 'Tamil Nadu',
    d: 'M178,318 L196,315 L200,335 L195,355 L182,365 L172,358 L170,338 L174,325 Z',
    labelX: 185, labelY: 340,
  },
];

const CONTEXT_PATHS: StatePath[] = [
  { name: 'Gujarat', d: 'M88,168 L118,160 L132,175 L128,195 L108,200 L92,190 L85,178 Z', labelX: 108, labelY: 182 },
  { name: 'Rajasthan', d: 'M115,130 L160,122 L185,130 L190,155 L175,170 L145,172 L120,165 L108,150 Z', labelX: 150, labelY: 148 },
  { name: 'Delhi', d: 'M165,168 L175,165 L178,175 L170,180 L162,176 Z', labelX: 170, labelY: 174 },
  { name: 'Uttar Pradesh', d: 'M178,155 L225,150 L250,160 L255,180 L235,195 L205,192 L185,185 L175,172 Z', labelX: 215, labelY: 175 },
  { name: 'Madhya Pradesh', d: 'M165,180 L210,178 L235,195 L240,220 L220,235 L195,238 L175,225 L160,205 Z', labelX: 200, labelY: 210 },
  { name: 'West Bengal', d: 'M245,175 L268,170 L275,190 L270,210 L255,220 L248,205 L242,188 Z', labelX: 260, labelY: 195 },
  { name: 'Odisha', d: 'M225,215 L255,212 L268,230 L262,250 L245,258 L228,250 L220,232 Z', labelX: 245, labelY: 235 },
  { name: 'Chhattisgarh', d: 'M210,225 L235,225 L245,245 L240,265 L220,270 L205,255 L202,238 Z', labelX: 222, labelY: 248 },
  { name: 'Andhra Pradesh', d: 'M175,285 L195,282 L205,300 L200,320 L185,335 L170,330 L162,310 L165,295 Z', labelX: 185, labelY: 310 },
  { name: 'Telangana', d: 'M155,255 L180,250 L195,265 L190,285 L172,290 L158,278 L150,265 Z', labelX: 172, labelY: 272 },
  { name: 'Kerala', d: 'M168,338 L178,335 L182,355 L178,375 L170,380 L165,365 L162,348 Z', labelX: 173, labelY: 360 },
  { name: 'Punjab', d: 'M120,125 L145,120 L150,135 L138,145 L122,142 L115,132 Z', labelX: 132, labelY: 134 },
  { name: 'Haryana', d: 'M138,140 L165,135 L172,152 L158,162 L140,158 L132,148 Z', labelX: 150, labelY: 150 },
  { name: 'Bihar', d: 'M218,165 L245,160 L252,175 L245,188 L225,185 L215,175 Z', labelX: 232, labelY: 175 },
  { name: 'Jharkhand', d: 'M225,190 L248,188 L255,205 L248,220 L230,218 L222,205 Z', labelX: 238, labelY: 205 },
  { name: 'Assam', d: 'M268,155 L295,150 L305,165 L298,178 L278,175 L268,168 Z', labelX: 285, labelY: 165 },
  { name: 'Gujarat Coast', d: 'M85,195 L100,200 L105,215 L95,225 L85,218 L80,205 Z', labelX: 92, labelY: 212 },
];

export function IndiaMap({ selectedStates, onToggleState, getStateStats }: IndiaMapProps) {
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
    const stats = getStateStats(sp.name);

    let fill = '#e2e8f0';
    if (isDataState) {
      fill = isSelected ? '#0891b2' : '#bae6fd';
    }
    if (hovered === sp.name && isDataState) {
      fill = isSelected ? '#0e7490' : '#7dd3fc';
    }

    return (
      <g key={sp.name}>
        <path
          d={sp.d}
          fill={fill}
          stroke={isDataState ? '#0c4a6e' : '#cbd5e1'}
          strokeWidth={isDataState ? 1.2 : 0.8}
          className={isDataState ? 'cursor-pointer transition-all' : 'transition-all'}
          onClick={() => isDataState && onToggleState(sp.name)}
          onMouseMove={(e) => isDataState && handleMouseMove(e, sp.name)}
          onMouseLeave={() => setHovered(null)}
        />
        <text
          x={sp.labelX}
          y={sp.labelY}
          textAnchor="middle"
          fontSize={isDataState ? 7 : 5}
          fontWeight={isDataState ? 700 : 500}
          fill={isDataState ? (isSelected ? '#ffffff' : '#0c4a6e') : '#94a3b8'}
          className="pointer-events-none select-none"
        >
          {isDataState ? sp.name.slice(0, 3).toUpperCase() : ''}
        </text>
      </g>
    );
  };

  const hoveredStats = hovered ? getStateStats(hovered) : null;

  return (
    <div ref={containerRef} className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded border border-slate-200 p-2">
      <svg viewBox="60 100 260 300" className="w-full h-auto" style={{ maxHeight: '240px' }}>
        {/* India outline shadow */}
        <path
          d="M85,125 L120,115 L160,110 L200,108 L245,115 L275,125 L300,145 L305,170 L295,195 L280,220 L265,250 L250,280 L230,310 L210,335 L195,360 L180,375 L165,380 L155,370 L150,355 L145,335 L140,315 L135,295 L130,275 L125,255 L120,235 L115,215 L110,195 L105,175 L100,155 L92,140 Z"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1"
          className="pointer-events-none"
        />
        {CONTEXT_PATHS.map((sp) => renderStatePath(sp, false))}
        {STATE_PATHS.map((sp) => renderStatePath(sp, true))}
      </svg>

      {/* Floating tooltip */}
      {hovered && hoveredStats && (
        <div
          className="absolute z-20 pointer-events-none bg-white shadow-lg rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] min-w-[140px]"
          style={{
            left: Math.min(tooltipPos.x + 12, (containerRef.current?.clientWidth ?? 200) - 160),
            top: Math.max(tooltipPos.y - 70, 4),
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

      <div className="text-[10px] text-slate-400 text-center mt-1">
        Click states to multi-select · Hover for details
      </div>
      <div className="flex items-center justify-center gap-3 mt-1 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sky-200 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-300 inline-block" /> Other</span>
      </div>
    </div>
  );
}
