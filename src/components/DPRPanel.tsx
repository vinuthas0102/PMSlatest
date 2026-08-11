import { useState, useMemo } from 'react';
import {
  Activity, CalendarDays, LogOut, Save, ShieldCheck, X,
  FileBarChart, ClipboardList, History, Layers, Ruler, Hash,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/lib/supabase';
import { formatDateShort } from '@/lib/format';
import type { DrawingStatusEntry } from '@/types';

const DISCIPLINES = ['Civil', 'Mechanical', 'Electrical', 'Vessels/Piping'] as const;
type Discipline = (typeof DISCIPLINES)[number];
type Tab = 'dpr' | 'drawing';

export function DPRPanel({ name }: { name: string }) {
  const { logout } = useAuth();
  const { data, loading, error, reload } = useDashboardData();
  const [tab, setTab] = useState<Tab>('dpr');

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-2 ring-1 ring-cyan-400/30">
            <Activity className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-base font-bold">Daily Progress Reporting</h1>
            <p className="text-[11px] text-cyan-300">Restricted Site Engineer Workspace · {name}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">
          <LogOut className="h-3.5 w-3.5" />Logout
        </button>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <ShieldCheck className="h-4 w-4" />Only Daily Progress Report and Drawing Status entry is available for this role.
        </div>

        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab('dpr')}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold transition-colors ${tab === 'dpr' ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ClipboardList className="h-3.5 w-3.5" />Daily Progress
          </button>
          <button
            onClick={() => setTab('drawing')}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold transition-colors ${tab === 'drawing' ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <FileBarChart className="h-3.5 w-3.5" />Drawing Status
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading assigned projects...</p>
        ) : error ? (
          <p className="text-sm text-red-600">Unable to load projects.</p>
        ) : tab === 'dpr' ? (
          <DPRForm data={data} name={name} reload={reload} />
        ) : (
          <DrawingStatusForm data={data} name={name} reload={reload} />
        )}
      </main>
    </div>
  );
}

function DPRForm({ data, name, reload }: { data: NonNullable<ReturnType<typeof useDashboardData>['data']>; name: string; reload: () => Promise<void> }) {
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
    else { setMessage('Daily progress report updated successfully.'); setCat1(''); setCat2(''); setCat3(''); setCivilQty(''); setCivilDesc(''); setSkilled(''); setUnskilled(''); setRemarks(''); await reload(); }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-xl border-t-2 border-cyan-600 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">New Daily Progress Entry</h2>
          <CalendarDays className="h-4 w-4 text-cyan-600" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Project
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs">
              <option value="">Select project</option>
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.seq_no} · {p.title}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Entry Date
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <div />
          <label className="text-[10px] font-bold uppercase text-slate-500">Drawing Cat 1
            <input type="number" min="0" value={cat1} onChange={(e) => setCat1(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Drawing Cat 2
            <input type="number" min="0" value={cat2} onChange={(e) => setCat2(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Drawing Cat 3
            <input type="number" min="0" value={cat3} onChange={(e) => setCat3(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Executed Civil Quantity
            <input type="number" min="0" value={civilQty} onChange={(e) => setCivilQty(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Civil Item / Description
            <input value={civilDesc} onChange={(e) => setCivilDesc(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Skilled Manpower
            <input type="number" min="0" value={skilled} onChange={(e) => setSkilled(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Unskilled Manpower
            <input type="number" min="0" value={unskilled} onChange={(e) => setUnskilled(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Remarks
            <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
        </div>
        {message && <p className={`mt-3 rounded p-2 text-xs ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{message}</p>}
        <button onClick={submit} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-60">
          <Save className="h-4 w-4" />{saving ? 'Updating...' : 'Update Daily Progress'}
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-800">Recent DPR Entries</h2>
        <div className="space-y-2">
          {data.dprEntries.slice(0, 12).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>{entry.entry_date}</span><span>{entry.created_by}</span>
              </div>
              <p className="mt-1 text-slate-500">Drawing: {entry.drawing_cat1}/{entry.drawing_cat2}/{entry.drawing_cat3} · Civil: {entry.civil_item_qty} · Manpower: {entry.manpower_skilled + entry.manpower_unskilled}</p>
            </div>
          ))}
          {!data.dprEntries.length && <p className="py-8 text-center text-xs text-slate-400">No DPR entries recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}

function DrawingStatusForm({ data, name, reload }: { data: NonNullable<ReturnType<typeof useDashboardData>['data']>; name: string; reload: () => Promise<void> }) {
  const [projectId, setProjectId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('Civil');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [cat1, setCat1] = useState('');
  const [cat2, setCat2] = useState('');
  const [cat3, setCat3] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [completedDrawings, setCompletedDrawings] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const projectWorkOrders = useMemo(
    () => data.workOrders.filter((wo) => wo.project_id === projectId),
    [data.workOrders, projectId],
  );

  const totalDrawings = (Number(cat1) || 0) + (Number(cat2) || 0) + (Number(cat3) || 0);
  const completed = Number(completedDrawings) || 0;
  const progressPct = totalDrawings > 0 ? Math.min(100, (completed / totalDrawings) * 100) : 0;

  const resetForm = () => {
    setCat1(''); setCat2(''); setCat3(''); setCodeValue(''); setCompletedDrawings(''); setRemarks('');
  };

  const submit = async () => {
    if (!projectId || !entryDate || !discipline) return setMessage('Select a project, discipline, and entry date.');
    setSaving(true); setMessage('');
    const { error: saveError } = await supabase.from('drawing_status_entries').insert({
      project_id: projectId,
      work_order_id: workOrderId || null,
      discipline,
      entry_date: entryDate,
      cat1_total: Number(cat1) || 0,
      cat2_total: Number(cat2) || 0,
      cat3_total: Number(cat3) || 0,
      code_value: Number(codeValue) || 0,
      total_drawings: totalDrawings,
      completed_drawings: completed,
      drawing_progress_pct: Number(progressPct.toFixed(2)),
      remarks: remarks || null,
      created_by: name,
    });
    setSaving(false);
    if (saveError) setMessage('The drawing status could not be saved. Please try again.');
    else { setMessage('Drawing status updated successfully.'); resetForm(); await reload(); }
  };

  const projectEntries = useMemo(
    () => data.drawingStatusEntries.filter((e) => e.project_id === projectId),
    [data.drawingStatusEntries, projectId],
  );

  const disciplineSummary = useMemo(() => {
    const map = new Map<string, DrawingStatusEntry>();
    for (const entry of projectEntries) {
      const existing = map.get(entry.discipline);
      if (!existing || new Date(entry.created_at) > new Date(existing.created_at)) {
        map.set(entry.discipline, entry);
      }
    }
    return DISCIPLINES.map((d) => map.get(d)).filter(Boolean) as DrawingStatusEntry[];
  }, [projectEntries]);

  const grandTotalCat1 = disciplineSummary.reduce((s, e) => s + e.cat1_total, 0);
  const grandTotalCat2 = disciplineSummary.reduce((s, e) => s + e.cat2_total, 0);
  const grandTotalCat3 = disciplineSummary.reduce((s, e) => s + e.cat3_total, 0);
  const grandTotalDrawings = disciplineSummary.reduce((s, e) => s + e.total_drawings, 0);
  const grandTotalCode = disciplineSummary.reduce((s, e) => s + e.code_value, 0);
  const grandTotalCompleted = disciplineSummary.reduce((s, e) => s + e.completed_drawings, 0);
  const overallPct = grandTotalDrawings > 0 ? Math.min(100, (grandTotalCompleted / grandTotalDrawings) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Entry form */}
      <section className="rounded-xl border-t-2 border-cyan-600 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">New Drawing Status Entry</h2>
          <FileBarChart className="h-4 w-4 text-cyan-600" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Project
            <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setWorkOrderId(''); }} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs">
              <option value="">Select project</option>
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.seq_no} · {p.title}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Work Order
            <select value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" disabled={!projectId}>
              <option value="">All project WOs</option>
              {projectWorkOrders.map((wo) => <option key={wo.id} value={wo.id}>{wo.seq_no} · {wo.title}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Discipline
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value as Discipline)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs">
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Entry Date
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <div />
          <label className="text-[10px] font-bold uppercase text-slate-500">Cat 1 Drawings
            <input type="number" min="0" value={cat1} onChange={(e) => setCat1(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Cat 2 Drawings
            <input type="number" min="0" value={cat2} onChange={(e) => setCat2(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Cat 3 Drawings
            <input type="number" min="0" value={cat3} onChange={(e) => setCat3(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Code Value
            <input type="number" min="0" step="0.01" value={codeValue} onChange={(e) => setCodeValue(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500">Completed Drawings
            <input type="number" min="0" value={completedDrawings} onChange={(e) => setCompletedDrawings(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Remarks
            <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </label>
        </div>

        {/* Auto-calculated summary */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-cyan-50 border border-cyan-200 p-3">
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase text-cyan-700">Total Drawings</p>
            <p className="text-lg font-extrabold text-cyan-900">{totalDrawings}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase text-cyan-700">Completed</p>
            <p className="text-lg font-extrabold text-cyan-900">{completed}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase text-cyan-700">Progress %</p>
            <p className="text-lg font-extrabold text-cyan-900">{progressPct.toFixed(1)}%</p>
          </div>
        </div>

        {message && <p className={`mt-3 rounded p-2 text-xs ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{message}</p>}
        <button onClick={submit} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-60">
          <Save className="h-4 w-4" />{saving ? 'Updating...' : 'Update Drawing Status'}
        </button>
      </section>

      {/* Right column: discipline table + history */}
      <div className="space-y-4">
        {projectId && disciplineSummary.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Layers className="h-4 w-4 text-cyan-600" />Discipline Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[9px] font-bold uppercase text-slate-500">
                    <th className="pb-1.5 pr-2">Discipline</th>
                    <th className="pb-1.5 pr-2 text-right">Cat 1</th>
                    <th className="pb-1.5 pr-2 text-right">Cat 2</th>
                    <th className="pb-1.5 pr-2 text-right">Cat 3</th>
                    <th className="pb-1.5 pr-2 text-right">Total</th>
                    <th className="pb-1.5 text-right">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplineSummary.map((e) => (
                    <tr key={e.discipline} className="border-b border-slate-50 text-slate-700">
                      <td className="py-1.5 pr-2 font-semibold">{e.discipline}</td>
                      <td className="py-1.5 pr-2 text-right">{e.cat1_total}</td>
                      <td className="py-1.5 pr-2 text-right">{e.cat2_total}</td>
                      <td className="py-1.5 pr-2 text-right">{e.cat3_total}</td>
                      <td className="py-1.5 pr-2 text-right font-bold">{e.total_drawings}</td>
                      <td className="py-1.5 text-right">{e.code_value.toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr className="bg-cyan-50 font-extrabold text-cyan-900">
                    <td className="py-2 pr-2">Total</td>
                    <td className="py-2 pr-2 text-right">{grandTotalCat1}</td>
                    <td className="py-2 pr-2 text-right">{grandTotalCat2}</td>
                    <td className="py-2 pr-2 text-right">{grandTotalCat3}</td>
                    <td className="py-2 pr-2 text-right">{grandTotalDrawings}</td>
                    <td className="py-2 text-right">{grandTotalCode.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex items-center justify-between rounded bg-cyan-100 px-3 py-1.5 text-[11px] font-bold text-cyan-800">
              <span>Overall Progress</span>
              <span>{overallPct.toFixed(1)}%</span>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <History className="h-4 w-4 text-cyan-600" />Progress History
          </h2>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {projectEntries.slice(0, 20).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3 w-3 text-cyan-600" />{entry.discipline}
                  </span>
                  <span>{formatDateShort(entry.entry_date)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-slate-500">
                  <span>Cat: {entry.cat1_total}/{entry.cat2_total}/{entry.cat3_total} · Total: {entry.total_drawings}</span>
                  <span className="flex items-center gap-1 font-semibold text-cyan-700">
                    <Hash className="h-3 w-3" />{entry.drawing_progress_pct.toFixed(1)}%
                  </span>
                </div>
                {entry.remarks && <p className="mt-1 text-slate-400">{entry.remarks}</p>}
                <p className="mt-0.5 text-[10px] text-slate-400">by {entry.created_by || 'Unknown'}</p>
              </div>
            ))}
            {!projectEntries.length && <p className="py-8 text-center text-xs text-slate-400">No drawing status entries yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
