import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock3, CreditCard, Edit3, FileCheck2,
  FilePlus2, FileText, History, LockKeyhole, Plus, RotateCcw, Save,
  Upload, X,
} from 'lucide-react';
import type { PaymentEntry, WorkOrder, WOSection, WOSectionActivity, WOSectionDocument, WOSectionProgress, WODrawingProgress } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthContext';

const SECTION_TYPES = ['drawing', 'equipment', 'civil', 'manpower', 'quality'] as const;
type SectionType = typeof SECTION_TYPES[number];
type EditorMode = 'create' | 'edit' | 'track' | null;
type PanelTab = 'details' | 'activity' | 'progress' | 'payments';

type Props = {
  workOrder: WorkOrder;
  sections: WOSection[];
  progress: WOSectionProgress[];
  documents: WOSectionDocument[];
  activity: WOSectionActivity[];
  drawingProgress: WODrawingProgress[];
  payments: PaymentEntry[];
  onReload: () => Promise<void>;
};

const SECTION_LABELS: Record<SectionType, string> = {
  drawing: 'Drawing Status',
  equipment: 'Supply & Equipment',
  civil: 'Civil Work',
  manpower: 'Manpower',
  quality: 'Quality Documents',
};

const EMPTY_PAYMENT = {
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  vendorInvoiceNumber: '',
  vendorInvoiceDate: '',
  voucherNumber: '',
  voucherDate: '',
  remarks: '',
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

export function WOSectionWorkspace({ workOrder, sections, progress, documents, activity, drawingProgress, payments, onReload }: Props) {
  const { user, permissions } = useAuth();
  const [activeType, setActiveType] = useState<SectionType>('drawing');
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('details');
  const [selectedItem, setSelectedItem] = useState<WOSection | null>(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [progressValue, setProgressValue] = useState('');
  const [progressUnit, setProgressUnit] = useState('');
  const [progressRemarks, setProgressRemarks] = useState('');
  const [drawingProgressValues, setDrawingProgressValues] = useState({ cat1: '', cat2: '', cat3: '' });
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentMandatory, setDocumentMandatory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => sections.filter((section) => section.section_type === activeType), [activeType, sections]);
  const selectedProgress = useMemo(() => progress.filter((entry) => entry.section_id === selectedItem?.id), [progress, selectedItem?.id]);
  const selectedDocuments = useMemo(() => documents.filter((entry) => entry.section_id === selectedItem?.id), [documents, selectedItem?.id]);
  const selectedActivity = useMemo(() => activity.filter((entry) => entry.section_id === selectedItem?.id), [activity, selectedItem?.id]);
  const selectedDrawingProgress = useMemo(() => drawingProgress.filter((entry) => entry.section_id === selectedItem?.id), [drawingProgress, selectedItem?.id]);
  const selectedPayments = useMemo(() => payments.filter((entry) => entry.section_id === selectedItem?.id), [payments, selectedItem?.id]);

  const openCreate = () => {
    setSelectedItem(null);
    setItemForm({ ...EMPTY_ITEM, section_type: activeType });
    setEditorMode('create');
    setPanelTab('details');
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
    setPanelTab('details');
    setMessage(null);
    setError(null);
  };

  const openPaymentEditor = (item: WOSection) => {
    openDetail(item);
    setPanelTab('payments');
    setEditingPaymentId(null);
    setPaymentForm(EMPTY_PAYMENT);
  };

  const editPayment = (payment: PaymentEntry) => {
    setEditingPaymentId(payment.id);
    setPaymentForm({
      amount: String(payment.amount_paid),
      paymentDate: payment.payment_date,
      vendorInvoiceNumber: payment.vendor_invoice_number ?? '',
      vendorInvoiceDate: payment.vendor_invoice_date ?? '',
      voucherNumber: payment.voucher_number ?? '',
      voucherDate: payment.voucher_date ?? '',
      remarks: payment.remarks ?? '',
    });
  };

  const savePayment = async () => {
    if (!selectedItem || !permissions.canLogPayments) return;
    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !paymentForm.paymentDate) {
      setError('Enter a valid payment amount and date.');
      return;
    }
    setSaving(true);
    setError(null);
    const rpcName = editingPaymentId ? 'update_section_payment' : 'record_section_payment';
    const payload = editingPaymentId ? {
      p_payment_id: editingPaymentId,
      p_amount: amount,
      p_payment_date: paymentForm.paymentDate,
      p_vendor_invoice_number: paymentForm.vendorInvoiceNumber,
      p_vendor_invoice_date: paymentForm.vendorInvoiceDate || null,
      p_voucher_number: paymentForm.voucherNumber,
      p_voucher_date: paymentForm.voucherDate || null,
      p_remarks: paymentForm.remarks,
    } : {
      p_section_id: selectedItem.id,
      p_amount: amount,
      p_payment_date: paymentForm.paymentDate,
      p_vendor_invoice_number: paymentForm.vendorInvoiceNumber,
      p_vendor_invoice_date: paymentForm.vendorInvoiceDate || null,
      p_voucher_number: paymentForm.voucherNumber,
      p_voucher_date: paymentForm.voucherDate || null,
      p_remarks: paymentForm.remarks,
      p_created_by: user?.name ?? null,
    };
    const result = await supabase.rpc(rpcName, payload);
    if (result.error) {
      const detail = result.error.message ?? '';
      setError(detail.includes('PAYMENT_EXCEEDS_SECTION_VALUE') ? 'This payment exceeds the approved value for this section.' : detail.includes('PAYMENT_EXCEEDS_APPROVED_VALUE') ? 'This payment exceeds the approved Work Order value.' : 'Could not save the payment update. Please try again.');
    } else {
      await log(selectedItem.id, editingPaymentId ? 'payment_updated' : 'payment_recorded', `${editingPaymentId ? 'Payment updated' : 'Payment recorded'}: ₹${amount.toFixed(2)}.`);
      setMessage(editingPaymentId ? 'Payment update saved.' : 'Payment recorded.');
      setEditingPaymentId(null);
      setPaymentForm(EMPTY_PAYMENT);
      await onReload();
    }
    setSaving(false);
  };

  const openTracker = (item: WOSection) => {
    openDetail(item);
    setEditorMode('track');
    setPanelTab('progress');
    setProgressValue('');
    setProgressUnit(item.unit ?? '');
    setProgressRemarks('');
    const latestDrawingProgress = drawingProgress.find((entry) => entry.section_id === item.id);
    setDrawingProgressValues({
      cat1: String(latestDrawingProgress?.cat1_completed ?? 0),
      cat2: String(latestDrawingProgress?.cat2_completed ?? 0),
      cat3: String(latestDrawingProgress?.cat3_completed ?? 0),
    });
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
    const { data: updated, error: saveError } = await supabase.from('wo_sections').update({
      approval_status: 'pending_approval',
      submitted_by: user?.name ?? null,
      submitted_at: new Date().toISOString(),
    }).eq('id', selectedItem.id).select().maybeSingle();
    if (saveError || !updated) setError('Could not submit this item for approval.');
    else {
      await log(selectedItem.id, 'submitted_for_approval', 'Item submitted for approval.');
      setMessage('Item submitted for approval.');
      setSelectedItem(updated as WOSection);
      await onReload();
    }
    setSaving(false);
  };

  const setApproval = async (approved: boolean) => {
    if (!selectedItem || !permissions.canApproveWOItems) return;
    setSaving(true);
    const { data: updated, error: saveError } = await supabase.from('wo_sections').update({
      approval_status: approved ? 'approved' : 'draft',
      approved_by: approved ? user?.name ?? null : null,
      approved_role: approved ? user?.role ?? null : null,
      approved_at: approved ? new Date().toISOString() : null,
      approval_remarks: approved ? 'Approved for site progress tracking.' : 'Returned for correction.',
    }).eq('id', selectedItem.id).select().maybeSingle();
    if (saveError || !updated) setError('Could not update the approval status.');
    else {
      await log(selectedItem.id, approved ? 'item_approved' : 'item_returned', approved ? 'Item definition approved and frozen.' : 'Item returned for correction.');
      setMessage(approved ? 'Item approved and frozen.' : 'Item returned to draft.');
      setSelectedItem(updated as WOSection);
      await onReload();
    }
    setSaving(false);
  };

  const saveProgress = async () => {
    if (!selectedItem || !permissions.canTrackWOProgress) {
      setError('You do not have permission to track progress.');
      return;
    }
    if (selectedItem.section_type !== 'drawing' && !progressValue.trim()) {
      setError('Enter a progress value before saving.');
      return;
    }
    if (selectedItem.approval_status !== 'approved') {
      setError('Progress can only be tracked after the item is approved.');
      return;
    }
    setSaving(true);
    let progressError = null;
    if (selectedItem.section_type === 'drawing') {
      const cat1 = Number(drawingProgressValues.cat1) || 0;
      const cat2 = Number(drawingProgressValues.cat2) || 0;
      const cat3 = Number(drawingProgressValues.cat3) || 0;
      const total = cat1 + cat2 + cat3;
      const planned = Number(selectedItem.required_qty) || 0;
      if ([cat1, cat2, cat3].some((value) => value < 0) || cat1 > selectedItem.cat1_total || cat2 > selectedItem.cat2_total || cat3 > selectedItem.cat3_total || total > planned) {
        setError('Completed drawing quantities cannot exceed the planned category or total quantities.');
        setSaving(false);
        return;
      }
      const result = await supabase.from('wo_drawing_progress').insert({
        work_order_id: workOrder.id,
        section_id: selectedItem.id,
        entry_date: new Date().toISOString().slice(0, 10),
        cat1_completed: cat1,
        cat2_completed: cat2,
        cat3_completed: cat3,
        total_completed: total,
        progress_pct: planned > 0 ? Math.min(100, (total / planned) * 100) : 0,
        remarks: progressRemarks.trim() || null,
        created_by: user?.name ?? null,
        created_role: user?.role ?? null,
      });
      progressError = result.error;
      if (!progressError) await log(selectedItem.id, 'progress_recorded', `Drawing progress recorded: ${total} completed.`);
    } else {
      const result = await supabase.from('wo_section_progress').insert({
        work_order_id: workOrder.id,
        section_id: selectedItem.id,
        progress_value: Number(progressValue) || 0,
        progress_unit: progressUnit.trim() || selectedItem.unit || null,
        remarks: progressRemarks.trim() || null,
        created_by: user?.name ?? null,
        created_role: user?.role ?? null,
      });
      progressError = result.error;
      if (!progressError) await log(selectedItem.id, 'progress_recorded', `Progress recorded: ${progressValue} ${progressUnit}.`);
    }
    if (progressError) setError('Could not save the progress update.');
    else {
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

      <div className={`grid gap-3 ${editorMode ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : 'grid-cols-1'}`}>
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
                    const drawingItemProgress = drawingProgress.filter((entry) => entry.section_id === row.id);
                    const totalProgress = activeType === 'drawing'
                      ? (drawingItemProgress[0]?.total_completed ?? 0)
                      : itemProgress.reduce((sum, entry) => sum + Number(entry.progress_value || 0), 0);
                    const itemDocuments = documents.filter((entry) => entry.section_id === row.id);
                    const completedDocs = itemDocuments.filter((entry) => entry.status === 'accepted').length;
                    const itemPayments = payments.filter((entry) => entry.section_id === row.id);
                    const paidValue = itemPayments.reduce((sum, entry) => sum + Number(entry.amount_paid || 0), 0);
                    const financialPct = Number(row.value) > 0 ? Math.min(100, (paidValue / Number(row.value)) * 100) : 0;
                    return <tr key={row.id} className="border-b border-slate-100 odd:bg-slate-50/60">
                      <td className="max-w-[260px] p-2"><div className="font-semibold text-slate-800">{row.item_code || row.description || 'Unnamed item'}</div><div className="text-[10px] text-slate-500">{row.description && row.item_code ? row.description : row.unit || 'No unit'}</div></td>
                      <td className="p-2 text-slate-600">{row.discipline || '-'}</td>
                      <td className="p-2 font-semibold text-slate-700">{activeType === 'manpower' ? `${row.skilled_count + row.unskilled_count} people` : activeType === 'quality' ? `${completedDocs}/${itemDocuments.length} docs` : `${row.required_qty} ${row.unit || ''}`}</td>
                      <td className="p-2"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.min(100, Number(row.required_qty) ? totalProgress / Number(row.required_qty) * 100 : 0)}%` }} /></div><span className="tabular-nums text-slate-600">{totalProgress} {row.unit || ''}</span></div></td>
                      <td className="p-2"><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyle(row.approval_status)}`}>{statusLabel(row.approval_status)}</span></td>
                      <td className="p-2"><div className="flex justify-end gap-1"><button onClick={() => openDetail(row)} className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold text-cyan-700 hover:bg-cyan-50">Details</button>{permissions.canTrackWOProgress && row.approval_status === 'approved' && <button onClick={() => openTracker(row)} className="rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700 hover:bg-cyan-100">Track</button>}{permissions.canLogPayments && <button onClick={() => openPaymentEditor(row)} className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"><CreditCard className="h-3 w-3" /> Payment</button>}</div><div className="mt-1 text-right text-[10px] text-emerald-700">₹{paidValue.toFixed(2)} · {financialPct.toFixed(1)}%</div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          {!rows.length && <div className="px-4 py-12 text-center text-xs text-slate-400">No items have been defined for this section yet.</div>}
        </section>

        {editorMode && <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"><div><div className="flex items-center gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{!selectedItem ? 'Create Item' : panelTab === 'activity' ? 'Activity Log' : panelTab === 'progress' ? 'Progress Update' : 'Item Detail'}</h3>{selectedItem && <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusStyle(selectedItem.approval_status)}`}>{statusLabel(selectedItem.approval_status)}</span>}</div><p className="mt-1 text-[11px] text-slate-500">{selectedItem?.item_code || selectedItem?.description || sectionTitle(itemForm.section_type)}</p></div><button onClick={() => setEditorMode(null)} className="rounded p-1 text-slate-400 hover:bg-slate-200"><X className="h-4 w-4" /></button></div>
          {selectedItem && <div className="flex border-b border-slate-200 px-2 pt-2" role="tablist" aria-label="Item workspace tabs">
            {(['details', 'activity', 'progress', 'payments'] as PanelTab[]).map((tab) => <button key={tab} onClick={() => setPanelTab(tab)} role="tab" aria-selected={panelTab === tab} className={`flex-1 rounded-t-lg px-2 py-2 text-[10px] font-bold capitalize transition-colors ${panelTab === tab ? 'border-b-2 border-cyan-700 bg-cyan-50 text-cyan-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>{tab === 'details' ? 'Item Details' : tab === 'activity' ? 'Activity Log' : tab === 'progress' ? 'Progress Update' : 'Payments'}</button>)}
          </div>}
          <div className="max-h-[72vh] overflow-y-auto p-4">
            {(!selectedItem || panelTab === 'details') && <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Item Code" value={itemForm.item_code} onChange={(value) => setItemForm({ ...itemForm, item_code: value })} />
                <Field label="Discipline" value={itemForm.discipline} onChange={(value) => setItemForm({ ...itemForm, discipline: value })} />
                <Field label="Description" value={itemForm.description} onChange={(value) => setItemForm({ ...itemForm, description: value })} full />
                <Field label="Unit" value={itemForm.unit} onChange={(value) => setItemForm({ ...itemForm, unit: value })} />
                <Field label="Planned Quantity" value={itemForm.required_qty} onChange={(value) => setItemForm({ ...itemForm, required_qty: value })} type="number" />
                <Field label="Planned Value" value={itemForm.value} onChange={(value) => setItemForm({ ...itemForm, value })} type="number" />
              </div>
              {itemForm.section_type === 'drawing' && <div className="mt-3 grid grid-cols-3 gap-2"><Field label="Total Category 1" value={itemForm.cat1_total} onChange={(value) => setItemForm({ ...itemForm, cat1_total: value })} type="number" readOnly={selectedItem?.approval_status === 'approved'} /><Field label="Total Category 2" value={itemForm.cat2_total} onChange={(value) => setItemForm({ ...itemForm, cat2_total: value })} type="number" readOnly={selectedItem?.approval_status === 'approved'} /><Field label="Total Category 3" value={itemForm.cat3_total} onChange={(value) => setItemForm({ ...itemForm, cat3_total: value })} type="number" readOnly={selectedItem?.approval_status === 'approved'} /></div>}
              {itemForm.section_type === 'manpower' && <div className="mt-3 grid grid-cols-2 gap-2"><Field label="Skilled" value={itemForm.skilled_count} onChange={(value) => setItemForm({ ...itemForm, skilled_count: value })} type="number" /><Field label="Unskilled" value={itemForm.unskilled_count} onChange={(value) => setItemForm({ ...itemForm, unskilled_count: value })} type="number" /></div>}
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={saveItem} disabled={saving || !permissions.canDefineWOItems || selectedItem?.approval_status === 'approved'} className="flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Item'}</button>{selectedItem && selectedItem.approval_status === 'draft' && permissions.canDefineWOItems && <button onClick={submitApproval} disabled={saving} className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800"><ClipboardCheck className="h-3.5 w-3.5" /> Submit Approval</button>}{selectedItem && selectedItem.approval_status === 'pending_approval' && permissions.canApproveWOItems && <><button onClick={() => setApproval(true)} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white"><Check className="h-3.5 w-3.5" /> Approve & Freeze</button><button onClick={() => setApproval(false)} disabled={saving} className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700"><RotateCcw className="h-3.5 w-3.5" /> Return</button></>}</div>
              {selectedItem?.approval_status === 'approved' && <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700"><LockKeyhole className="h-4 w-4" /> Definition frozen. Site progress can still be added.</div>}
              {selectedItem && itemForm.section_type === 'quality' && <div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><FileCheck2 className="h-4 w-4 text-cyan-600" /> Required documents</div>{permissions.canDefineWOItems && <div className="mb-3 flex gap-2"><input value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Document name" className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs" /><button onClick={createDocument} disabled={saving} className="rounded bg-cyan-700 px-2 py-1.5 text-[10px] font-bold text-white"><FilePlus2 className="h-3.5 w-3.5" /></button></div>}{selectedDocuments.map((document) => <div key={document.id} className="mb-2 rounded-lg border border-slate-200 p-2"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-semibold text-slate-700">{document.document_name}</div><div className="text-[10px] text-slate-500">{document.is_mandatory ? 'Mandatory' : 'Optional'} · {document.status.replace('_', ' ')}</div></div>{permissions.canUploadWODocuments && <label className="flex cursor-pointer items-center gap-1 rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700"><Upload className="h-3 w-3" /> Upload<input type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadDocument(document, file); }} /></label>}</div>{document.file_name && <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500"><FileText className="h-3 w-3" />{document.file_name}</div>}{document.status === 'submitted' && permissions.canApproveWOItems && <div className="mt-2 flex gap-2"><button onClick={() => reviewDocument(document, true)} className="flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white"><CheckCircle2 className="h-3 w-3" /> Accept</button><button onClick={() => reviewDocument(document, false)} className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"><RotateCcw className="h-3 w-3" /> Return</button></div>}</div>)}</div>}
            </>}

            {selectedItem && panelTab === 'activity' && <div className="space-y-4"><div className="rounded-lg border border-slate-200 p-3"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><History className="h-4 w-4 text-cyan-600" /> Activity history</div>{selectedActivity.length === 0 ? <p className="text-xs text-slate-400">No activity recorded yet.</p> : <div className="space-y-3">{selectedActivity.map((entry) => <div key={entry.id} className="border-l-2 border-cyan-200 pl-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase text-cyan-700">{entry.action.replace(/_/g, ' ')}</span><span className="text-[10px] text-slate-400">{formatDate(entry.created_at)}</span></div><div className="text-xs text-slate-600">{entry.details}</div><div className="text-[10px] text-slate-400">{entry.actor_name || 'Workspace user'} · {entry.actor_role || 'user'}</div></div>)}</div>}</div>{selectedItem.section_type === 'drawing' && <div className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-3"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-800"><History className="h-4 w-4" /> Drawing progress history</div>{selectedDrawingProgress.length === 0 ? <p className="text-xs text-slate-400">No drawing progress recorded yet.</p> : <div className="space-y-2">{selectedDrawingProgress.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-2"><div className="flex items-center justify-between gap-2 text-[10px] text-slate-400"><span className="font-bold text-slate-600">{entry.entry_date}</span><span>{entry.created_by || 'Workspace user'} · {entry.created_role || 'user'}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5"><div><div className="text-[9px] uppercase text-slate-400">Category 1</div><div className="font-bold text-slate-700">{entry.cat1_completed}</div></div><div><div className="text-[9px] uppercase text-slate-400">Category 2</div><div className="font-bold text-slate-700">{entry.cat2_completed}</div></div><div><div className="text-[9px] uppercase text-slate-400">Category 3</div><div className="font-bold text-slate-700">{entry.cat3_completed}</div></div><div><div className="text-[9px] uppercase text-slate-400">Total</div><div className="font-bold text-emerald-700">{entry.total_completed}</div></div><div><div className="text-[9px] uppercase text-slate-400">Progress</div><div className="font-bold text-cyan-700">{Number(entry.progress_pct).toFixed(1)}%</div></div></div>{entry.remarks && <div className="mt-2 border-t border-slate-200 pt-2 text-[10px] text-slate-500">{entry.remarks}</div>}</div>)}</div>}</div>}</div>}

            {selectedItem && panelTab === 'payments' && <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-bold text-emerald-800"><CreditCard className="h-4 w-4" /> Section financial progress</div><p className="mt-1 text-[10px] text-emerald-700">Payments recorded against this approved section.</p></div><span className="text-sm font-bold text-emerald-800">{Number(selectedItem.value) > 0 ? (selectedPayments.reduce((sum, entry) => sum + Number(entry.amount_paid || 0), 0) / Number(selectedItem.value) * 100).toFixed(1) : '0.0'}%</span></div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]"><div className="rounded bg-white p-2"><div className="text-slate-500">Approved</div><div className="mt-1 font-bold text-slate-700">₹{Number(selectedItem.value || 0).toFixed(2)}</div></div><div className="rounded bg-white p-2"><div className="text-slate-500">Paid</div><div className="mt-1 font-bold text-emerald-700">₹{selectedPayments.reduce((sum, entry) => sum + Number(entry.amount_paid || 0), 0).toFixed(2)}</div></div><div className="rounded bg-white p-2"><div className="text-slate-500">Balance</div><div className="mt-1 font-bold text-cyan-700">₹{Math.max(0, Number(selectedItem.value || 0) - selectedPayments.reduce((sum, entry) => sum + Number(entry.amount_paid || 0), 0)).toFixed(2)}</div></div></div>
              </div>
              {permissions.canLogPayments && <div className="rounded-lg border border-slate-200 p-3"><div className="mb-3 flex items-center justify-between"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{editingPaymentId ? 'Edit payment update' : 'Add payment update'}</div>{editingPaymentId && <button onClick={() => { setEditingPaymentId(null); setPaymentForm(EMPTY_PAYMENT); }} className="text-[10px] font-semibold text-slate-500 hover:text-slate-800">Cancel edit</button>}</div><div className="grid grid-cols-2 gap-2"><Field label="Amount Paid" value={paymentForm.amount} onChange={(value) => setPaymentForm({ ...paymentForm, amount: value })} type="number" /><Field label="Payment Date" value={paymentForm.paymentDate} onChange={(value) => setPaymentForm({ ...paymentForm, paymentDate: value })} type="date" /><Field label="Vendor Invoice Number" value={paymentForm.vendorInvoiceNumber} onChange={(value) => setPaymentForm({ ...paymentForm, vendorInvoiceNumber: value })} /><Field label="Vendor Invoice Date" value={paymentForm.vendorInvoiceDate} onChange={(value) => setPaymentForm({ ...paymentForm, vendorInvoiceDate: value })} type="date" /><Field label="Voucher Number" value={paymentForm.voucherNumber} onChange={(value) => setPaymentForm({ ...paymentForm, voucherNumber: value })} /><Field label="Voucher Date" value={paymentForm.voucherDate} onChange={(value) => setPaymentForm({ ...paymentForm, voucherDate: value })} type="date" /></div><label className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Remarks<textarea value={paymentForm.remarks} onChange={(event) => setPaymentForm({ ...paymentForm, remarks: event.target.value })} rows={2} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs font-normal normal-case text-slate-700" /></label><button onClick={savePayment} disabled={saving} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? 'Saving...' : editingPaymentId ? 'Save Payment Changes' : 'Save Payment Update'}</button></div>}
              <div className="rounded-lg border border-slate-200 p-3"><div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment history</div>{selectedPayments.length === 0 ? <p className="text-xs text-slate-400">No payments recorded for this section yet.</p> : <div className="space-y-2">{selectedPayments.map((payment) => <div key={payment.id} className="rounded border border-slate-200 bg-slate-50 p-2"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-bold text-emerald-700">₹{Number(payment.amount_paid).toFixed(2)} <span className="font-normal text-slate-500">· {payment.payment_date}</span></div><div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-600"><span>Invoice: {payment.vendor_invoice_number || '-'}</span><span>Invoice date: {payment.vendor_invoice_date || '-'}</span><span>Voucher: {payment.voucher_number || '-'}</span><span>Voucher date: {payment.voucher_date || '-'}</span></div>{payment.remarks && <div className="mt-1 text-[10px] text-slate-500">{payment.remarks}</div>}</div>{permissions.canLogPayments && <button onClick={() => editPayment(payment)} className="inline-flex shrink-0 items-center gap-1 rounded border border-cyan-200 bg-white px-2 py-1 text-[10px] font-bold text-cyan-700 hover:bg-cyan-50"><Edit3 className="h-3 w-3" /> Edit</button>}</div><div className="mt-2 text-[10px] text-slate-400">Recorded by {payment.created_by || 'Workspace user'} · Cumulative section paid ₹{Number(payment.cumulative_paid).toFixed(2)}</div></div>)}</div>}</div>
            </div>}

            {selectedItem && panelTab === 'progress' && <>
              {selectedItem.approval_status !== 'approved' && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Progress tracking is only available after this item is approved. Submit the item for approval first, then return here to log site progress.</div>}
              {selectedItem.approval_status === 'approved' && <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-cyan-800"><Clock3 className="h-4 w-4" /> Add site progress</div>{selectedItem.section_type === 'drawing' ? <><div className="mb-3 grid grid-cols-3 gap-2"><Field label="Total Category 1" value={String(selectedItem.cat1_total)} onChange={() => undefined} readOnly /><Field label="Total Category 2" value={String(selectedItem.cat2_total)} onChange={() => undefined} readOnly /><Field label="Total Category 3" value={String(selectedItem.cat3_total)} onChange={() => undefined} readOnly /></div><div className="grid grid-cols-3 gap-2"><Field label="Completed Category 1" value={drawingProgressValues.cat1} onChange={(value) => setDrawingProgressValues({ ...drawingProgressValues, cat1: value })} type="number" /><Field label="Completed Category 2" value={drawingProgressValues.cat2} onChange={(value) => setDrawingProgressValues({ ...drawingProgressValues, cat2: value })} type="number" /><Field label="Completed Category 3" value={drawingProgressValues.cat3} onChange={(value) => setDrawingProgressValues({ ...drawingProgressValues, cat3: value })} type="number" /></div><div className="mt-3 rounded border border-white bg-white px-3 py-2 text-xs text-slate-600">Current total: <b className="text-emerald-700">{Number(drawingProgressValues.cat1 || 0) + Number(drawingProgressValues.cat2 || 0) + Number(drawingProgressValues.cat3 || 0)}</b> / {selectedItem.required_qty}</div></> : <div className="grid grid-cols-2 gap-2"><Field label="Progress Value" value={progressValue} onChange={setProgressValue} type="number" /><Field label="Unit" value={progressUnit} onChange={setProgressUnit} /></div>}<label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Remarks<textarea value={progressRemarks} onChange={(event) => setProgressRemarks(event.target.value)} rows={3} className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" /></label><button onClick={saveProgress} disabled={saving} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> Save Progress</button></div>}
              <div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Progress updates</div>{selectedProgress.length === 0 ? <p className="text-xs text-slate-400">No progress updates recorded yet.</p> : <div className="space-y-2">{selectedProgress.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-3 rounded bg-slate-50 p-2 text-xs"><div><div className="font-semibold text-slate-700">{entry.progress_value} {entry.progress_unit || ''}</div><div className="text-[10px] text-slate-500">{entry.remarks || 'Progress recorded'}</div></div><div className="text-right text-[10px] text-slate-400">{entry.entry_date}<br />{entry.created_by || 'Site Engineer'}</div></div>)}</div>}</div>
            </>}
          </div>
        </aside>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', full = false, readOnly = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; full?: boolean; readOnly?: boolean }) {
  return <label className={`block text-[10px] font-bold uppercase tracking-wide text-slate-500 ${full ? 'col-span-2' : ''}`}>{label}<input type={type} value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} className={`mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs font-normal normal-case text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-100 ${readOnly ? 'bg-slate-100 text-slate-500' : ''}`} /></label>;
}
