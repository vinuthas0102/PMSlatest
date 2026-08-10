import { User, Clock, Wrench, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { DEPT_NAME } from '@/lib/constants';
import { useAuth } from '@/auth/AuthContext';
import epiLogo from './logo.png';

export type AppScreen = 'dashboard' | 'maintenance';

interface HeaderProps {
  levelLabel: string;
  activeScreen: AppScreen;
  onScreenChange: (s: AppScreen) => void;
}

export function Header({ levelLabel, activeScreen, onScreenChange }: HeaderProps) {
  const { user, permissions, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const loginTime = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
          {permissions.canViewMaintenance && (
            <button
              onClick={() => onScreenChange(activeScreen === 'dashboard' ? 'maintenance' : 'dashboard')}
              title={activeScreen === 'dashboard' ? 'Switch to Maintenance' : 'Switch to Dashboard'}
              aria-label={activeScreen === 'dashboard' ? 'Switch to Maintenance' : 'Switch to Dashboard'}
              className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all ${
                activeScreen === 'maintenance'
                  ? 'bg-white text-blue-700 border-white shadow-sm'
                  : 'bg-blue-800/60 text-blue-100 border-blue-400/30 hover:bg-blue-700/50'
              }`}
            >
              {activeScreen === 'maintenance'
                ? <LayoutDashboard className="w-4 h-4" />
                : <Wrench className="w-4 h-4" />}
            </button>
          )}

          <div className="hidden xl:flex items-center gap-2 text-sm text-blue-100">
            <Clock className="w-4 h-4 text-blue-200" />
            <span>{loginTime}</span>
          </div>

          {/* User profile avatar with dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg bg-blue-800/60 border border-blue-400/30 px-2.5 py-1.5 hover:bg-blue-700/50 transition-all"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500 text-white text-xs font-bold shrink-0">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-bold text-white">{user?.name ?? 'Unknown'}</div>
                <div className="text-[10px] text-cyan-300">{user?.roleLabel ?? ''}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
                  <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
                    <div className="text-xs font-bold text-slate-800">{user?.name}</div>
                    <div className="text-[10px] text-slate-500">{user?.email}</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
                      <User className="w-3 h-3" />
                      {user?.roleLabel}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
