import { User, Clock } from 'lucide-react';
import { DEPT_NAME, USER_NAME, LOGIN_TIME } from '@/lib/constants';
import epiLogo from './logo.png';

interface HeaderProps {
  levelLabel: string;
}

export function Header({ levelLabel }: HeaderProps) {
  return (
    <header className="bg-slate-600 text-slate-100 border-b border-slate-500">
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <img src={epiLogo} alt="EPI Logo" className="h-9 w-auto object-contain" />
            <div className="leading-tight">
              <h1 className="text-sm font-bold tracking-tight">{levelLabel}</h1>
              <p className="text-[10px] text-slate-300">{DEPT_NAME}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-300">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">{USER_NAME}</span>
          </div>
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{LOGIN_TIME}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
