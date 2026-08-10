import { useEffect, useMemo, useState } from 'react';
import { X, Save, FilePlus, Loader2, AlertCircle, LockKeyhole, Send } from 'lucide-react';
import type { Project, ProjectFormData, ProjectStatus } from '@/types';
import { STATES, DISTRICTS, CATEGORIES, SUBCATEGORIES } from '@/lib/format';

interface ProjectFormModalProps {
  project: Project | null;
  mode: 'edit' | 'create';
  onClose: () => void;
  onSave: (id: string | null, formData: ProjectFormData, status: ProjectStatus) => Promise<{ success: boolean; error?: string }>;
}

const EMPTY_FORM: ProjectFormData = {
  title: '', description: '', project_type: 'EPC', project_code: '', segment_id: '', client_name: '',
  contract_type_id: '', scheme_id: '', tender_ref_number: '', state: '', district: '', site_city: '', region_id: '',
  site_address_a: '', site_address_b: '', pin_code: '', category: '', subcategory: '', work_category_id: '',
  start_date: '', duration_days: '', project_value: '', workorder_value: '', mbook_entry: '', security_deposit: '',
  sd_bg_number: '', sd_bg_valid_from: '', sd_bg_valid_to: '', claim_period_upto: '', engineer_incharge_id: '',
  phone_number: '', email_id: '', manager: '', remarks: '', drawing_pct: '', supply_pct: '', civil_pct: '', manpower_pct: '', others_pct: '',
};

function valueOrEmpty(value: string | number | null | undefined): string {
  return value == null ? '' : String(value);
}

export function ProjectFormModal({ project, mode, onClose, onSave }: ProjectFormModalProps) {
  const [form, setForm] = useState<ProjectFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeviation, setShowDeviation] = useState(false);
  const [deviationNote, setDeviationNote] = useState('');

  useEffect(() => {
    if (mode === 'edit' && project) {
      setForm({
        title: project.title, description: project.description ?? '', project_type: project.project_type ?? 'EPC',
        project_code: project.project_code ?? project.code, segment_id: project.segment_id ?? '', client_name: project.client_name ?? '',
        contract_type_id: project.contract_type_id ?? '', scheme_id: project.scheme_id ?? '', tender_ref_number: project.tender_ref_number ?? '',
        state: project.state, district: project.district, site_city: project.site_city ?? '', region_id: project.region_id ?? '',
        site_address_a: project.site_address_a ?? '', site_address_b: project.site_address_b ?? '', pin_code: project.pin_code ?? '',
        category: project.category, subcategory: project.subcategory, work_category_id: project.work_category_id ?? '',
        start_date: project.start_date ?? '', duration_days: valueOrEmpty(project.duration_days), project_value: valueOrEmpty(project.project_value),
        workorder_value: valueOrEmpty(project.workorder_value), mbook_entry: valueOrEmpty(project.mbook_entry), security_deposit: valueOrEmpty(project.security_deposit),
        sd_bg_number: project.sd_bg_number ?? '', sd_bg_valid_from: project.sd_bg_valid_from ?? '', sd_bg_valid_to: project.sd_bg_valid_to ?? '',
        claim_period_upto: project.claim_period_upto ?? '', engineer_incharge_id: project.engineer_incharge_id ?? '', phone_number: project.phone_number ?? '',
        email_id: project.email_id ?? '', manager: project.manager, remarks: project.remarks ?? '',
        drawing_pct: valueOrEmpty(project.drawing_pct), supply_pct: valueOrEmpty(project.supply_pct), civil_pct: valueOrEmpty(project.civil_pct),
        manpower_pct: valueOrEmpty(project.manpower_pct), others_pct: valueOrEmpty(project.others_pct),
      });
    } else setForm(EMPTY_FORM);
    setError(null);
    setShowDeviation(false);
    setDeviationNote('');
  }, [mode, project]);

  const update = (field: keyof ProjectFormData, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const districts = form.state ? DISTRICTS[form.state] || [] : [];
  const subcategories = form.category ? SUBCATEGORIES[form.category] || [] : [];
  const allocationTotal = useMemo(() => ['drawing_pct', 'supply_pct', 'civil_pct', 'manpower_pct', 'others_pct'].reduce((sum, key) => sum + (Number(form[key as keyof ProjectFormData]) || 0), 0), [form]);
  const isFinalized = mode === 'edit' && project?.status === 'finalized';
  const inputClass = 'w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition-colors disabled:bg-slate-100 disabled:text-slate-400';
  const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block';

  const handleSubmit = async (status: ProjectStatus) => {
    if (!form.title.trim()) return setError('Project name is required.');
    if (allocationTotal > 100) { setShowDeviation(true); return; }
    if (Math.abs(allocationTotal - 100) > 0.01) return setError('Scope allocation must total exactly 100%.');
    if (isFinalized) return setError('This project is finalized and locked. Submit an amendment request to change it.');
    setSaving(true); setError(null);
    const result = await onSave(mode === 'edit' ? project?.id ?? null : null, form, status);
    setSaving(false);
    if (result.success) onClose(); else setError(result.error ?? 'Failed to save project.');
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-cyan-700">{title}</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div></section>;
  const Field = ({ label, field, type = 'text', full = false }: { label: string; field: keyof ProjectFormData; type?: string; full?: boolean }) => <div className={full ? 'sm:col-span-2' : ''}><label className={labelClass}>{label}</label><input type={type} value={form[field]} disabled={isFinalized} onChange={(e) => update(field, e.target.value)} className={inputClass} /></div>;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm" onClick={onClose}>
    <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-3"><div><h2 className="text-base font-bold text-white">{mode === 'create' ? 'Create New CMS Project' : 'Edit Project Header'}</h2><p className="text-[11px] text-cyan-300">{project ? `${project.seq_no} · ${project.status === 'finalized' ? 'Finalized / Locked' : 'Draft'}` : 'Complete all required project information'}</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        <div className="flex items-center gap-4 rounded-lg border border-cyan-200 bg-cyan-50 p-3"><span className={labelClass}>Project Type</span>{(['EPC', 'PMC'] as const).map((type) => <label key={type} className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="radio" checked={form.project_type === type} disabled={isFinalized} onChange={() => update('project_type', type)} />{type === 'EPC' ? 'EPC — Engineering, Procurement, Construction' : 'PMC — Project Management Consultancy'}</label>)}</div>
        <Section title="Project Identity"><Field label="Project Name" field="title" /><Field label="Project Code" field="project_code" /><Field label="Segment ID" field="segment_id" /><Field label="Tender Reference Number" field="tender_ref_number" /><Field label="Client Name" field="client_name" /><Field label="Contract Type ID" field="contract_type_id" /><Field label="Scheme ID" field="scheme_id" /><Field label="Work Category ID" field="work_category_id" /><Field label="Description" field="description" full /></Section>
        <Section title="Location & Classification"><div><label className={labelClass}>State</label><select value={form.state} disabled={isFinalized} onChange={(e) => { update('state', e.target.value); update('district', ''); }} className={inputClass}><option value="">Select state</option>{STATES.map((state) => <option key={state}>{state}</option>)}</select></div><div><label className={labelClass}>District</label><select value={form.district} disabled={!form.state || isFinalized} onChange={(e) => update('district', e.target.value)} className={inputClass}><option value="">Select district</option>{districts.map((district) => <option key={district}>{district}</option>)}</select></div><Field label="Site City" field="site_city" /><Field label="Region ID" field="region_id" /><Field label="Address Line A" field="site_address_a" /><Field label="Address Line B" field="site_address_b" /><Field label="PIN Code" field="pin_code" /></Section>
        <Section title="Category & Personnel"><div><label className={labelClass}>Category</label><select value={form.category} disabled={isFinalized} onChange={(e) => { update('category', e.target.value); update('subcategory', ''); }} className={inputClass}><option value="">Select category</option>{CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select></div><div><label className={labelClass}>Subcategory</label><select value={form.subcategory} disabled={!form.category || isFinalized} onChange={(e) => update('subcategory', e.target.value)} className={inputClass}><option value="">Select subcategory</option>{subcategories.map((sub) => <option key={sub}>{sub}</option>)}</select></div><Field label="Engineer In-Charge ID" field="engineer_incharge_id" /><Field label="Project Manager" field="manager" /><Field label="Phone Number" field="phone_number" /><Field label="Email ID" field="email_id" type="email" /></Section>
        <Section title="Timeline & Financials"><Field label="Start Date" field="start_date" type="date" /><Field label="Duration (days)" field="duration_days" type="number" /><Field label="Project Value (₹ Lakhs)" field="project_value" type="number" /><Field label="Work Order Value (₹ Cr)" field="workorder_value" type="number" /><Field label="MBook Entry (₹ Lakhs)" field="mbook_entry" type="number" /><Field label="Security Deposit" field="security_deposit" type="number" /><Field label="Claim Period Upto" field="claim_period_upto" type="date" /></Section>
        <Section title="Security Deposit Bank Guarantee"><Field label="SD BG Number" field="sd_bg_number" /><Field label="Valid From" field="sd_bg_valid_from" type="date" /><Field label="Valid To" field="sd_bg_valid_to" type="date" /></Section>
        <section className="rounded-lg border border-slate-200 bg-white p-3"><div className="mb-2 flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Scope Allocation</h3><span className={`rounded-full px-2 py-1 text-xs font-bold ${Math.abs(allocationTotal - 100) < 0.01 ? 'bg-emerald-100 text-emerald-700' : allocationTotal > 100 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{allocationTotal.toFixed(1)}% / 100%</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{(['drawing_pct', 'supply_pct', 'civil_pct', 'manpower_pct', 'others_pct'] as const).map((field) => <div key={field}><label className={labelClass}>{field.replace('_pct', '').replace('_', ' ')} %</label><input type="number" min="0" max="100" step="0.1" value={form[field]} disabled={isFinalized} onChange={(e) => update(field, e.target.value)} className={inputClass} /></div>)}</div></section>
        <div><label className={labelClass}>Remarks</label><textarea value={form.remarks} disabled={isFinalized} onChange={(e) => update('remarks', e.target.value)} rows={2} className={inputClass} /></div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3"><div className="text-[11px] text-slate-500">{isFinalized ? 'Finalized projects require an amendment request.' : 'Save as draft or finish to lock the project header.'}</div><div className="flex gap-2"><button onClick={onClose} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>{!isFinalized && <><button onClick={() => handleSubmit('draft')} disabled={saving} className="flex items-center gap-1.5 rounded border border-cyan-300 bg-white px-3 py-1.5 text-xs font-bold text-cyan-700"><Save className="h-3.5 w-3.5" />Save Draft</button><button onClick={() => handleSubmit('finalized')} disabled={saving} className="flex items-center gap-1.5 rounded bg-cyan-700 px-3 py-1.5 text-xs font-bold text-white"><LockKeyhole className="h-3.5 w-3.5" />Finish &amp; Finalize</button></>}{isFinalized && <button disabled className="flex items-center gap-1.5 rounded bg-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600"><Send className="h-3.5 w-3.5" />Locked</button>}</div></div>
      {showDeviation && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"><h3 className="text-base font-bold text-slate-900">Deviation Request &amp; Hierarchy Approval</h3><p className="mt-1 text-xs text-slate-500">The scope allocation is above 100%. Record a noting before requesting approval.</p><textarea value={deviationNote} onChange={(e) => setDeviationNote(e.target.value)} placeholder="Enter noting / justification" rows={4} className="mt-3 w-full rounded-lg border border-slate-300 p-2 text-xs" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowDeviation(false)} className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold">Cancel</button><button onClick={() => { setShowDeviation(false); setError('Approval request noted. Allocation must be approved before saving.'); }} className="rounded bg-cyan-700 px-3 py-1.5 text-xs font-bold text-white">Submit for Approval</button></div></div></div>}
    </div>
  </div>;
}
