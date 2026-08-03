import { User, Clock, Wrench, LayoutDashboard } from 'lucide-react';
import { DEPT_NAME, USER_NAME, LOGIN_TIME } from '@/lib/constants';
import epiLogo from './logo.png';

export type AppScreen = 'dashboard' | 'maintenance';

interface HeaderProps {
  levelLabel: string;
  activeScreen: AppScreen;
  onScreenChange: (s: AppScreen) => void;
}

export function Header({ levelLabel, activeScreen, onScreenChange }: HeaderProps) {
  return (
    <header className="bg-blue-700 text-white border-b border-blue-500">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-3 shrink-0">
            <img src={epiLogo} alt="EPI Logo" className="h-11 w-auto object-contain" />
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-tight">{levelLabel}</h1>
              <p className="text-xs text-blue-200">{DEPT_NAME}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 bg-blue-800/60 rounded-lg p-0.5 border border-blue-400/30">
            <button
              onClick={() => onScreenChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeScreen === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => onScreenChange('maintenance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeScreen === 'maintenance'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Maintenance</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-sm text-blue-100">
            <User className="w-4 h-4 text-cyan-300" />
            <span className="font-medium">{USER_NAME}</span>
          </div>
          <div className="hidden xl:flex items-center gap-2 text-sm text-blue-100">
            <Clock className="w-4 h-4 text-blue-200" />
            <span>{LOGIN_TIME}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
