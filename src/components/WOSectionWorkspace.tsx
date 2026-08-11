import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock3, FileCheck2,
  FilePlus2, FileText, History, Loader2, LockKeyhole, Plus, RotateCcw, Save,
  Upload, X,
} from 'lucide-react';
import type { WorkOrder, WOSection, WOSectionActivity, WOSectionDocument, WOSectionProgress } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthContext';

const SECTION_TYPES = ['drawing', 'equipment', 'civil', 'manpower', 'quality'] as const;
type SectionType = typeof SECTION_TYPES[number];
type EditorMode = 'create' | 'edit' | 'track' | null;

type Props = {
  workOrder: WorkOrder;
  sections: WOSection[];
  progress: WOSectionProgress[];
  documents: WOSectionDocument[];
  activity: WOSectionActivity[];
  onReload: () => Promise<void>;
};

const SECTION_LABELS: Record<SectionType, string> = {
  drawing: 'Drawing Status',
  equipment: 'Supply & Equipment',
  civil: 'Civil Work',
  manpower: 'Manpower',
  quality: 'Quality Documents',
};

const EMPTY_ITEM = {
  section_type: 'drawing' as SectionType,
  discipline: '',
  item_code: '',
  description: '',
  unit: '',
  required_qty: '0',
  value: '0',
  cat1_total: '0',
  cat2_total: '0',
  cat3_total: '0',
  skilled_count: '0',
  unskilled_count: '0',
  target_deployment: '',
};

function sectionTitle(type: SectionType): string {
  return SECTION_LABELS[type];
}

function statusLabel(status: WOSection['approval_status']): string {
  if (status === 'approved') return 'Approved';
  if (status === 'pending_approval') return 'Pending approval';
  return 'Draft';
}

function statusStyle(status: WOSection['approval_status']): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'pending_approval') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function WOSectionWorkspace({ workOrder, sections, progress, documents, activity, onReload }: Props) {
  const { user, permissions } = useAuth();
  const [activeType, setActiveType] = useState<SectionType>('drawing');
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [selectedItem, setSelectedItem] = useState<WOSection | null>(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [progressValue, setProgressValue] = useState('');
  const [progressUnit, setProgressUnit] = useState('');
  const [progressRemarks, setProgressRemarks] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentMandatory, setDocumentMandatory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => sections.filter((section) => section.section_type === activeType), [activeType, sections]);
  const selectedProgress = useMemo(() => progress.filter((entry) => entry.section_id === selectedItem?.id), [progress, selectedItem?.id]);
  const selectedDocuments = useMemo(() => documents.filter((entry) => entry.section_id === selectedItem?.id), [documents, selectedItem?.id]);
  const selectedActivity = useMemo(() => activity.filter((entry) => entry.section_id === selectedItem?.id), [activity, selectedItem?.id]);

  useEffect(() => {
    if (!selectedItem) return;
    const fresh = sections.find((entry) => entry.id === selectedItem.id);
    if (fresh && fresh !== selectedItem) setSelectedItem(fresh);
  }, [sections, selectedItem]);

  const openCreate = () => {
    setSelectedItem(null);
    setItemForm({ ...EMPTY_ITEM, section_type: activeType });
    setEditorMode('create');
    setMessage(null);
    setError(null);
  };

  const openDetail = (item: WOSection) => {
    setSelectedItem(item);
    setItemForm({
      section_type: item.section_type as SectionType,
      discipline: item.discipline ?? '',
      item_code: item.item_code ?? '',
      description: item.description ?? '',
      unit: item.unit ?? '',
      required_qty: String(item.required_qty ?? 0),
      value: String(item.value ?? 0),
      cat1_total: String(item.cat1_total ?? 0),
      cat2_total: String(item.cat2_total ?? 0),
      cat3_total: String(item.cat3_total ?? 0),
      skilled_count: String(item.skilled_count ?? 0),
      unskilled_count: String(item.unskilled_count ?? 0),
      target_deployment: item.target_deployment ?? '',
    });
    setEditorMode('edit');
    setMessage(null);
    setError(null);
  };

  const openTracker = (item: WOSection) => {
    openDetail(item);
    setEditorMode('track');
    setProgressValue('');
    setProgressUnit(item.unit ?? '');
    setProgressRemarks('');
  };

  const log = async (sectionId: string, action: string, details: string) => {
    await supabase.from('wo_section_activity').insert({
      work_order_id: workOrder.id,
      section_id: sectionId,
      action,
      actor_name: user?.name ?? 'Workspace user',
      actor_role: user?.role ?? null,
      details,
    });
  };

  const saveItem = async () => {
    if (!permissions.canDefineWOItems) return;
    if (!itemForm.description.trim() && !itemForm.item_code.trim()) {
      setError('Add an item code or description before saving.');
      return;
    }
    if (selectedItem?.approval_status === 'approved') {
      setError('Approved items are locked. Add progress updates instead.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      work_order_id: workOrder.id,
      section_type: itemForm.section_type,
      discipline: itemForm.discipline.trim() || null,
      item_code: itemForm.item_code.trim() || null,
      description: itemForm.description.trim() || null,
      unit: itemForm.unit.trim() || null,
      required_qty: Number(itemForm.required_qty) || 0,
      value: Number(itemForm.value) || 0,
      cat1_total: Number(itemForm.cat1_total) || 0,
      cat2_total: Number(itemForm.cat2_total) || 0,
      cat3_total: Number(itemForm.cat3_total) || 0,
      skilled_count: Number(itemForm.skilled_count) || 0,
      unskilled_count: Number(itemForm.unskilled_count) || 0,
      target_deployment: itemForm.target_deployment.trim() || null,
      defined_by: user?.name ?? null,
      approval_status: 'draft',
    };
    const result = selectedItem
      ? await supabase.from('wo_sections').update(payload).eq('id', selectedItem.id).select().maybeSingle()
      : await supabase.from('wo_sections').insert(payload).select().maybeSingle();
    if (result.error || !result.data) {
      setError('Could not save this item.');
      setSaving(false);
      return;
    }
    await log(result.data.id, selectedItem ? 'item_updated' : 'item_created', selectedItem ? 'Item definition updated.' : 'Item definition created.');
    setSaving(false);
    setMessage(selectedItem ? 'Item updated.' : 'Item created.');
    await onReload();
    setSelectedItem(result.data as WOSection);
    setEditorMode('edit');
  };

  const submitApproval = async () => {
    if (!selectedItem || !permissions.canDefineWOItems || selectedItem.approval_status === 'approved') return;
    setSaving(true);
    const { error: saveError } = await supabase.from('wo_sections').update({
      approval_status: 'pending_approval',
      submitted_by: user?.name ?? null,
      submitted_at: new Date().toISOString(),
    }).eq('id', selectedItem.id);
    if (saveError) setError('Could not submit this item for approval.');
    else {
      await log(selectedItem.id, 'submitted_for_approval', 'Item submitted for approval.');
      setMessage('Item submitted for approval.');
      setSelectedItem({ ...selectedItem, approval_status: 'pending_approval', submitted_by: user?.name ?? null, submitted_at: new Date().toISOString() });
      await onReload();
    }
    setSaving(false);
  };

  const setApproval = async (approved: boolean) => {
    if (!selectedItem || !permissions.canApproveWOItems) return;
    setSaving(true);
    const { error: saveError } = await supabase.from('wo_sections').update({
      approval_status: approved ? 'approved' : 'draft',
      approved_by: approved ? user?.name ?? null : null,
      approved_role: approved ? user?.role ?? null : null,
      approved_at: approved ? new Date().toISOString() : null,
      approval_remarks: approved ? 'Approved for site progress tracking.' : 'Returned for correction.',
    }).eq('id', selectedItem.id);
    if (saveError) setError('Could not update the approval status.');
    else {
      await log(selectedItem.id, approved ? 'item_approved' : 'item_returned', approved ? 'Item definition approved and frozen.' : 'Item returned for correction.');
      setMessage(approved ? 'Item approved and frozen.' : 'Item returned to draft.');
      setSelectedItem({
        ...selectedItem,
        approval_status: approved ? 'approved' : 'draft',
        approved_by: approved ? user?.name ?? null : null,
        approved_role: approved ? user?.role ?? null : null,
        approved_at: approved ? new Date().toISOString() : null,
        approval_remarks: approved ? 'Approved for site progress tracking.' : 'Returned for correction.',
      });
      await onReload();
    }
    setSaving(false);
  };

  const saveProgress = async () => {
    if (!selectedItem || !permissions.canTrackWOProgress || !progressValue.trim()) {
      setError('Enter a progress value before saving.');
      return;
    }
    setSaving(true);
    const { error: progressError } = await supabase.from('wo_section_progress').insert({
      work_order_id: workOrder.id,
      section_id: selectedItem.id,
      progress_value: Number(progressValue) || 0,
      progress_unit: progressUnit.trim() || selectedItem.unit || null,
      remarks: progressRemarks.trim() || null,
      created_by: user?.name ?? null,
      created_role: user?.role ?? null,
    });
    if (progressError) setError('Could not save the progress update.');
    else {
      await log(selectedItem.id, 'progress_recorded', `Progress recorded: ${progressValue} ${progressUnit}.`);
      setMessage('Progress update saved.');
      setProgressValue('');
      setProgressRemarks('');
      await onReload();
    }
    setSaving(false);
  };

  const createDocument = async () => {
    if (!selectedItem || !permissions.canDefineWOItems || !documentName.trim()) {
      setError('Enter the required document name first.');
      return;
    }
    setSaving(true);
    const { data, error: documentError } = await supabase.from('wo_section_documents').insert({
      work_order_id: workOrder.id,
      section_id: selectedItem.id,
      document_name: documentName.trim(),
      is_mandatory: documentMandatory,
    }).select().maybeSingle();
    if (documentError || !data) setError('Could not define the document.');
    else {
      await log(selectedItem.id, 'document_defined', `Document defined: ${documentName.trim()}.`);
      setDocumentName('');
      setMessage('Document requirement added.');
      await onReload();
    }
    setSaving(false);
  };

  const uploadDocument = async (document: WOSectionDocument, file: File) => {
    if (!permissions.canUploadWODocuments) return;
    setSaving(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${workOrder.id}/${document.id}-${safeName}`;
    const upload = await supabase.storage.from('wo-documents').upload(path, file, { upsert: true });
    if (upload.error) {
      setError('Could not upload the document.');
      setSaving(false);
      return;
    }
    const { error: documentError } = await supabase.from('wo_section_documents').update({
      status: 'submitted',
      file_name: file.name,
      storage_path: path,
      uploaded_by: user?.name ?? null,
      uploaded_at: new Date().toISOString(),
    }).eq('id', document.id);
    if (documentError) setError('The file uploaded but its record could not be updated.');
    else {
      await log(document.section_id, 'document_uploaded', `Document uploaded: ${file.name}.`);
      setMessage('Document uploaded for review.');
      await onReload();
    }
    setSaving(false);
  };

  const reviewDocument = async (document: WOSectionDocument, accepted: boolean) => {
    if (!permissions.canApproveWOItems) return;
    setSaving(true);
    const { error: documentError } = await supabase.from('wo_section_documents').update({
      status: accepted ? 'accepted' : 'returned',
      reviewed_by: user?.name ?? null,
      reviewed_at: new Date().toISOString(),
      review_remarks: accepted ? 'Document accepted.' : 'Document returned for correction.',
    }).eq('id', document.id);
    if (documentError) setError('Could not update document review status.');
    else {
      await log(document.section_id, accepted ? 'document_accepted' : 'document_returned', accepted ? 'Quality document accepted.' : 'Quality document returned.');
      setMessage(accepted ? 'Document accepted.' : 'Document returned.');
      await onReload();
    }
    setSaving(false);
  };

  const changeType = (direction: number) => {
    const index = SECTION_TYPES.indexOf(activeType);
    setActiveType(SECTION_TYPES[(index + direction + SECTION_TYPES.length) % SECTION_TYPES.length]);
    setEditorMode(null);
  };

  return (
    <div className="space-y-3">
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button onClick={() => changeType(-1)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Previous section"><ArrowLeft className="h-4 w-4" /></button>
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {SECTION_TYPES.map((type) => (
            <button key={type} onClick={() => { setActiveType(type); setEditorMode(null); }} className={`min-w-max rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${activeType === type ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {sectionTitle(type)} <span className="ml-1 opacity-70">{sections.filter((entry) => entry.section_type === type).length}</span>
            </button>
          ))}
        </div>
        <button onClick={() => changeType(1)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Next section"><ArrowRight className="h-4 w-4" /></button>
      </div>

      <div className={`grid gap-3 ${editorMode ? 'xl:grid-cols-[minmax(0,1fr)_420px]' : 'grid-cols-1'}`}>
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{sectionTitle(activeType)}</h3>
              <p className="mt-1 text-[11px] text-slate-500">{activeType === 'quality' ? 'Required documents and review status' : 'Planned item summary and live site progress'}</p>
            </div>
            {permissions.canDefineWOItems && <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-[11px] font-bold text-white hover:bg-cyan-800"><Plus className="h-3.5 w-3.5" /> Create Item</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="bg-slate-900 text-left text-[10px] uppercase tracking-wide text-white">
                <tr><th className="p-2">Item</th><th className="p-2">Discipline</th><th className="p-2">Planned</th><th className="p-2">Progress</th><th className="p-2">Status</th><th className="p-2 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const itemProgress = progress.filter((entry) => entry.section_id === row.id);
                  const totalProgress = itemProgress.reduce((sum, entry) => sum + Number(entry.progress_value || 0), 0);
                  const itemDocuments = documents.filter((entry) => entry.section_id === row.id);
                  const completedDocs = itemDocuments.filter((entry) => entry.status === 'accepted').length;
                  return <tr key={row.id} className="border-b border-slate-100 odd:bg-slate-50/60">
                    <td className="max-w-[260px] p-2"><div className="font-semibold text-slate-800">{row.item_code || row.description || 'Unnamed item'}</div><div className="text-[10px] text-slate-500">{row.description && row.item_code ? row.description : row.unit || 'No unit'}</div></td>
                    <td className="p-2 text-slate-600">{row.discipline || '-'}</td>
                    <td className="p-2 font-semibold text-slate-700">{activeType === 'manpower' ? `${row.skilled_count + row.unskilled_count} people` : activeType === 'quality' ? `${completedDocs}/${itemDocuments.length} docs` : `${row.required_qty} ${row.unit || ''}`}</td>
                    <td className="p-2"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.min(100, Number(row.required_qty) ? totalProgress / Number(row.required_qty) * 100 : 0)}%` }} /></div><span className="tabular-nums text-slate-600">{totalProgress} {row.unit || ''}</span></div></td>
                    <td className="p-2"><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyle(row.approval_status)}`}>{statusLabel(row.approval_status)}</span></td>
                    <td className="p-2"><div className="flex justify-end gap-1"><button onClick={() => openDetail(row)} className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-cyan-700 hover:bg-cyan-50">Details</button>{permissions.canTrackWOProgress && <button onClick={() => openTracker(row)} className="rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700 hover:bg-cyan-100">Track</button>}</div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          {!rows.length && <div className="px-4 py-12 text-center text-xs text-slate-400">No items have been defined for this section yet.</div>}
        </section>

        {editorMode && <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"><div><div className="flex items-center gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{editorMode === 'create' ? 'Create Item' : editorMode === 'track' ? 'Track Progress' : 'Item Detail'}</h3>{selectedItem && <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusStyle(selectedItem.approval_status)}`}>{statusLabel(selectedItem.approval_status)}</span>}</div><p className="mt-1 text-[11px] text-slate-500">{selectedItem?.item_code || selectedItem?.description || sectionTitle(itemForm.section_type)}</p></div><button onClick={() => setEditorMode(null)} className="rounded p-1 text-slate-400 hover:bg-slate-200"><X className="h-4 w-4" /></button></div>
          <div className="max-h-[72vh] overflow-y-auto p-4">
            {editorMode !== 'track' && <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Item Code" value={itemForm.item_code} onChange={(value) => setItemForm({ ...itemForm, item_code: value })} />
                <Field label="Discipline" value={itemForm.discipline} onChange={(value) => setItemForm({ ...itemForm, discipline: value })} />
                <Field label="Description" value={itemForm.description} onChange={(value) => setItemForm({ ...itemForm, description: value })} full />
                <Field label="Unit" value={itemForm.unit} onChange={(value) => setItemForm({ ...itemForm, unit: value })} />
                <Field label="Planned Quantity" value={itemForm.required_qty} onChange={(value) => setItemForm({ ...itemForm, required_qty: value })} type="number" />
                <Field label="Planned Value" value={itemForm.value} onChange={(value) => setItemForm({ ...itemForm, value })} type="number" />
              </div>
              {itemForm.section_type === 'drawing' && <div className="mt-3 grid grid-cols-3 gap-2"><Field label="Category 1" value={itemForm.cat1_total} onChange={(value) => setItemForm({ ...itemForm, cat1_total: value })} type="number" /><Field label="Category 2" value={itemForm.cat2_total} onChange={(value) => setItemForm({ ...itemForm, cat2_total: value })} type="number" /><Field label="Category 3" value={itemForm.cat3_total} onChange={(value) => setItemForm({ ...itemForm, cat3_total: value })} type="number" /></div>}
              {itemForm.section_type === 'manpower' && <div className="mt-3 grid grid-cols-2 gap-2"><Field label="Skilled" value={itemForm.skilled_count} onChange={(value) => setItemForm({ ...itemForm, skilled_count: value })} type="number" /><Field label="Unskilled" value={itemForm.unskilled_count} onChange={(value) => setItemForm({ ...itemForm, unskilled_count: value })} type="number" /></div>}
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={saveItem} disabled={saving || !permissions.canDefineWOItems || selectedItem?.approval_status === 'approved'} className="flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Item'}</button>{selectedItem && selectedItem.approval_status === 'draft' && permissions.canDefineWOItems && <button onClick={submitApproval} disabled={saving} className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800"><ClipboardCheck className="h-3.5 w-3.5" /> Submit Approval</button>}{selectedItem && selectedItem.approval_status === 'pending_approval' && permissions.canApproveWOItems && <><button onClick={() => setApproval(true)} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white"><Check className="h-3.5 w-3.5" /> Approve & Freeze</button><button onClick={() => setApproval(false)} disabled={saving} className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"><RotateCcw className="h-3.5 w-3.5" /> Return</button></>}</div>
            </>}

            {editorMode === 'track' && <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-cyan-800"><Clock3 className="h-4 w-4" /> Add site progress</div><div className="grid grid-cols-2 gap-2"><Field label="Progress Value" value={progressValue} onChange={setProgressValue} type="number" /><Field label="Unit" value={progressUnit} onChange={setProgressUnit} /></div><label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Remarks<textarea value={progressRemarks} onChange={(event) => setProgressRemarks(event.target.value)} rows={3} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" /></label><button onClick={saveProgress} disabled={saving} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> Save Progress</button></div>}

            {selectedItem?.approval_status === 'approved' && <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700"><LockKeyhole className="h-4 w-4" /> Definition frozen. Site progress can still be added.</div>}

            {selectedItem && itemForm.section_type === 'quality' && <div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><FileCheck2 className="h-4 w-4 text-cyan-600" /> Required documents</div>{permissions.canDefineWOItems && <div className="mb-3 flex gap-2"><input value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Document name" className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs" /><button onClick={createDocument} disabled={saving} className="rounded bg-cyan-700 px-2 py-1.5 text-[10px] font-bold text-white"><FilePlus2 className="h-3.5 w-3.5" /></button></div>}{selectedDocuments.map((document) => <div key={document.id} className="mb-2 rounded-lg border border-slate-200 p-2"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-semibold text-slate-700">{document.document_name}</div><div className="text-[10px] text-slate-500">{document.is_mandatory ? 'Mandatory' : 'Optional'} · {document.status.replace('_', ' ')}</div></div>{permissions.canUploadWODocuments && <label className="flex cursor-pointer items-center gap-1 rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700"><Upload className="h-3 w-3" /> Upload<input type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadDocument(document, file); }} /></label>}</div>{document.file_name && <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500"><FileText className="h-3 w-3" />{document.file_name}</div>}{document.status === 'submitted' && permissions.canApproveWOItems && <div className="mt-2 flex gap-2"><button onClick={() => reviewDocument(document, true)} className="flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white"><CheckCircle2 className="h-3 w-3" /> Accept</button><button onClick={() => reviewDocument(document, false)} className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"><RotateCcw className="h-3 w-3" /> Return</button></div>}</div>)}</div>}

            {selectedItem && <div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><History className="h-4 w-4 text-cyan-600" /> Activity history</div>{selectedActivity.length === 0 ? <p className="text-xs text-slate-400">No activity recorded yet.</p> : <div className="space-y-3">{selectedActivity.map((entry) => <div key={entry.id} className="border-l-2 border-cyan-200 pl-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase text-cyan-700">{entry.action.replaceAll('_', ' ')}</span><span className="text-[10px] text-slate-400">{formatDate(entry.created_at)}</span></div><div className="text-xs text-slate-600">{entry.details}</div><div className="text-[10px] text-slate-400">{entry.actor_name || 'Workspace user'} · {entry.actor_role || 'user'}</div></div>)}</div>}</div>}
            {selectedItem && selectedProgress.length > 0 && <div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Progress updates</div><div className="space-y-2">{selectedProgress.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-3 rounded bg-slate-50 p-2 text-xs"><div><div className="font-semibold text-slate-700">{entry.progress_value} {entry.progress_unit || ''}</div><div className="text-[10px] text-slate-500">{entry.remarks || 'Progress recorded'}</div></div><div className="text-right text-[10px] text-slate-400">{entry.entry_date}<br />{entry.created_by || 'Site Engineer'}</div></div>)}</div></div>}
          </div>
        </aside>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', full = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; full?: boolean }) {
  return <label className={`block text-[10px] font-bold uppercase tracking-wide text-slate-500 ${full ? 'col-span-2' : ''}`}>{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs font-normal normal-case text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-100" /></label>;
}
