import { useState, useRef, useEffect, useCallback } from 'react';
import { Building2, Lock, Mail, LogIn, AlertCircle, ShieldCheck, Eye, EyeOff, UserCog } from 'lucide-react';
import { useAuth, DEMO_USERS, type DemoUser } from '@/auth/AuthContext';
import epiLogo from '@/components/logo.png';

const ROLE_ACCENTS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  admin: { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  management: { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  pm: { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  nodal: { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  site: { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let width = 0;
    let height = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      opacity: number;
    }
    let particles: Particle[] = [];

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      const count = Math.min(60, Math.floor((width * height) / 18000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8, 145, 178, ${p.opacity})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(8, 145, 178, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function LandingPage() {
  const { login, loginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      const success = login(email, password);
      setLoading(false);
      if (!success) {
        setError('Invalid credentials. Please use the demo credentials below or click a one-click login button.');
      }
    },
    [email, password, login],
  );

  const handleQuickLogin = useCallback(
    (user: DemoUser) => {
      setError(null);
      setLoading(true);
      loginAs(user);
      setLoading(false);
    },
    [loginAs],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-slate-200 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated particle background */}
      <div className="absolute inset-0 opacity-35">
        <ParticleField />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Branding */}
        <div className="lg:col-span-2 flex flex-col justify-center text-center lg:text-left rounded-2xl bg-white/75 backdrop-blur-sm border border-white/80 shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-md">
              <img src={epiLogo} alt="EPI Logo" className="h-16 w-auto object-contain" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Engineering Projects (India) Ltd.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-cyan-700 font-semibold">
            Project Monitoring &amp; Contract Management System (PMS/CMS)
          </p>
          <p className="mt-4 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto lg:mx-0">
            A comprehensive government infrastructure portal for monitoring project progress,
            financial tracking, work order management, and daily progress reporting.
          </p>

          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Secure Government Portal &middot; Authorized Personnel Only</span>
          </div>
        </div>

        {/* Right: Login card */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
                  <LogIn className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Portal Login</h2>
                  <p className="text-[11px] text-cyan-300">Sign in to access the PMS/CMS dashboard</p>
                </div>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="px-6 py-5">
              {error && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@epi.gov.in"
                      className="w-full text-sm border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full text-sm border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg hover:from-cyan-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-60"
              >
                {loading ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials panel */}
            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-1.5 mb-3">
                <UserCog className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Demo Credentials &amp; Roles
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Click any role card below for one-click login, or use the credentials above.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_USERS.map((u) => {
                  const accent = ROLE_ACCENTS[u.role];
                  return (
                    <button
                      key={u.email}
                      onClick={() => handleQuickLogin(u)}
                      className={`text-left rounded-lg border ${accent.border} ${accent.bg} p-2.5 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${accent.dot} shrink-0`} />
                        <span className={`text-xs font-bold ${accent.text}`}>{u.roleLabel}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono truncate">{u.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Password: {u.password}</div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-tight">{u.accessLevel}</div>
                      <div className={`mt-1.5 text-[10px] font-bold ${accent.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        Click to login &rarr;
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
