import { useState } from 'react';
import { Activity, CalendarDays, LayoutDashboard, LogOut, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/lib/supabase';

export function DPRPanel({ name, onNavigateToDashboard }: { name: string; onNavigateToDashboard?: () => void }) {
  const { logout } = useAuth();
  const { data, loading, error, reload } = useDashboardData();
  const [projectId, setProjectId] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [cat1, setCat1] = useState('');
  const [cat2, setCat2] = useState('');
  const [cat3, setCat3] = useState('');
  const [civilQty, setCivilQty] = useState('');
  const [civilDesc, setCivilDesc] = useState('');
  const [skilled, setSkilled] = useState('');
  const [unskilled, setUnskilled] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!projectId || !entryDate) return setMessage('Select a project and entry date.');
    setSaving(true); setMessage('');
    const { error: saveError } = await supabase.from('dpr_entries').insert({
      project_id: projectId, entry_date: entryDate, drawing_cat1: Number(cat1) || 0, drawing_cat2: Number(cat2) || 0,
      drawing_cat3: Number(cat3) || 0, civil_item_qty: Number(civilQty) || 0, civil_item_desc: civilDesc || null,
      manpower_skilled: Number(skilled) || 0, manpower_unskilled: Number(unskilled) || 0, remarks: remarks || null, created_by: name,
    });
    setSaving(false);
    if (saveError) setMessage('The DPR could not be saved. Please try again.');
    else {
      setMessage('Daily progress report updated successfully.');
      setCat1(''); setCat2(''); setCat3(''); setCivilQty(''); setCivilDesc(''); setSkilled(''); setUnskilled(''); setRemarks('');
      await reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-2 ring-1 ring-cyan-400/30">
            <Activity className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-base font-bold">Daily Progress Reporting</h1>
            <p className="text-[11px] text-cyan-300">Site Engineer Workspace · {name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <ShieldCheck className="h-4 w-4" />
          Only Daily Progress Report entry is available for this role. Use the Dashboard button to access Work Order sections for progress tracking.
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading assigned projects...</p>
        ) : error ? (
          <p className="text-sm text-red-600">Unable to load projects.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-xl border-t-2 border-cyan-600 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">New Daily Progress Entry</h2>
                <CalendarDays className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">
                  Project
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs">
                    <option value="">Select project</option>
                    {data?.projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.seq_no} · {project.title}</option>
                    ))}
                  </select>
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Entry Date
                  <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <div />
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Drawing Cat 1
                  <input type="number" min="0" value={cat1} onChange={(e) => setCat1(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Drawing Cat 2
                  <input type="number" min="0" value={cat2} onChange={(e) => setCat2(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Drawing Cat 3
                  <input type="number" min="0" value={cat3} onChange={(e) => setCat3(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Executed Civil Quantity
                  <input type="number" min="0" value={civilQty} onChange={(e) => setCivilQty(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">
                  Civil Item / Description
                  <input value={civilDesc} onChange={(e) => setCivilDesc(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Skilled Manpower
                  <input type="number" min="0" value={skilled} onChange={(e) => setSkilled(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Unskilled Manpower
                  <input type="number" min="0" value={unskilled} onChange={(e) => setUnskilled(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">
                  Remarks
                  <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
                </label>
              </div>
              {message && (
                <p className={`mt-3 rounded p-2 text-xs ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {message}
                </p>
              )}
              <button
                onClick={submit}
                disabled={saving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Updating...' : 'Update Daily Progress'}
              </button>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-slate-800">Recent DPR Entries</h2>
              <div className="space-y-2">
                {data?.dprEntries.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{entry.entry_date}</span>
                      <span>{entry.created_by}</span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      Drawing: {entry.drawing_cat1}/{entry.drawing_cat2}/{entry.drawing_cat3} · Civil: {entry.civil_item_qty} · Manpower: {entry.manpower_skilled + entry.manpower_unskilled}
                    </p>
                  </div>
                ))}
                {!data?.dprEntries.length && <p className="py-8 text-center text-xs text-slate-400">No DPR entries recorded yet.</p>}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
