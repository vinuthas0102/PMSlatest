import { useState, useEffect } from 'react';
import { X, Save, FilePlus, Loader2, AlertCircle } from 'lucide-react';
import type { Project, ProjectFormData } from '@/types';
import { STATES, DISTRICTS, CATEGORIES, SUBCATEGORIES } from '@/lib/format';

interface ProjectFormModalProps {
  project: Project | null;
  mode: 'edit' | 'create';
  onClose: () => void;
  onSave: (id: string | null, formData: ProjectFormData) => Promise<{ success: boolean; error?: string }>;
}

const EMPTY_FORM: ProjectFormData = {
  title: '',
  description: '',
  state: '',
  district: '',
  category: '',
  subcategory: '',
  start_date: '',
  duration_days: '',
  project_value: '',
  mbook_entry: '',
  manager: '',
  remarks: '',
};

export function ProjectFormModal({ project, mode, onClose, onSave }: ProjectFormModalProps) {
  const [form, setForm] = useState<ProjectFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setForm({
        title: project.title,
        description: project.description ?? '',
        state: project.state,
        district: project.district,
        category: project.category,
        subcategory: project.subcategory,
        start_date: project.start_date ?? '',
        duration_days: project.duration_days != null ? String(project.duration_days) : '',
        project_value: String(project.project_value),
        mbook_entry: String(project.mbook_entry),
        manager: project.manager,
        remarks: project.remarks ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [project, mode]);

  const update = (field: keyof ProjectFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (state: string) => {
    update('state', state);
    update('district', '');
    update('subcategory', '');
  };

  const handleCategoryChange = (cat: string) => {
    update('category', cat);
    update('subcategory', '');
  };

  const handleSubmit = async () => {
    if (mode === 'create' && !form.title.trim()) {
      setError('Project name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const id = mode === 'edit' ? project?.id ?? null : null;
    const result = await onSave(id, form);
    setSaving(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error ?? 'Failed to save project.');
    }
  };

  const isReadOnly = mode === 'edit';
  const districts = form.state ? DISTRICTS[form.state] || [] : [];
  const subcategories = form.category ? SUBCATEGORIES[form.category] || [] : [];

  const inputClass = 'w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition-colors';
  const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 overflow-hidden rounded-t-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
                {mode === 'create' ? <FilePlus className="h-5 w-5 text-cyan-400" /> : <Save className="h-5 w-5 text-cyan-400" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white">
                  {mode === 'create' ? 'Create New Project' : 'Edit Project Header'}
                </h2>
                {mode === 'edit' && project && (
                  <p className="mt-0.5 text-[11px] text-cyan-300 font-mono">
                    ID: {project.id} · Seq: {project.seq_no}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {/* Project ID (read-only in edit, auto in create) */}
            <div>
              <label className={labelClass}>Project ID</label>
              <input
                type="text"
                value={mode === 'edit' ? (project?.id ?? '') : 'Auto-generated'}
                disabled
                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Project Name */}
            <div>
              <label className={labelClass}>Project Name {mode === 'edit' && <span className="text-slate-400 normal-case">(read-only)</span>}</label>
              <input
                type="text"
                value={form.title}
                disabled={isReadOnly}
                onChange={(e) => update('title', e.target.value)}
                className={`${inputClass} ${isReadOnly ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''}`}
                placeholder="Enter project name"
              />
            </div>

            {/* Description - full width */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Enter project description"
              />
            </div>

            {/* State */}
            <div>
              <label className={labelClass}>State</label>
              <select value={form.state} onChange={(e) => handleStateChange(e.target.value)} className={inputClass}>
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* District / City */}
            <div>
              <label className={labelClass}>District / City</label>
              <select
                value={form.district}
                onChange={(e) => update('district', e.target.value)}
                className={inputClass}
                disabled={!form.state}
              >
                <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className={labelClass}>Subcategory</label>
              <select
                value={form.subcategory}
                onChange={(e) => update('subcategory', e.target.value)}
                className={inputClass}
                disabled={!form.category}
              >
                <option value="">{form.category ? 'Select subcategory' : 'Select category first'}</option>
                {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Project Duration (days) */}
            <div>
              <label className={labelClass}>Project Duration (days)</label>
              <input
                type="number"
                value={form.duration_days}
                onChange={(e) => update('duration_days', e.target.value)}
                className={inputClass}
                placeholder="e.g. 365"
                min="0"
              />
            </div>

            {/* Total Project Value (₹ Lakhs) */}
            <div>
              <label className={labelClass}>Total Project Value (₹ Lakhs)</label>
              <input
                type="number"
                value={form.project_value}
                onChange={(e) => update('project_value', e.target.value)}
                className={inputClass}
                placeholder="e.g. 1000"
                min="0"
                step="0.1"
              />
            </div>

            {/* Project Budgeted Value (₹ Lakhs) */}
            <div>
              <label className={labelClass}>Budgeted Value (MBook ₹ Lakhs)</label>
              <input
                type="number"
                value={form.mbook_entry}
                onChange={(e) => update('mbook_entry', e.target.value)}
                className={inputClass}
                placeholder="e.g. 500"
                min="0"
                step="0.1"
              />
            </div>

            {/* Project Manager */}
            <div>
              <label className={labelClass}>Project Manager</label>
              <input
                type="text"
                value={form.manager}
                onChange={(e) => update('manager', e.target.value)}
                className={inputClass}
                placeholder="Enter manager name"
              />
            </div>

            {/* Remarks - full width */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Project Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => update('remarks', e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Enter any remarks or notes"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-end gap-2 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-cyan-700 rounded hover:bg-cyan-800 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
            ) : mode === 'create' ? (
              <><FilePlus className="w-3.5 h-3.5" /> Create Project</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Update</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
