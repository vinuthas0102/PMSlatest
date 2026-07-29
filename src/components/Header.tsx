import { ShieldCheck, RefreshCw, User, Clock, ArrowLeftRight } from 'lucide-react';
import { DEPT_ID, DEPT_NAME, USER_NAME, USER_ROLE, LOGIN_TIME } from '@/lib/constants';

interface HeaderProps {
  levelLabel: string;
  onToggleInterface: () => void;
  interfaceMode: 'PMS' | 'CMS';
}

export function Header({ levelLabel, onToggleInterface, interfaceMode }: HeaderProps) {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-700">
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold tracking-tight">{levelLabel}</h1>
              <p className="text-[10px] text-slate-400">{DEPT_NAME}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 border-l border-slate-700 pl-3">
            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">{DEPT_ID}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-300">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">{USER_NAME}</span>
            <span className="text-slate-500">- {USER_ROLE}</span>
          </div>
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{LOGIN_TIME}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/50">
            <RefreshCw className="w-3 h-3" />
            <span>Synced</span>
          </div>
          <button
            onClick={onToggleInterface}
            className="flex items-center gap-1.5 text-[11px] font-medium bg-cyan-700 hover:bg-cyan-600 text-white px-2.5 py-1.5 rounded transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{interfaceMode === 'PMS' ? 'CMS Interface' : 'Jump to PMS'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
