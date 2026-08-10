import { useMemo, useState, useRef, useCallback } from 'react';
import {
  X, Building2, ClipboardList, AlertTriangle, CreditCard, Plus, Save, ChevronDown,
  Clock, Ruler, Truck, FileText, TrendingUp, Bold, Italic, Underline, Loader2, User, CalendarClock,
} from 'lucide-react';
import type { Project, WorkOrder, WorkOrderDetail, WOSection, PaymentEntry, TrackingUpdate, TrackingType } from '@/types';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { delayStatusColor, delayStatusShort, DELAY_STATUSES } from '@/lib/format';

interface WorkOrderModalProps {
  project: Project;
  workOrders: WorkOrder[];
  details: WorkOrderDetail[];
  sections: WOSection[];
  payments: PaymentEntry[];
  trackingUpdates: TrackingUpdate[];
  onClose: () => void;
  onReload: () => Promise<void>;
  onSaveTrackingUpdate: (entry: {
    project_id: string;
    tracking_type: TrackingType;
    deviation_value: string;
    officer_name: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

type Tab = 'header' | 'sections' | 'exceptions';

const EXCEPTION_TABS: { key: TrackingType; label: string; icon: typeof Clock; color: string }[] = [
  { key: 'delay', label: 'Extension / Delay', icon: Clock, color: 'text-rose-600' },
  { key: 'quantity', label: 'Quantity', icon: Ruler, color: 'text-orange-600' },
  { key: 'delivery', label: 'Schedule Deviation', icon: Truck, color: 'text-amber-600' },
  { key: 'spec', label: 'Specification', icon: FileText, color: 'text-cyan-600' },
  { key: 'price', label: 'Price Escalation', icon: TrendingUp, color: 'text-emerald-600' },
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkOrderModal({
  project,
  workOrders = [],
  details = [],
  sections = [],
  payments = [],
  trackingUpdates = [],
  onClose,
  onReload,
  onSaveTrackingUpdate,
}: WorkOrderModalProps) {
  const { user, permissions } = useAuth();
  const projectWOs = workOrders.filter((wo) => wo.project_id === project.id);
  const [selectedId, setSelectedId] = useState(projectWOs[0]?.id ?? '');
  const selectedWO = projectWOs.find((wo) => wo.id === selectedId) ?? projectWOs[0];
  const [tab, setTab] = useState<Tab>('header');
  const [exceptionTab, setExceptionTab] = useState<TrackingType>('delay');
  const [agencyName, setAgencyName] = useState(details.find((d) => d.work_order_id === selectedWO?.id)?.agency_name ?? '');
  const [agencyType, setAgencyType] = useState(details.find((d) => d.work_order_id === selectedWO?.id)?.agency_type ?? '');
  const [scope, setScope] = useState(details.find((d) => d.work_order_id === selectedWO?.id)?.scope ?? '');
  const [woValue, setWoValue] = useState(String(details.find((d) => d.work_order_id === selectedWO?.id)?.wo_value ?? selectedWO?.project_value ?? 0));
  const [nodalOfficer, setNodalOfficer] = useState(details.find((d) => d.work_order_id === selectedWO?.id)?.nodal_officer ?? '');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [error, setError] = useState('');
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [revisedValue, setRevisedValue] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  // Exception form state
  const [delayStatus, setDelayStatus] = useState<string>(project.delay_status);
  const [deviationPct, setDeviationPct] = useState<number>(0);
  const [officerName, setOfficerName] = useState<string>('');
  const [savingException, setSavingException] = useState(false);
  const [exceptionError, setExceptionError] = useState<string | null>(null);
  const [exceptionSuccess, setExceptionSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const woDetail = details.find((d) => d.work_order_id === selectedWO?.id);
  const woSections = sections.filter((s) => s.work_order_id === selectedWO?.id);
  const woPayments = payments.filter((p) => p.work_order_id === selectedWO?.id);
  const currentPaid = woPayments.length ? Math.max(...woPayments.map((p) => p.cumulative_paid)) : selectedWO?.paid_amount ?? 0;
  const approvedValue = Number(woDetail?.wo_value ?? selectedWO?.project_value ?? 0);
  const exceptions = useMemo(() => trackingUpdates.filter((u) => u.project_id === project.id), [trackingUpdates, project.id]);
  const tabExceptions = useMemo(() => exceptions.filter((e) => e.tracking_type === exceptionTab), [exceptions, exceptionTab]);
  const tabMeta = EXCEPTION_TABS.find((t) => t.key === exceptionTab);

  const resetEditor = useCallback(() => {
    if (editorRef.current) editorRef.current.innerHTML = '';
  }, []);

  const handleExceptionTabChange = (type: TrackingType) => {
    setExceptionTab(type);
    setExceptionError(null);
    resetEditor();
  };

  const execCommand = (cmd: string) => {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
  };

  const handleSaveException = async () => {
    if (!officerName.trim()) {
      setExceptionError('Officer name is required.');
      return;
    }
    const remarksHtml = editorRef.current?.innerHTML.trim() ?? '';
    if (!remarksHtml || remarksHtml === '<br>' || remarksHtml === '<div><br></div>') {
      setExceptionError('Please enter remarks explaining this exception.');
      return;
    }

    setSavingException(true);
    setExceptionError(null);

    const dv = exceptionTab === 'delay' ? delayStatus : `${deviationPct}%`;

    const result = await onSaveTrackingUpdate({
      project_id: project.id,
      tracking_type: exceptionTab,
      deviation_value: dv,
      officer_name: officerName.trim(),
      remarks: remarksHtml,
    });

    setSavingException(false);

    if (result.success) {
      resetEditor();
      setExceptionSuccess(true);
      setTimeout(() => setExceptionSuccess(false), 2500);
    } else {
      setExceptionError(result.error ?? 'Could not save the exception update.');
    }
  };

  const saveHeader = async () => {
    if (!selectedWO) return;
    setError('');
    const payload = {
      work_order_id: selectedWO.id,
      agency_name: agencyName,
      agency_type: agencyType,
      scope,
      wo_value: Number(woValue) || 0,
      nodal_officer: nodalOfficer,
      start_date: selectedWO.start_date,
      end_date: selectedWO.end_date,
      status: 'draft' as const,
    };
    const { error: saveError } = woDetail
      ? await supabase.from('work_order_details').update(payload).eq('id', woDetail.id)
      : await supabase.from('work_order_details').insert(payload);
    if (saveError) setError('Could not save the work order header.');
    else await onReload();
  };

  const addPayment = async () => {
    if (!selectedWO) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setError('Enter a payment amount greater than zero.');
      return;
    }
    const cumulative = currentPaid + amount;
    if (cumulative > approvedValue) {
      setError(`Payment exceeds the approved WO value by ₹${(cumulative - approvedValue).toFixed(2)}.`);
      setEscalationOpen(true);
      return;
    }
    const { error: paymentError } = await supabase.from('payment_entries').insert({
      work_order_id: selectedWO.id,
      amount_paid: amount,
      cumulative_paid: cumulative,
      payment_date: new Date().toISOString().slice(0, 10),
      remarks: paymentRemarks || null,
      created_by: user?.name ?? null,
    });
    if (paymentError) {
      setError('Could not save the payment entry.');
    } else {
      await supabase.from('work_orders').update({ paid_amount: cumulative }).eq('id', selectedWO.id);
      await supabase.from('projects').update({ paid_amount: project.paid_amount + amount }).eq('id', project.id);
      setPaymentAmount('');
      setPaymentRemarks('');
      await onReload();
    }
  };

  const requestEscalation = async () => {
    if (!selectedWO || !revisedValue || Number(revisedValue) <= approvedValue) {
      setError('Revised WO value must be greater than the approved value.');
      return;
    }
    const { error: escalationError } = await supabase.from('amendments').insert({
      work_order_id: selectedWO.id,
      amendment_type: 'wo_value_escalation',
      reason: approvalNote || 'WO value increase requested',
      requested_by: user?.name ?? 'Nodal Officer',
      revised_value: Number(revisedValue),
      approval_doc_name: 'Approval document pending upload',
      noting_entries: approvalNote,
      approval_status: permissions.canApproveEscalation ? 'approved' : 'pending',
      approved_by: permissions.canApproveEscalation ? user?.name : null,
      approved_at: permissions.canApproveEscalation ? new Date().toISOString() : null,
    });
    if (escalationError) {
      setError('Could not record the escalation request.');
    } else {
      if (permissions.canApproveEscalation) {
        await supabase.from('work_order_details').upsert({
          work_order_id: selectedWO.id,
          agency_name: woDetail?.agency_name ?? agencyName,
          agency_type: woDetail?.agency_type ?? agencyType,
          scope: woDetail?.scope ?? scope,
          wo_value: Number(revisedValue),
          nodal_officer: woDetail?.nodal_officer ?? nodalOfficer,
          status: 'draft',
        });
      }
      setEscalationOpen(false);
      setError('WO value escalation request recorded in the audit trail.');
      await onReload();
    }
  };

  const tabButton = (key: Tab, icon: typeof Building2, label: string) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
        tab === key ? 'bg-cyan-700 text-white shadow' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon && <icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/15 px-2 py-1 font-mono text-[10px] font-bold text-cyan-300">
                {project.seq_no} → {selectedWO?.seq_no ?? '1.1.0'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Agency / Work Order</span>
            </div>
            <h2 className="mt-1 truncate text-base font-bold text-white">{project.title}</h2>
            <p className="text-[11px] text-slate-400">Project parent · {project.state} · {project.district}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              const d = details.find((detail) => detail.work_order_id === e.target.value);
              setAgencyName(d?.agency_name ?? '');
              setAgencyType(d?.agency_type ?? '');
              setScope(d?.scope ?? '');
              setWoValue(String(d?.wo_value ?? 0));
              setNodalOfficer(d?.nodal_officer ?? '');
            }}
            className="mr-auto rounded border border-slate-300 px-2 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="">No work orders seeded</option>
            {projectWOs.map((wo) => (
              <option key={wo.id} value={wo.id}>{wo.seq_no} · {wo.title}</option>
            ))}
          </select>
          {tabButton('header', Building2, 'WO Header')}
          {tabButton('sections', ClipboardList, 'WO Sections')}
          {tabButton('exceptions', AlertTriangle, 'WO Exceptions')}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error}
            </div>
          )}

          {!selectedWO ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No work orders are linked to this project yet.
            </div>
          ) : tab === 'header' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border-t-2 border-cyan-600 bg-white p-4 shadow-sm md:col-span-2">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Work Order Header · {selectedWO.seq_no}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Agency Name
                    <input
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      disabled={!permissions.canManageWorkOrders}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Agency Type
                    <input
                      value={agencyType}
                      onChange={(e) => setAgencyType(e.target.value)}
                      disabled={!permissions.canManageWorkOrders}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">
                    Scope
                    <textarea
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      disabled={!permissions.canManageWorkOrders}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                      rows={2}
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Approved Value
                    <input
                      type="number"
                      value={woValue}
                      onChange={(e) => setWoValue(e.target.value)}
                      disabled={!permissions.canManageWorkOrders}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Assigned Nodal Officer
                    <input
                      value={nodalOfficer}
                      onChange={(e) => setNodalOfficer(e.target.value)}
                      disabled={!permissions.canManageWorkOrders}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </label>
                </div>
                {permissions.canManageWorkOrders && (
                  <button
                    onClick={saveHeader}
                    className="mt-4 flex items-center gap-1.5 rounded bg-cyan-700 px-3 py-2 text-xs font-bold text-white"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save WO Header
                  </button>
                )}
              </div>
            </div>
          ) : tab === 'sections' ? (
            <div className="space-y-3">
              {['drawing', 'equipment', 'civil', 'manpower', 'quality'].map((type) => {
                const rows = woSections.filter((s) => s.section_type === type);
                return (
                  <details key={type} open className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <ChevronDown className="h-4 w-4 text-cyan-600" />
                      {type === 'drawing'
                        ? 'Drawing Status · Cat 1 / Cat 2 / Cat 3'
                        : type === 'equipment'
                          ? 'Equipment Procurement'
                          : type === 'civil'
                            ? 'Civil & Structural Items'
                            : type === 'manpower'
                              ? 'Manpower Deployment'
                              : 'Quality / Compliance Documents'}
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{rows.length}</span>
                    </summary>
                    <div className="overflow-x-auto border-t border-slate-100 p-3">
                      {rows.length ? (
                        <table className="w-full text-xs">
                          <thead className="bg-slate-900 text-left text-white">
                            <tr>
                              <th className="p-2">Description</th>
                              <th className="p-2">Discipline</th>
                              <th className="p-2">Qty / Cat 1</th>
                              <th className="p-2">Cat 2 / Skilled</th>
                              <th className="p-2">Cat 3 / Unskilled</th>
                              <th className="p-2">Value / Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={row.id} className="border-b border-slate-100 odd:bg-slate-50">
                                <td className="p-2">{row.description ?? row.item_code ?? '-'}</td>
                                <td className="p-2">{row.discipline ?? '-'}</td>
                                <td className="p-2">{row.required_qty || row.cat1_total}</td>
                                <td className="p-2">{row.executed_qty || row.cat2_total || row.skilled_count}</td>
                                <td className="p-2">{row.cat3_total || row.unskilled_count}</td>
                                <td className="p-2">{type === 'quality' ? (row.has_certificate ? 'Certificate uploaded' : 'Pending') : row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">No {type} rows recorded yet.</p>
                      )}
                    </div>
                  </details>
                );
              })}

              {/* Payment entries */}
              <div className="rounded-xl border-t-2 border-emerald-600 bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Payment Entries
                </h3>
                <div className="mb-3 flex flex-wrap gap-3 text-xs">
                  <span>Approved: <b>₹{approvedValue.toFixed(2)}</b></span>
                  <span>Previous Total Paid: <b className="text-emerald-700">₹{currentPaid.toFixed(2)}</b></span>
                  <span>Balance: <b className="text-rose-600">₹{Math.max(0, approvedValue - currentPaid).toFixed(2)}</b></span>
                </div>
                {permissions.canLogPayments && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount paid"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="rounded border border-slate-300 p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={paymentRemarks}
                      onChange={(e) => setPaymentRemarks(e.target.value)}
                      className="rounded border border-slate-300 p-2 text-xs sm:col-span-2"
                    />
                    <button
                      onClick={addPayment}
                      className="flex items-center justify-center gap-1 rounded bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Payment
                    </button>
                  </div>
                )}
                {woPayments.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {woPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between rounded bg-slate-50 p-2 text-xs">
                        <span>{payment.payment_date} · {payment.remarks || 'Payment entry'}</span>
                        <b>₹{payment.amount_paid.toFixed(2)} · Total ₹{payment.cumulative_paid.toFixed(2)}</b>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* Exception sub-tabs */}
              <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2">
                {EXCEPTION_TABS.map((et) => {
                  const Icon = et.icon;
                  const isActive = exceptionTab === et.key;
                  return (
                    <button
                      key={et.key}
                      onClick={() => handleExceptionTabChange(et.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? et.color : 'text-slate-400'}`} />
                      {et.label}
                      {tabExceptions.length > 0 && et.key === exceptionTab && (
                        <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                          {tabExceptions.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                {/* Left: input form */}
                <div className="p-4 lg:border-r lg:border-slate-200">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                    New Exception Entry
                  </h3>

                  {exceptionSuccess && (
                    <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                      <Save className="w-4 h-4 shrink-0" />
                      Exception saved successfully.
                    </div>
                  )}
                  {exceptionError && (
                    <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {exceptionError}
                    </div>
                  )}

                  {/* Deviation field */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      {exceptionTab === 'delay' ? 'Delay Status' : 'Deviation Level'}
                    </label>
                    {exceptionTab === 'delay' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {DELAY_STATUSES.map((ds) => {
                          const dc = delayStatusColor(ds);
                          const selected = delayStatus === ds;
                          return (
                            <button
                              key={ds}
                              onClick={() => setDelayStatus(ds)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                                selected
                                  ? `${dc.bg} ${dc.text} ${dc.border} ring-2 ring-offset-1 ring-cyan-200`
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${dc.dot}`} />
                              {delayStatusShort(ds)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Deviation</span>
                          <span className="font-bold text-cyan-700 text-sm tabular-nums">{deviationPct}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={deviationPct}
                          onChange={(e) => setDeviationPct(parseInt(e.target.value, 10))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-cyan-600"
                          style={{
                            background: `linear-gradient(to right, #0891b2 ${deviationPct}%, #e2e8f0 ${deviationPct}%)`,
                          }}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Officer name */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      Officer Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Rich-text remarks */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      Remarks / Reason
                    </label>
                    <div className="rounded-lg border border-slate-300 overflow-hidden focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-200 transition-colors">
                      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1">
                        <button type="button" onClick={() => execCommand('bold')} className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 transition-colors" title="Bold">
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => execCommand('italic')} className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 transition-colors" title="Italic">
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => execCommand('underline')} className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 transition-colors" title="Underline">
                          <Underline className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="min-h-[100px] max-h-[200px] overflow-y-auto px-3 py-2 text-xs text-slate-700 outline-none prose-sm"
                        data-placeholder="Enter detailed remarks about this exception..."
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSaveException}
                    disabled={savingException}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-700 rounded-lg hover:bg-cyan-800 transition-colors disabled:opacity-60 w-full justify-center"
                  >
                    {savingException ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-3.5 h-3.5" /> Save Exception</>
                    )}
                  </button>
                </div>

                {/* Right: history */}
                <div className="p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Exception History
                    </h3>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {tabExceptions.length} {tabExceptions.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  {tabExceptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Clock className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">
                        No {tabMeta?.label.toLowerCase()} exceptions recorded yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tabExceptions.map((entry) => {
                        const Icon = tabMeta?.icon ?? Clock;
                        return (
                          <div key={entry.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Icon className={`w-3.5 h-3.5 ${tabMeta?.color ?? 'text-slate-400'}`} />
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                  {entry.deviation_value}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <CalendarClock className="w-3 h-3" />
                                {formatTimestamp(entry.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2">
                              <User className="w-3 h-3" />
                              <span className="font-medium text-slate-600">{entry.officer_name || 'Unknown'}</span>
                            </div>
                            <div
                              className="text-xs text-slate-700 prose-sm max-w-none [&_b]:font-bold [&_i]:italic [&_u]:underline"
                              dangerouslySetInnerHTML={{ __html: entry.remarks }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Escalation modal */}
        {escalationOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">Request WO Value Increase</h3>
              <p className="mt-1 text-xs text-slate-500">
                Record the revised value and approval noting before payment can exceed the current limit.
              </p>
              <input
                type="number"
                value={revisedValue}
                onChange={(e) => setRevisedValue(e.target.value)}
                placeholder="Revised WO value"
                className="mt-3 w-full rounded border border-slate-300 p-2 text-xs"
              />
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Approval noting / document reference"
                rows={3}
                className="mt-2 w-full rounded border border-slate-300 p-2 text-xs"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setEscalationOpen(false)}
                  className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={requestEscalation}
                  className="rounded bg-cyan-700 px-3 py-2 text-xs font-bold text-white"
                >
                  Record Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
