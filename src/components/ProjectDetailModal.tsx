import { useEffect, useMemo, useState } from 'react';
import {
  X, FileText, FileCheck, MapPin, Calendar, AlertTriangle, Ruler, CalendarClock,
  ChevronDown, ChevronRight, ChevronLeft, Clock, Truck, TrendingUp, User, Save, LockKeyhole,
  Loader2, Plus, Building2, LayoutGrid, Table2, CreditCard, BarChart3,
  PieChart as PieChartIcon, SlidersHorizontal, RotateCcw, CheckCircle2, Check, Filter,
} from 'lucide-react';
import type {
  Project, ProjectFormData, ProjectStatus, WorkOrder, WorkOrderDetail,
  WOSection, PaymentEntry, TrackingUpdate, TrackingType, DelayStatus, WOSectionProgress, WOSectionDocument, WOSectionActivity, WODrawingProgress,
} from '@/types';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  calculateAllocationPct, formatINR, formatINRShort, formatDateShort, delayStatusColor, delayStatusShort,
  DELAY_STATUSES, STATES, DISTRICTS, CATEGORIES, SUBCATEGORIES,
} from '@/lib/format';
import { StatusBar } from '@/components/StatusBar';
import { WOChartView } from '@/components/WOChartView';
import { aggregateDrawingStatus } from '@/lib/drawingStatus';
import {
  BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = ['#0891b2', '#1e40af', '#059669', '#d97706', '#dc2626', '#475569'];

type Tab = 'charts' | 'header' | 'agency';

interface WOFilters {
  agencyNames: string[];
  delayStatuses: DelayStatus[];
  completionStatus: string[];
  minValue: string;
  maxValue: string;
}
const DEFAULT_WO_FILTERS: WOFilters = { agencyNames: [], delayStatuses: [], completionStatus: [], minValue: '', maxValue: '' };
type WOViewType = 'chart' | 'tile' | 'table' | 'card';

interface SharedWOState {
  projectWOs: WorkOrder[];
  filteredWOs: WorkOrder[];
  statusFilter: string | null;
  setStatusFilter: (f: string | null) => void;
  woFilters: WOFilters;
  setWoFilters: (f: WOFilters) => void;
  appliedWOFilters: WOFilters;
  setAppliedWOFilters: (f: WOFilters) => void;
  agencyNameOptions: string[];
  isWOFiltered: boolean;
  handleClearAllWOFilters: () => void;
  handleToggleDelayStatus: (s: DelayStatus) => void;
  handleToggleAgencyName: (n: string) => void;
  chartChips: { label: string; onRemove: () => void }[];
}

interface ProjectDetailModalProps {
  project: Project;
  workOrders: WorkOrder[];
  details: WorkOrderDetail[];
  sections: WOSection[];
  payments: PaymentEntry[];
  trackingUpdates: TrackingUpdate[];
  woSectionProgress: WOSectionProgress[];
  woSectionDocuments: WOSectionDocument[];
  woSectionActivity: WOSectionActivity[];
  woDrawingProgress: WODrawingProgress[];
  mode?: 'view' | 'maintain';
  onClose: () => void;
  onReload: () => Promise<void>;
  onSaveProject: (id: string | null, formData: ProjectFormData, status: ProjectStatus) => Promise<{ success: boolean; error?: string }>;
  onSaveTrackingUpdate: (entry: {
    project_id: string;
    tracking_type: TrackingType;
    deviation_value: string;
    officer_name: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;
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

const DEVIATION_TABS: { key: TrackingType; label: string; icon: typeof Clock; color: string }[] = [
  { key: 'spec', label: 'Spec Deviations', icon: FileText, color: 'text-cyan-600' },
  { key: 'quantity', label: 'Qty Deviations', icon: Ruler, color: 'text-orange-600' },
  { key: 'price', label: 'Price Escalations', icon: TrendingUp, color: 'text-emerald-600' },
  { key: 'delay', label: 'Delay / Extension', icon: Clock, color: 'text-rose-600' },
  { key: 'delivery', label: 'Schedule Deviations', icon: Truck, color: 'text-amber-600' },
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MetaRow({ label, value, valueClass = 'text-slate-800' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className="w-3.5 h-3.5 text-cyan-600" />
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{children}</h4>
    </div>
  );
}

function UpdateCard({ u, icon: Icon, color }: { u: TrackingUpdate; icon: typeof Clock; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">{u.deviation_value}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <CalendarClock className="w-3 h-3" />
          {formatTimestamp(u.created_at)}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2">
        <User className="w-3 h-3" />
        <span className="font-medium text-slate-600">{u.officer_name || 'Unknown'}</span>
      </div>
      <div className="text-xs text-slate-700 prose-sm max-w-none [&_b]:font-bold [&_i]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: u.remarks }} />
    </div>
  );
}

export function ProjectDetailModal({
  project, workOrders, details, sections, payments, trackingUpdates, woSectionProgress, woSectionDocuments, woSectionActivity, woDrawingProgress,
  mode = 'view', onClose, onReload, onSaveProject, onSaveTrackingUpdate,
}: ProjectDetailModalProps) {
  const { user, permissions } = useAuth();
  const [tab, setTab] = useState<Tab>('charts');

  const canEdit = permissions.canEditProject;
  const isFinalized = project.status === 'finalized';
  const isMaintainMode = mode === 'maintain';
  const canMaintain = isMaintainMode && canEdit && !isFinalized;

  // Shared WO filter state (used by both Charts tab and Agency tab)
  const projectWOs = useMemo(() => workOrders.filter((w) => w.project_id === project.id), [workOrders, project.id]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [woFilters, setWoFilters] = useState<WOFilters>(DEFAULT_WO_FILTERS);
  const [appliedWOFilters, setAppliedWOFilters] = useState<WOFilters>(DEFAULT_WO_FILTERS);

  const agencyNameOptions = useMemo(() => {
    const names = projectWOs.map((wo) => details.find((d) => d.work_order_id === wo.id)?.agency_name).filter(Boolean) as string[];
    return Array.from(new Set(names)).sort();
  }, [projectWOs, details]);

  const filteredWOs = useMemo(() => {
    let result = projectWOs;
    if (statusFilter) {
      if (statusFilter === 'completed') result = result.filter((w) => w.completed_pct >= 100);
      else if (statusFilter === 'active' || statusFilter === 'inprogress') result = result.filter((w) => w.completed_pct > 0 && w.completed_pct < 100);
      else if (statusFilter === 'delayed') result = result.filter((w) => w.delay_status !== 'On Time');
      else if (DELAY_STATUSES.includes(statusFilter as DelayStatus)) result = result.filter((w) => w.delay_status === statusFilter);
    }
    const f = appliedWOFilters;
    if (f.agencyNames.length > 0) {
      result = result.filter((w) => f.agencyNames.includes(details.find((d) => d.work_order_id === w.id)?.agency_name ?? '-'));
    }
    if (f.delayStatuses.length > 0) {
      result = result.filter((w) => f.delayStatuses.includes(w.delay_status));
    }
    if (f.completionStatus.length > 0) {
      result = result.filter((w) => {
        const cs = w.completed_pct >= 100 ? 'completed' : w.completed_pct > 0 ? 'inprogress' : 'notstarted';
        return f.completionStatus.includes(cs);
      });
    }
    if (f.minValue) {
      const min = parseFloat(f.minValue);
      if (!isNaN(min)) result = result.filter((w) => {
        const v = Number(details.find((d) => d.work_order_id === w.id)?.wo_value ?? w.project_value) || 0;
        return v >= min;
      });
    }
    if (f.maxValue) {
      const max = parseFloat(f.maxValue);
      if (!isNaN(max)) result = result.filter((w) => {
        const v = Number(details.find((d) => d.work_order_id === w.id)?.wo_value ?? w.project_value) || 0;
        return v <= max;
      });
    }
    return result;
  }, [projectWOs, statusFilter, appliedWOFilters, details]);

  const isWOFiltered =
    appliedWOFilters.agencyNames.length > 0 ||
    appliedWOFilters.delayStatuses.length > 0 ||
    appliedWOFilters.completionStatus.length > 0 ||
    Boolean(appliedWOFilters.minValue) ||
    Boolean(appliedWOFilters.maxValue);

  const handleClearAllWOFilters = () => {
    setWoFilters(DEFAULT_WO_FILTERS);
    setAppliedWOFilters(DEFAULT_WO_FILTERS);
    setStatusFilter(null);
  };

  const handleToggleDelayStatus = (status: DelayStatus) => {
    const toggle = (arr: DelayStatus[]) => arr.includes(status) ? arr.filter((s) => s !== status) : [...arr, status];
    setWoFilters((prev) => ({ ...prev, delayStatuses: toggle(prev.delayStatuses) }));
    setAppliedWOFilters((prev) => ({ ...prev, delayStatuses: toggle(prev.delayStatuses) }));
  };

  const handleToggleAgencyName = (name: string) => {
    const toggle = (arr: string[]) => arr.includes(name) ? arr.filter((n) => n !== name) : [...arr, name];
    setWoFilters((prev) => ({ ...prev, agencyNames: toggle(prev.agencyNames) }));
    setAppliedWOFilters((prev) => ({ ...prev, agencyNames: toggle(prev.agencyNames) }));
  };

  const chartChips: { label: string; onRemove: () => void }[] = [
    ...appliedWOFilters.delayStatuses.map((s) => ({ label: delayStatusShort(s), onRemove: () => handleToggleDelayStatus(s) })),
    ...appliedWOFilters.agencyNames.map((n) => ({ label: n, onRemove: () => handleToggleAgencyName(n) })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 p-1.5" onClick={onClose}>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-slate-50 shadow-2xl ring-1 ring-slate-700/50" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-4">
          <div className="min-w-0 flex items-start gap-3">
            <button onClick={onClose} className="mt-0.5 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors" title="Back to project list">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/15 px-2 py-1 font-mono text-[10px] font-bold text-cyan-300">{project.seq_no}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">CMS Project</span>
              {isMaintainMode && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isFinalized ? 'bg-slate-700 text-slate-300' : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'}`}>
                  {isFinalized ? 'Approved' : 'Maintenance'}
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${delayStatusColor(project.delay_status).bg} ${delayStatusColor(project.delay_status).text}`}>
                {delayStatusShort(project.delay_status)}
              </span>
            </div>
            <h2 className="mt-1 truncate text-base font-bold text-white">{project.title}</h2>
            <p className="text-[11px] text-slate-400">{project.state} · {project.district}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <button
            onClick={() => setTab('charts')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${tab === 'charts' ? 'bg-cyan-700 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Project Chart
          </button>
          <button
            onClick={() => setTab('header')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${tab === 'header' ? 'bg-cyan-700 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <FileText className="h-3.5 w-3.5" /> Project Header
          </button>
          <button
            onClick={() => setTab('agency')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${tab === 'agency' ? 'bg-cyan-700 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Building2 className="h-3.5 w-3.5" /> Agency (WOs)
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'charts' && (
            <ChartViewTab
              project={project}
              workOrders={workOrders}
              details={details}
              sections={sections}
              payments={payments}
              woDrawingProgress={woDrawingProgress}
              sharedWOState={{
                projectWOs,
                filteredWOs,
                statusFilter,
                setStatusFilter,
                woFilters,
                setWoFilters,
                appliedWOFilters,
                setAppliedWOFilters,
                agencyNameOptions,
                isWOFiltered,
                handleClearAllWOFilters,
                handleToggleDelayStatus,
                handleToggleAgencyName,
                chartChips,
              }}
            />
          )}
          {tab === 'header' && (
            <HeaderTab
              project={project}
              workOrders={workOrders}
              details={details}
              canEdit={canEdit}
              isFinalized={isFinalized}
              initialEditing={canMaintain}
              trackingUpdates={trackingUpdates}
              onSaveProject={onSaveProject}
              onClose={onClose}
            />
          )}
          {tab === 'agency' && (
            <AgencyTab
              project={project}
              workOrders={workOrders}
              details={details}
              sections={sections}
              payments={payments}
              trackingUpdates={trackingUpdates}
              woSectionProgress={woSectionProgress}
              woSectionDocuments={woSectionDocuments}
              woSectionActivity={woSectionActivity}
              woDrawingProgress={woDrawingProgress}
              onReload={onReload}
              onSaveTrackingUpdate={onSaveTrackingUpdate}
              sharedWOState={{
                projectWOs,
                filteredWOs,
                statusFilter,
                setStatusFilter,
                woFilters,
                setWoFilters,
                appliedWOFilters,
                setAppliedWOFilters,
                agencyNameOptions,
                isWOFiltered,
                handleClearAllWOFilters,
                handleToggleDelayStatus,
                handleToggleAgencyName,
                chartChips,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Header Tab ─── */

function HeaderTab({
  project, workOrders, details, canEdit, isFinalized, initialEditing = false, trackingUpdates, onSaveProject, onClose,
}: {
  project: Project;
  workOrders: WorkOrder[];
  details: WorkOrderDetail[];
  canEdit: boolean;
  isFinalized: boolean;
  initialEditing?: boolean;
  trackingUpdates: TrackingUpdate[];
  onSaveProject: (id: string | null, formData: ProjectFormData, status: ProjectStatus) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(initialEditing);
  const [form, setForm] = useState<ProjectFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    setError(null);
  }, [project]);

  const update = (field: keyof ProjectFormData, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const districts = form.state ? DISTRICTS[form.state] || [] : [];
  const subcategories = form.category ? SUBCATEGORIES[form.category] || [] : [];
  const allocationTotal = useMemo(() => ['drawing_pct', 'supply_pct', 'civil_pct', 'manpower_pct', 'others_pct'].reduce((sum, key) => sum + (Number(form[key as keyof ProjectFormData]) || 0), 0), [form]);
  const agencyValueTotal = useMemo(() => workOrders.filter((wo) => wo.project_id === project.id).reduce((sum, wo) => {
    const value = details.find((detail) => detail.work_order_id === wo.id)?.wo_value ?? wo.project_value;
    return sum + (Number(value) || 0);
  }, 0), [details, project.id, workOrders]);
  const agencyAllocationTotal = calculateAllocationPct(agencyValueTotal, Number(form.project_value) || Number(project.project_value) || 0);

  const inputClass = 'w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition-colors disabled:bg-slate-100 disabled:text-slate-400';
  const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block';

  const handleSubmit = async (status: ProjectStatus) => {
    if (!form.title.trim()) return setError('Project name is required.');
    if (Math.abs(allocationTotal - 100) > 0.01) return setError('Scope allocation must total exactly 100%.');
    if (status === 'finalized' && Math.abs(agencyAllocationTotal - 100) > 0.01) return setError(`Agency WO values must cover 100% of the project value before finalizing. Current total: ${agencyAllocationTotal.toFixed(1)}%.`);
    if (isFinalized) return setError('This project is finalized and locked. Submit an amendment request to change it.');
    setSaving(true); setError(null);
    const result = await onSaveProject(project.id, form, status);
    setSaving(false);
    if (result.success) { setEditing(false); } else setError(result.error ?? 'Failed to save project.');
  };

  const colors = delayStatusColor(project.delay_status);
  const balance = Math.max(0, project.mbook_entry - project.paid_amount);
  const progressPct = project.target_pct > 0 ? Math.min(100, (project.completed_pct / project.target_pct) * 100) : 0;

  const projectUpdates = useMemo(() => trackingUpdates.filter((u) => u.project_id === project.id), [trackingUpdates, project.id]);
  const updatesByType = useMemo(() => {
    const map: Record<TrackingType, TrackingUpdate[]> = { spec: [], quantity: [], price: [], delay: [], delivery: [] };
    for (const u of projectUpdates) map[u.tracking_type].push(u);
    return map;
  }, [projectUpdates]);

  const [expandedDeviation, setExpandedDeviation] = useState<TrackingType | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<TrackingType>('spec');
  const [showHistory, setShowHistory] = useState(false);

  const deviationRows: { type: TrackingType; label: string; count: number; value: string; valueClass: string; icon: typeof AlertTriangle }[] = [
    { type: 'spec', label: 'Spec Deviations', count: updatesByType.spec.length, value: updatesByType.spec[0]?.deviation_value ?? '0', valueClass: 'text-amber-700', icon: FileText },
    { type: 'quantity', label: 'Qty Deviations', count: updatesByType.quantity.length, value: updatesByType.quantity[0]?.deviation_value ?? '0', valueClass: 'text-orange-700', icon: Ruler },
    { type: 'price', label: 'Price Escalations', count: updatesByType.price.length, value: updatesByType.price[0]?.deviation_value ?? '0', valueClass: 'text-emerald-700', icon: TrendingUp },
    { type: 'delay', label: 'Extension / Delay', count: updatesByType.delay.length, value: updatesByType.delay[0]?.deviation_value ?? '0', valueClass: 'text-rose-700', icon: Clock },
    { type: 'delivery', label: 'Schedule Deviation', count: updatesByType.delivery.length, value: updatesByType.delivery[0]?.deviation_value ?? '0', valueClass: 'text-amber-700', icon: Truck },
  ];

  const totalDeviationCount = projectUpdates.length;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-cyan-700">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
  const Field = ({ label, field, type = 'text', full = false }: { label: string; field: keyof ProjectFormData; type?: string; full?: boolean }) => (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className={labelClass}>{label}</label>
      <input type={type} value={form[field]} disabled={isFinalized} onChange={(e) => update(field, e.target.value)} className={inputClass} />
    </div>
  );

  if (editing && canEdit) {
    return (
      <div className="space-y-3 p-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        <div className="flex items-center gap-4 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
          <span className={labelClass}>Project Type</span>
          {(['EPC', 'PMC'] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input type="radio" checked={form.project_type === type} disabled={isFinalized} onChange={() => update('project_type', type)} />
              {type === 'EPC' ? 'EPC' : 'PMC'}
            </label>
          ))}
        </div>
        <Section title="Project Identity">
          <Field label="Project Name" field="title" />
          <Field label="Project Code" field="project_code" />
          <Field label="Segment ID" field="segment_id" />
          <Field label="Tender Reference Number" field="tender_ref_number" />
          <Field label="Client Name" field="client_name" />
          <Field label="Contract Type ID" field="contract_type_id" />
          <Field label="Scheme ID" field="scheme_id" />
          <Field label="Work Category ID" field="work_category_id" />
          <Field label="Description" field="description" full />
        </Section>
        <Section title="Location & Classification">
          <div>
            <label className={labelClass}>State</label>
            <select value={form.state} disabled={isFinalized} onChange={(e) => { update('state', e.target.value); update('district', ''); }} className={inputClass}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>District</label>
            <select value={form.district} disabled={!form.state || isFinalized} onChange={(e) => update('district', e.target.value)} className={inputClass}>
              <option value="">Select district</option>
              {districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <Field label="Site City" field="site_city" />
          <Field label="Region ID" field="region_id" />
          <Field label="Address Line A" field="site_address_a" />
          <Field label="Address Line B" field="site_address_b" />
          <Field label="PIN Code" field="pin_code" />
        </Section>
        <Section title="Category & Personnel">
          <div>
            <label className={labelClass}>Category</label>
            <select value={form.category} disabled={isFinalized} onChange={(e) => { update('category', e.target.value); update('subcategory', ''); }} className={inputClass}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Subcategory</label>
            <select value={form.subcategory} disabled={!form.category || isFinalized} onChange={(e) => update('subcategory', e.target.value)} className={inputClass}>
              <option value="">Select subcategory</option>
              {subcategories.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Engineer In-Charge ID" field="engineer_incharge_id" />
          <Field label="Project Manager" field="manager" />
          <Field label="Phone Number" field="phone_number" />
          <Field label="Email ID" field="email_id" type="email" />
        </Section>
        <Section title="Timeline & Financials">
          <Field label="Start Date" field="start_date" type="date" />
          <Field label="Duration (days)" field="duration_days" type="number" />
          <Field label="Project Value (₹ Lakhs)" field="project_value" type="number" />
          <Field label="Work Order Value (₹ Cr)" field="workorder_value" type="number" />
          <Field label="MBook Entry (₹ Lakhs)" field="mbook_entry" type="number" />
          <Field label="Security Deposit" field="security_deposit" type="number" />
          <Field label="Claim Period Upto" field="claim_period_upto" type="date" />
        </Section>
        <Section title="Security Deposit Bank Guarantee">
          <Field label="SD BG Number" field="sd_bg_number" />
          <Field label="Valid From" field="sd_bg_valid_from" type="date" />
          <Field label="Valid To" field="sd_bg_valid_to" type="date" />
        </Section>
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Scope Allocation</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${Math.abs(allocationTotal - 100) < 0.01 ? 'bg-emerald-100 text-emerald-700' : allocationTotal > 100 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {allocationTotal.toFixed(1)}% / 100%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(['drawing_pct', 'supply_pct', 'civil_pct', 'manpower_pct', 'others_pct'] as const).map((field) => (
              <div key={field}>
                <label className={labelClass}>{field.replace('_pct', '').replace('_', ' ')} %</label>
                <input type="number" min="0" max="100" step="0.1" value={form[field]} disabled={isFinalized} onChange={(e) => update(field, e.target.value)} className={inputClass} />
              </div>
            ))}
          </div>
        </section>
        <div className={`rounded-lg border px-3 py-2 text-xs ${Math.abs(agencyAllocationTotal - 100) < 0.01 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          Agency WO values cover <b>{agencyAllocationTotal.toFixed(1)}%</b> of the project value. Finalization requires 100%.
        </div>
        <div>
          <label className={labelClass}>Remarks</label>
          <textarea value={form.remarks} disabled={isFinalized} onChange={(e) => update('remarks', e.target.value)} rows={2} className={inputClass} />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sticky bottom-0">
          <div className="text-[11px] text-slate-500">{isFinalized ? 'Finalized projects require an amendment request.' : 'Save as draft or finish to lock the project header.'}</div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
            {!isFinalized && (
              <>
                <button onClick={() => handleSubmit('draft')} disabled={saving} className="flex items-center gap-1.5 rounded border border-cyan-300 bg-white px-3 py-1.5 text-xs font-bold text-cyan-700">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save Draft
                </button>
                <button onClick={() => handleSubmit('finalized')} disabled={saving} className="flex items-center gap-1.5 rounded bg-cyan-700 px-3 py-1.5 text-xs font-bold text-white">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockKeyhole className="h-3.5 w-3.5" />}Finish &amp; Finalize
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Read-only view */
  return (
    <div className="p-4 space-y-3">
      {isFinalized && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <LockKeyhole className="w-3.5 h-3.5" /> Finalized &amp; Locked
        </div>
      )}

      {/* Metadata grid */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">{project.seq_no}</span>
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-400/30">Project Level</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}>{delayStatusShort(project.delay_status)}</span>
          </div>
          <h2 className="mt-1 truncate text-base font-bold text-white">{project.title}</h2>
        </div>
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <SectionTitle icon={MapPin}>Location</SectionTitle>
              <MetaRow label="State" value={project.state} />
              <MetaRow label="District" value={project.district} />
              <MetaRow label="Site City" value={project.site_city ?? '-'} />
              <MetaRow label="Region" value={project.region_id ?? '-'} />
              <MetaRow label="Address A" value={project.site_address_a ?? '-'} />
              <MetaRow label="Address B" value={project.site_address_b ?? '-'} />
              <MetaRow label="PIN Code" value={project.pin_code ?? '-'} />
            </div>
            <div>
              <SectionTitle icon={FileText}>Classification</SectionTitle>
              <MetaRow label="Category" value={project.category} />
              <MetaRow label="Subcategory" value={project.subcategory} />
              <MetaRow label="Project Type" value={project.project_type} />
              <MetaRow label="Project Code" value={project.project_code ?? project.code} />
              <MetaRow label="Client Name" value={project.client_name ?? '-'} />
              <MetaRow label="Tender Ref" value={project.tender_ref_number ?? '-'} />
              <MetaRow label="Work Category" value={project.work_category_id ?? '-'} />
            </div>
            <div>
              <SectionTitle icon={FileCheck}>Progress</SectionTitle>
              <MetaRow label="Completed" value={`${project.completed_pct.toFixed(0)}%`} valueClass="text-cyan-700" />
              <MetaRow label="Target" value={`${project.target_pct.toFixed(0)}%`} valueClass="text-slate-600" />
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div>
              <SectionTitle icon={Calendar}>Timeline</SectionTitle>
              <MetaRow label="Start Date" value={formatDateShort(project.start_date)} />
              <MetaRow label="End Date" value={formatDateShort(project.end_date)} />
              <MetaRow label="Duration" value={project.duration_days ? `${project.duration_days} days` : '-'} />
            </div>
            <div>
              <SectionTitle icon={FileText}>Financials</SectionTitle>
              <MetaRow label="Total Project Value" value={formatINR(project.project_value)} valueClass="text-indigo-700" />
              <MetaRow label="Agency Allocation" value={`${formatINR(agencyValueTotal)} · ${agencyAllocationTotal.toFixed(1)}%`} valueClass="text-cyan-700" />
              <MetaRow label="Work Order Value" value={formatINR(project.workorder_value)} valueClass="text-blue-700" />
              <MetaRow label="MBook Entry" value={formatINR(project.mbook_entry)} valueClass="text-blue-700" />
              <MetaRow label="Billed Amount" value={formatINR(project.billed_amount)} valueClass="text-cyan-700" />
              <MetaRow label="Paid Amount" value={formatINR(project.paid_amount)} valueClass="text-emerald-700" />
              <MetaRow label="Financial Progress" value={`${project.project_value > 0 ? Math.min(100, (project.paid_amount / project.project_value) * 100).toFixed(1) : '0.0'}%`} valueClass="text-cyan-700" />
              <MetaRow label="Balance" value={formatINR(balance)} valueClass="text-rose-600" />
              <MetaRow label="Security Deposit" value={formatINR(project.security_deposit)} valueClass="text-slate-700" />
            </div>
            <div>
              <SectionTitle icon={AlertTriangle}>Deviations</SectionTitle>
              {deviationRows.map((dr) => {
                const entries = updatesByType[dr.type];
                const isExpanded = expandedDeviation === dr.type;
                const hasEntries = entries.length > 0;
                return (
                  <div key={dr.type}>
                    <button
                      onClick={() => hasEntries ? setExpandedDeviation(isExpanded ? null : dr.type) : undefined}
                      disabled={!hasEntries}
                      className={`flex w-full items-center justify-between py-1.5 border-b border-slate-100 last:border-0 ${hasEntries ? 'cursor-pointer hover:bg-slate-100/60' : 'cursor-default'}`}
                    >
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        {hasEntries && isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : hasEntries ? <ChevronRight className="w-3 h-3 text-slate-400" /> : <span className="w-3" />}
                        {dr.label}
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${dr.valueClass}`}>{dr.value}</span>
                      {dr.count > 0 && <span className="ml-1.5 text-[9px] font-medium text-slate-400">{dr.count} {dr.count === 1 ? 'log' : 'logs'}</span>}
                    </button>
                    {isExpanded && hasEntries && (
                      <div className="mt-1 mb-2 space-y-2 pl-4">
                        {entries.map((u) => {
                          const tabMeta = DEVIATION_TABS.find((t) => t.key === dr.type);
                          return <UpdateCard key={u.id} u={u} icon={tabMeta?.icon ?? FileText} color={tabMeta?.color ?? 'text-slate-400'} />;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {totalDeviationCount > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 hover:text-cyan-800">
                  {showHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Deviation History ({totalDeviationCount})
                </button>
              )}
            </div>
          </div>
        </div>
        {showHistory && totalDeviationCount > 0 && (
          <div className="border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex items-center gap-1 mb-3 overflow-x-auto">
              {DEVIATION_TABS.map((t) => {
                const count = updatesByType[t.key].length;
                if (count === 0) return null;
                const Icon = t.icon;
                const isActive = activeHistoryTab === t.key;
                return (
                  <button key={t.key} onClick={() => setActiveHistoryTab(t.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${isActive ? 'bg-slate-100 text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? t.color : 'text-slate-400'}`} />
                    {t.label}
                    <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {updatesByType[activeHistoryTab].map((u) => {
                const tabMeta = DEVIATION_TABS.find((t) => t.key === activeHistoryTab);
                return <UpdateCard key={u.id} u={u} icon={tabMeta?.icon ?? FileText} color={tabMeta?.color ?? 'text-slate-400'} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Agency Tab ─── */

function AgencyTab({
  project, workOrders, details, sections, payments, trackingUpdates, woSectionProgress, woSectionDocuments, woSectionActivity, woDrawingProgress, onReload, onSaveTrackingUpdate, sharedWOState,
}: {
  project: Project;
  workOrders: WorkOrder[];
  details: WorkOrderDetail[];
  sections: WOSection[];
  payments: PaymentEntry[];
  trackingUpdates: TrackingUpdate[];
  woSectionProgress: WOSectionProgress[];
  woSectionDocuments: WOSectionDocument[];
  woSectionActivity: WOSectionActivity[];
  woDrawingProgress: WODrawingProgress[];
  onReload: () => Promise<void>;
  onSaveTrackingUpdate: (entry: {
    project_id: string;
    tracking_type: TrackingType;
    deviation_value: string;
    officer_name: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;
  sharedWOState: SharedWOState;
}) {
  const { permissions } = useAuth();
  const [woViewType, setWoViewType] = useState<WOViewType>('tile');
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showCreateWO, setShowCreateWO] = useState(false);
  const [woFilterOpen, setWoFilterOpen] = useState(false);

  const canManageWOs = permissions.canManageWorkOrders;

  const { projectWOs, filteredWOs, statusFilter, setStatusFilter, woFilters, setWoFilters, appliedWOFilters, setAppliedWOFilters, agencyNameOptions, isWOFiltered, handleClearAllWOFilters } = sharedWOState;

  const viewLabel = woViewType === 'tile' ? 'Tile View' : woViewType === 'table' ? 'Table View' : 'Card View';

  return (
    <div className="flex flex-col">
      {/* 1. DP cards at top (status + allocation DPs) */}
      <StatusBar items={projectWOs} activeFilter={statusFilter} onFilterChange={setStatusFilter} noun="WOs" />

      {/* 2. View controls bar with filter button */}
      <div className="flex items-center justify-between px-3 py-2 bg-cyan-50/60 border-b border-cyan-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 tracking-tight">{viewLabel}</span>
          <span className="text-slate-300">|</span>
          {isWOFiltered || statusFilter ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWoFilterOpen(true)}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 underline decoration-cyan-400 decoration-2 underline-offset-2 transition-colors"
              >
                Filtered Data
              </button>
              <button
                onClick={handleClearAllWOFilters}
                title="Clear all filters"
                className="flex items-center text-cyan-700 hover:text-red-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              ALL Data
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
            {([
              { key: 'tile' as const, label: 'Tile', icon: LayoutGrid },
              { key: 'table' as const, label: 'Table', icon: Table2 },
              { key: 'card' as const, label: 'Card', icon: CreditCard },
            ]).map((v) => {
              const Icon = v.icon;
              const isActive = woViewType === v.key;
              return (
                <button key={v.key} onClick={() => setWoViewType(v.key)} className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${isActive ? 'bg-cyan-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setWoFilterOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {canManageWOs && (
            <button
              onClick={() => setShowCreateWO(true)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Agency
            </button>
          )}
        </div>
      </div>

      {/* 3. Content area - only show the selected view */}
      <div className="flex-1">
        {woViewType === 'tile' && <WOTileView workOrders={filteredWOs} details={details} payments={payments} projectValue={project.project_value} onSelect={(wo) => setSelectedWO(wo)} />}
        {woViewType === 'table' && <WOTableView workOrders={filteredWOs} details={details} payments={payments} projectValue={project.project_value} onSelect={(wo) => setSelectedWO(wo)} />}
        {woViewType === 'card' && <WOCardView workOrders={filteredWOs} details={details} payments={payments} projectValue={project.project_value} onSelect={(wo) => setSelectedWO(wo)} />}
      </div>

      {/* WO Filter Drawer */}
      <WOFilterDrawer
        open={woFilterOpen}
        onClose={() => setWoFilterOpen(false)}
        filters={woFilters}
        onFiltersChange={setWoFilters}
        onApply={() => { setAppliedWOFilters(woFilters); setWoFilterOpen(false); }}
        onReset={() => { setWoFilters(DEFAULT_WO_FILTERS); setAppliedWOFilters(DEFAULT_WO_FILTERS); }}
        agencyNameOptions={agencyNameOptions}
      />

      {/* WorkOrderModal for selected WO */}
      {selectedWO && (
        <WorkOrderModalWrapper
          project={project}
          selectedWO={selectedWO}
          workOrders={workOrders}
          details={details}
          sections={sections}
          payments={payments}
          trackingUpdates={trackingUpdates}
          woSectionProgress={woSectionProgress}
          woSectionDocuments={woSectionDocuments}
          woSectionActivity={woSectionActivity}
          woDrawingProgress={woDrawingProgress}
          onClose={() => setSelectedWO(null)}
          onReload={onReload}
          onSaveTrackingUpdate={onSaveTrackingUpdate}
        />
      )}

      {/* Create WO form */}
      {showCreateWO && (
        <CreateWOModal
          project={project}
          onClose={() => setShowCreateWO(false)}
          onCreated={async () => { setShowCreateWO(false); await onReload(); }}
        />
      )}
    </div>
  );
}

/* ─── Chart View Tab ─── */

function ChartViewTab({
  project, workOrders, details, sections, payments, woDrawingProgress, sharedWOState,
}: {
  project: Project;
  workOrders: WorkOrder[];
  details: WorkOrderDetail[];
  sections: WOSection[];
  payments: PaymentEntry[];
  woDrawingProgress: WODrawingProgress[];
  sharedWOState: SharedWOState;
}) {
  const {
    projectWOs, filteredWOs, statusFilter, setStatusFilter,
    woFilters, setWoFilters, appliedWOFilters, setAppliedWOFilters,
    agencyNameOptions, isWOFiltered, handleClearAllWOFilters,
    handleToggleDelayStatus, handleToggleAgencyName, chartChips,
  } = sharedWOState;

  const [woFilterOpen, setWoFilterOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {/* 1. DP cards at top — project-level WO status */}
      <StatusBar items={projectWOs} activeFilter={statusFilter} onFilterChange={setStatusFilter} noun="WOs" />

      {/* 2. Toolbar with filter indicator + filter button */}
      <div className="flex items-center justify-between px-3 py-2 bg-cyan-50/60 border-b border-cyan-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 tracking-tight">Project Charts</span>
          <span className="text-slate-300">|</span>
          {isWOFiltered || statusFilter ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWoFilterOpen(true)}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 underline decoration-cyan-400 decoration-2 underline-offset-2 transition-colors"
              >
                Filtered Data
              </button>
              <button
                onClick={handleClearAllWOFilters}
                title="Clear all filters"
                className="flex items-center text-cyan-700 hover:text-red-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              ALL Data
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWoFilterOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* 3. Active selection chips from chart clicks */}
      {chartChips.length > 0 && (
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-1.5">
            <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wide flex items-center gap-1">
              <Filter className="w-3 h-3" /> Active Selections:
            </span>
            {chartChips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.onRemove}
                className="flex items-center gap-1 text-[11px] font-medium bg-white text-cyan-700 border border-cyan-300 rounded-full px-2 py-0.5 hover:bg-cyan-100 transition-colors"
              >
                {chip.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={handleClearAllWOFilters}
              className="text-[11px] font-medium text-red-500 hover:text-red-700 flex items-center gap-0.5 ml-auto"
            >
              <X className="w-3 h-3" /> Clear All
            </button>
          </div>
        </div>
      )}

      {/* 4. Charts — project-level summaries */}
      <div className="flex-1">
        <WOChartView
          workOrders={filteredWOs}
          workOrderDetails={details}
          paymentEntries={payments}
          selectedDelayStatuses={appliedWOFilters.delayStatuses}
          onToggleDelayStatus={handleToggleDelayStatus}
          agencyChart={
            <AgencyAllocationChart
              workOrders={filteredWOs}
              details={details}
              projectValue={Number(project.project_value) || 0}
              selectedAgencyNames={appliedWOFilters.agencyNames}
              onToggleAgencyName={handleToggleAgencyName}
            />
          }
        />
        <ProjectDrawingStatus
          workOrders={filteredWOs}
          sections={sections}
          drawingProgress={woDrawingProgress}
        />
      </div>

      {/* WO Filter Drawer */}
      <WOFilterDrawer
        open={woFilterOpen}
        onClose={() => setWoFilterOpen(false)}
        filters={woFilters}
        onFiltersChange={setWoFilters}
        onApply={() => { setAppliedWOFilters(woFilters); setWoFilterOpen(false); }}
        onReset={() => { setWoFilters(DEFAULT_WO_FILTERS); setAppliedWOFilters(DEFAULT_WO_FILTERS); }}
        agencyNameOptions={agencyNameOptions}
      />
    </div>
  );
}

/* ─── Agency Allocation Chart ─── */

const AGENCY_CHART_COLORS = [
  '#0891b2', '#1e40af', '#059669', '#d97706', '#7c3aed',
  '#dc2626', '#db2777', '#0d9488', '#ca8a04', '#2563eb',
  '#9333ea', '#ea580c', '#16a34a', '#475569', '#6b7280',
];

function AgencyTooltip({ active, payload, onToggle }: { active?: boolean; payload?: any[]; onToggle?: (name: string) => void }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 px-2.5 py-1.5 text-xs min-w-[130px]">
      <div className="font-bold text-slate-800 mb-0.5">{d.name}</div>
      <div className="text-slate-600">{formatINR(d.value)} · {d.pct.toFixed(1)}%</div>
      <div className="text-slate-400 text-[10px] mb-1">{d.count} WO{d.count > 1 ? 's' : ''}</div>
      {onToggle && (
        <button
          onClick={() => onToggle(d.name)}
          className={`mt-0.5 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1 rounded transition-colors ${
            d.selected ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
          }`}
        >
          {d.selected ? <><Check className="w-3 h-3" /> Selected</> : <><Filter className="w-3 h-3" /> Select</>}
        </button>
      )}
    </div>
  );
}

function AgencyAllocationChart({
  workOrders,
  details,
  projectValue,
  selectedAgencyNames = [],
  onToggleAgencyName,
}: {
  workOrders: WorkOrder[];
  details: WorkOrderDetail[];
  projectValue: number;
  selectedAgencyNames?: string[];
  onToggleAgencyName?: (name: string) => void;
}) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const agencyGroups = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    for (const wo of workOrders) {
      const detail = details.find((d) => d.work_order_id === wo.id);
      const agencyName = detail?.agency_name ?? '-';
      const value = Number(detail?.wo_value ?? wo.project_value) || 0;
      const existing = map.get(agencyName) ?? { count: 0, value: 0 };
      existing.count += 1;
      existing.value += value;
      map.set(agencyName, existing);
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value,
        pct: projectValue > 0 ? (data.value / projectValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [workOrders, details, projectValue]);

  const totalAllocated = agencyGroups.reduce((s, a) => s + a.value, 0);
  const totalPct = projectValue > 0 ? (totalAllocated / projectValue) * 100 : 0;
  const balance = Math.max(0, projectValue - totalAllocated);

  if (workOrders.length === 0) return null;

  const anySelected = selectedAgencyNames.length > 0;
  const canSelect = !!onToggleAgencyName;

  const chartData = agencyGroups.map((a, i) => ({
    name: a.name,
    value: a.value,
    pct: a.pct,
    count: a.count,
    color: AGENCY_CHART_COLORS[i % AGENCY_CHART_COLORS.length],
    selected: selectedAgencyNames.includes(a.name),
    anySelected,
  }));

  const cellFill = (d: typeof chartData[0]) => {
    if (d.anySelected && !d.selected) return d.color + '40';
    return d.color;
  };

  const renderBar = () => (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 2" className="stroke-slate-100" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 600 }} angle={-15} textAnchor="end" height={28} interval={0} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis tick={{ fontSize: 8 }} width={40} tickFormatter={(v) => formatINRShort(v)} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} content={<AgencyTooltip onToggle={onToggleAgencyName} />} />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          barSize={28}
          maxBarSize={36}
          cursor={canSelect ? 'pointer' : undefined}
          onClick={(_payload: any, idx: number) => {
            if (canSelect) onToggleAgencyName!(chartData[idx].name);
          }}
        >
          {chartData.map((d, i) => (
            <Cell
              key={i}
              fill={cellFill(d)}
              stroke={d.selected ? '#0891b2' : 'none'}
              strokeWidth={d.selected ? 2 : 0}
              className={canSelect ? 'cursor-pointer' : ''}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPie = () => (
    <ResponsiveContainer width="100%" height={120}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={42}
          innerRadius={20}
          label={(e: any) => `${e.pct.toFixed(0)}%`}
          labelLine={false}
          cursor={canSelect ? 'pointer' : undefined}
          onClick={(_: any, idx: number) => {
            if (canSelect) onToggleAgencyName!(chartData[idx].name);
          }}
        >
          {chartData.map((d, i) => (
            <Cell
              key={i}
              fill={cellFill(d)}
              stroke={d.selected ? '#0891b2' : '#fff'}
              strokeWidth={d.selected ? 3 : 1}
              className={canSelect ? 'cursor-pointer' : ''}
            />
          ))}
        </Pie>
        <Tooltip content={<AgencyTooltip onToggle={onToggleAgencyName} />} />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="mirror-card rounded border-t-2 border-t-cyan-600 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-700 truncate">Agency Allocation</h3>
            <p className="text-[9px] text-slate-500 font-medium truncate">
              {formatINRShort(totalAllocated)} of {formatINRShort(projectValue)} · {totalPct.toFixed(1)}%{balance > 0 ? ` · ${formatINRShort(balance)} unallocated` : ''}
            </p>
          </div>
          {selectedAgencyNames.length > 0 && (
            <span className="text-[9px] font-bold bg-cyan-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
              {selectedAgencyNames.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setChartType('bar')}
            className={`p-0.5 rounded ${chartType === 'bar' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-0.5 rounded ${chartType === 'pie' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <PieChartIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
      {agencyGroups.length === 0 ? (
        <div className="text-center text-xs text-slate-400 py-6">No agencies match the current filters.</div>
      ) : (
        <>
          <div className="flex-1 min-h-[120px]">
            {chartType === 'bar' ? renderBar() : renderPie()}
          </div>
          {/* Legend */}
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            {chartData.map((d) => (
              <div key={d.name} className={`flex items-center gap-1 text-[9px] ${d.anySelected && !d.selected ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.anySelected && !d.selected ? d.color + '40' : d.color }} />
                <span className="font-medium">{d.name}</span>
                <span className="text-slate-400">{d.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── WO Filter Drawer ─── */

function WOFilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  agencyNameOptions,
}: {
  open: boolean;
  onClose: () => void;
  filters: WOFilters;
  onFiltersChange: (f: WOFilters) => void;
  onApply: () => void;
  onReset: () => void;
  agencyNameOptions: string[];
}) {
  if (!open) return null;

  const toggleAgency = (name: string) => {
    const next = filters.agencyNames.includes(name)
      ? filters.agencyNames.filter((n) => n !== name)
      : [...filters.agencyNames, name];
    onFiltersChange({ ...filters, agencyNames: next });
  };

  const toggleDelay = (status: DelayStatus) => {
    const next = filters.delayStatuses.includes(status)
      ? filters.delayStatuses.filter((s) => s !== status)
      : [...filters.delayStatuses, status];
    onFiltersChange({ ...filters, delayStatuses: next });
  };

  const toggleCompletion = (cs: string) => {
    const next = filters.completionStatus.includes(cs)
      ? filters.completionStatus.filter((s) => s !== cs)
      : [...filters.completionStatus, cs];
    onFiltersChange({ ...filters, completionStatus: next });
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-2/5 max-w-[500px] min-w-[350px] bg-white shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-700">
          <h2 className="text-sm font-bold">Filter Agency WOs</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
            >
              <X className="w-3 h-3" /> Close
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 border-b border-slate-100">
          Set filter conditions and click <span className="font-semibold text-cyan-700">Search Now</span> to filter work orders
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 1. Agency Name Filter */}
          {agencyNameOptions.length > 0 && (
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-1.5">1. Agency Name</h3>
              <div className="flex flex-wrap gap-1.5">
                {agencyNameOptions.map((name) => {
                  const isSelected = filters.agencyNames.includes(name);
                  return (
                    <button
                      key={name}
                      onClick={() => toggleAgency(name)}
                      className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-all ${isSelected ? 'bg-cyan-100 text-cyan-700 border-cyan-300 ring-1 ring-cyan-400' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Delay Status Filter */}
          <div className="px-3 py-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 mb-1.5">2. Delay Status</h3>
            <div className="flex flex-wrap gap-1.5">
              {DELAY_STATUSES.map((status) => {
                const isSelected = filters.delayStatuses.includes(status);
                const colors = delayStatusColor(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleDelay(status)}
                    className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border transition-all ${isSelected ? `${colors.bg} ${colors.text} ${colors.border} ring-1 ring-cyan-400` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    {delayStatusShort(status)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Completion Status Filter */}
          <div className="px-3 py-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 mb-1.5">3. Completion Status</h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'completed', label: 'Completed' },
                { key: 'inprogress', label: 'In Progress' },
                { key: 'notstarted', label: 'Not Started' },
              ].map((cs) => {
                const isSelected = filters.completionStatus.includes(cs.key);
                return (
                  <button
                    key={cs.key}
                    onClick={() => toggleCompletion(cs.key)}
                    className={`text-[11px] px-2 py-1 rounded border transition-all ${isSelected ? 'bg-cyan-100 text-cyan-700 border-cyan-300 ring-1 ring-cyan-400' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {cs.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. WO Value Range Filter */}
          <div className="px-3 py-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 mb-1.5">4. WO Value Range</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-0.5">Min Value</label>
                <input
                  type="number"
                  value={filters.minValue}
                  onChange={(e) => onFiltersChange({ ...filters, minValue: e.target.value })}
                  placeholder="0"
                  className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="text-slate-400 mt-4">→</div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block mb-0.5">Max Value</label>
                <input
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) => onFiltersChange({ ...filters, maxValue: e.target.value })}
                  placeholder="No limit"
                  className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Now */}
        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onApply}
            className="flex items-center justify-center gap-2 w-full bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-bold py-2 rounded transition-colors"
          >
            Search Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── WO View Components ─── */

function getAgencyName(woId: string, details: WorkOrderDetail[]): string {
  return details.find((d) => d.work_order_id === woId)?.agency_name ?? '-';
}

function safeNum(v: number | null | undefined): number {
  return typeof v === 'number' && !isNaN(v) ? v : 0;
}

function getPaidAmount(workOrder: WorkOrder, payments: PaymentEntry[]): number {
  const entries = payments.filter((payment) => payment.work_order_id === workOrder.id);
  return entries.length ? Math.max(...entries.map((payment) => safeNum(payment.cumulative_paid))) : safeNum(workOrder.paid_amount);
}

function AgencyFinancialBar({ value, paid, billed, compact = false }: { value: number; paid: number; billed: number; compact?: boolean }) {
  const base = Math.max(1, value);
  const billedNotPaid = Math.max(0, billed - paid);
  const balance = Math.max(0, value - paid);
  const paidPct = Math.min(100, (paid / base) * 100);
  const billedNotPaidPct = Math.min(100 - paidPct, (billedNotPaid / base) * 100);
  const remainingPct = Math.max(0, 100 - paidPct - billedNotPaidPct);

  if (compact) {
    return (
      <div className="min-w-[150px]">
        <div className="mb-1 flex items-center justify-between text-[9px] text-slate-500">
          <span className="font-semibold text-slate-600">Financial Progress</span>
          <span className="font-bold text-slate-700">{paidPct.toFixed(0)}%</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {paidPct > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${paidPct}%` }} />}
          {billedNotPaidPct > 0 && <div className="bg-cyan-500 transition-all duration-500" style={{ width: `${billedNotPaidPct}%` }} />}
          {remainingPct > 0 && <div className="bg-rose-400 transition-all duration-500" style={{ width: `${remainingPct}%` }} />}
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] font-semibold tabular-nums">
          <span className="text-emerald-700">{formatINRShort(paid)}</span>
          <span className="text-cyan-700">{formatINRShort(billedNotPaid)}</span>
          <span className="text-rose-600">{formatINRShort(balance)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-slate-200 bg-slate-50/80 px-2 py-1.5">
      <div className="mb-0.5 flex items-center justify-between text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-600">Financial Progress</span>
        </span>
        <span className="font-semibold text-slate-700">{paidPct.toFixed(0)}%</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {paidPct > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${paidPct}%` }} />}
        {billedNotPaidPct > 0 && <div className="bg-cyan-500 transition-all duration-500" style={{ width: `${billedNotPaidPct}%` }} />}
        {remainingPct > 0 && <div className="bg-rose-400 transition-all duration-500" style={{ width: `${remainingPct}%` }} />}
      </div>
      <div className="mt-1 flex items-center justify-between text-[9px]">
        <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /><span className="font-semibold text-emerald-700">{formatINRShort(paid)}</span></span>
        <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-sm bg-cyan-500" /><span className="font-semibold text-cyan-700">{formatINRShort(billedNotPaid)}</span></span>
        <span className="flex items-center gap-0.5"><span className="h-2 w-2 rounded-sm bg-rose-400" /><span className="font-semibold text-rose-600">{formatINRShort(balance)}</span></span>
      </div>
    </div>
  );
}

function WOTileView({ workOrders, details, payments, onSelect, projectValue }: { workOrders: WorkOrder[]; details: WorkOrderDetail[]; payments: PaymentEntry[]; onSelect: (wo: WorkOrder) => void; projectValue?: number }) {
  if (workOrders.length === 0) return <div className="text-center text-sm text-slate-500 py-6">No work orders found.</div>;
  return (
    <div className="flex flex-col gap-3 p-4">
      {workOrders.map((wo) => {
        const colors = delayStatusColor(wo.delay_status);
        const agencyName = getAgencyName(wo.id, details);
        const woValue = details.find((detail) => detail.work_order_id === wo.id)?.wo_value ?? wo.project_value;
        const allocationPct = calculateAllocationPct(Number(woValue) || 0, Number(projectValue) || 0);
        const paidAmount = getPaidAmount(wo, payments);
        const financialPct = Number(woValue) > 0 ? Math.min(100, (paidAmount / Number(woValue)) * 100) : 0;
        return (
          <div key={wo.id} className={`mirror-card rounded-r-lg rounded-l-sm p-4 flex flex-col gap-2 border-l-4 ${colors.borderAccent}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Seq # {wo.seq_no}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>{delayStatusShort(wo.delay_status)}</span>
              <span className="text-sm font-semibold text-slate-800 truncate flex-1 min-w-0">{wo.title}</span>
              <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700 tabular-nums">{allocationPct.toFixed(1)}% WO</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span className="font-medium text-slate-600">Physical Progress</span>
                  <span><span className="font-semibold text-cyan-700">{safeNum(wo.completed_pct).toFixed(0)}%</span><span className="text-slate-400"> / target {safeNum(wo.target_pct).toFixed(0)}%</span></span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10" style={{ left: `${Math.min(safeNum(wo.target_pct), 100)}%` }} />
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${safeNum(wo.completed_pct)}%` }} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
              <span>Agency: <span className="font-semibold text-slate-700">{agencyName}</span></span>
              <span>WO Value: <span className="font-semibold text-indigo-700">{formatINRShort(Number(woValue) || 0)}</span></span>
              <span>Billed: <span className="font-semibold text-cyan-700">{formatINRShort(safeNum(wo.billed_amount))}</span></span>
            </div>
            <AgencyFinancialBar value={Number(woValue) || 0} paid={paidAmount} billed={safeNum(wo.billed_amount)} />
            <button onClick={() => onSelect(wo)} className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded transition-colors self-start">
              <Building2 className="w-3 h-3" /> Agency Detail
            </button>
          </div>
        );
      })}
    </div>
  );
}

function WOTableView({ workOrders, details, payments, onSelect, projectValue }: { workOrders: WorkOrder[]; details: WorkOrderDetail[]; payments: PaymentEntry[]; onSelect: (wo: WorkOrder) => void; projectValue?: number }) {
  if (workOrders.length === 0) return <div className="text-center text-sm text-slate-500 py-6">No work orders found.</div>;
  return (
    <div className="p-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-200 border-b-2 border-slate-300">
            <th className="px-2 py-2 font-bold text-slate-700 text-left">Seq #</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-left">WO Name</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-left">Agency</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-right">WO %</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-right">Comp %</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-left">Status</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-right">WO Value</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-right">Paid / Financial</th>
            <th className="px-2 py-2 font-bold text-slate-700 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workOrders.map((wo, idx) => {
            const colors = delayStatusColor(wo.delay_status);
            const woValue = details.find((detail) => detail.work_order_id === wo.id)?.wo_value ?? wo.project_value;
            const allocationPct = calculateAllocationPct(Number(woValue) || 0, Number(projectValue) || 0);
            const paidAmount = getPaidAmount(wo, payments);
            const financialPct = Number(woValue) > 0 ? Math.min(100, (paidAmount / Number(woValue)) * 100) : 0;
            return (
              <tr key={wo.id} className={`border-b border-slate-200 hover:bg-cyan-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
                <td className="px-2 py-1.5 font-mono font-bold text-slate-500 whitespace-nowrap">{wo.seq_no}</td>
                <td className="px-2 py-1.5 text-slate-800 font-medium max-w-[200px] truncate">{wo.title}</td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{getAgencyName(wo.id, details)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums"><span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700">{allocationPct.toFixed(1)}%</span></td>
                <td className="px-2 py-1.5 text-right tabular-nums">{safeNum(wo.completed_pct).toFixed(0)}%</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>{delayStatusShort(wo.delay_status)}</span>
                </td>
                <td className="px-2 py-1.5 text-indigo-700 font-semibold text-right tabular-nums whitespace-nowrap">{formatINRShort(Number(woValue) || 0)}</td>
                <td className="px-2 py-1.5 align-middle"><AgencyFinancialBar value={Number(woValue) || 0} paid={paidAmount} billed={safeNum(wo.billed_amount)} compact /></td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <button onClick={() => onSelect(wo)} className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded transition-colors">
                    <Building2 className="w-3 h-3" /> Detail
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WOCardView({ workOrders, details, payments, onSelect, projectValue }: { workOrders: WorkOrder[]; details: WorkOrderDetail[]; payments: PaymentEntry[]; onSelect: (wo: WorkOrder) => void; projectValue?: number }) {
  if (workOrders.length === 0) return <div className="text-center text-sm text-slate-500 py-6">No work orders found.</div>;
  return (
    <div className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {workOrders.map((wo) => {
        const colors = delayStatusColor(wo.delay_status);
        const woValue = details.find((detail) => detail.work_order_id === wo.id)?.wo_value ?? wo.project_value;
        const allocationPct = calculateAllocationPct(Number(woValue) || 0, Number(projectValue) || 0);
        const paidAmount = getPaidAmount(wo, payments);
        const financialPct = Number(woValue) > 0 ? Math.min(100, (paidAmount / Number(woValue)) * 100) : 0;
        return (
          <div key={wo.id} className={`mirror-card rounded-r-lg rounded-l-sm p-3 flex flex-col gap-2 border-l-4 ${colors.borderAccent}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{wo.seq_no}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>{delayStatusShort(wo.delay_status)}</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">{wo.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-medium truncate">{getAgencyName(wo.id, details)}</span>
              <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700 tabular-nums">{allocationPct.toFixed(1)}%</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="font-semibold text-slate-600">Progress</span>
                <span className="font-semibold text-slate-700">{safeNum(wo.completed_pct).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${safeNum(wo.completed_pct)}%` }} />
                {safeNum(wo.target_pct) > 0 && <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500" style={{ left: `${Math.min(safeNum(wo.target_pct), 100)}%` }} />}
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>WO: <span className="font-semibold text-indigo-700">{formatINRShort(Number(woValue) || 0)}</span></span>
              <span>Billed: <span className="font-semibold text-cyan-700">{formatINRShort(safeNum(wo.billed_amount))}</span></span>
            </div>
            <AgencyFinancialBar value={Number(woValue) || 0} paid={paidAmount} billed={safeNum(wo.billed_amount)} compact />
            <button onClick={() => onSelect(wo)} className="flex items-center gap-1 text-[10px] font-medium text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 border border-cyan-200 px-1.5 py-1 rounded transition-colors justify-center">
              <Building2 className="w-3 h-3" /> Agency Detail
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── WorkOrderModal wrapper (delegates to existing WorkOrderModal) ─── */

function WorkOrderModalWrapper({
  project, selectedWO, workOrders, details, sections, payments, trackingUpdates, woSectionProgress, woSectionDocuments, woSectionActivity, woDrawingProgress, onClose, onReload, onSaveTrackingUpdate,
}: {
  project: Project;
  selectedWO: WorkOrder;
  workOrders: WorkOrder[];
  details: WorkOrderDetail[];
  sections: WOSection[];
  payments: PaymentEntry[];
  trackingUpdates: TrackingUpdate[];
  woSectionProgress: WOSectionProgress[];
  woSectionDocuments: WOSectionDocument[];
  woSectionActivity: WOSectionActivity[];
  woDrawingProgress: WODrawingProgress[];
  onClose: () => void;
  onReload: () => Promise<void>;
  onSaveTrackingUpdate: (entry: {
    project_id: string;
    tracking_type: TrackingType;
    deviation_value: string;
    officer_name: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;
}) {
  // Use dynamic import to avoid circular dependency
  const [WOModal, setWOModal] = useState<typeof import('./WorkOrderModal').WorkOrderModal | null>(null);
  useEffect(() => {
    import('./WorkOrderModal').then((m) => setWOModal(() => m.WorkOrderModal));
  }, []);

  const reorderedWOs = useMemo(() => {
    if (!selectedWO) return workOrders;
    const rest = workOrders.filter((w) => w.id !== selectedWO.id);
    return [selectedWO, ...rest];
  }, [selectedWO, workOrders]);

  if (!WOModal) return null;

  return (
    <WOModal
      project={project}
      workOrders={reorderedWOs}
      details={details}
      sections={sections}
      payments={payments}
      trackingUpdates={trackingUpdates}
      woSectionProgress={woSectionProgress}
      woSectionDocuments={woSectionDocuments}
      woSectionActivity={woSectionActivity}
      woDrawingProgress={woDrawingProgress}
      onClose={onClose}
      onReload={onReload}
      onSaveTrackingUpdate={onSaveTrackingUpdate}
    />
  );
}

/* ─── Create WO Modal ─── */

function CreateWOModal({ project, onClose, onCreated }: { project: Project; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyType, setAgencyType] = useState('');
  const [scope, setScope] = useState('');
  const [woValue, setWoValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const normalizedTitle = title.trim();
    const normalizedAgencyName = agencyName.trim();
    const normalizedAgencyType = agencyType.trim();
    const normalizedScope = scope.trim();
    const parsedWoValue = Number(woValue);

    if (!normalizedTitle) { setError('Work order name is required.'); return; }
    if (!normalizedAgencyName) { setError('Agency name is required.'); return; }
    if (woValue.trim() && (!Number.isFinite(parsedWoValue) || parsedWoValue < 0)) {
      setError('WO value must be a valid non-negative number.');
      return;
    }

    setSaving(true); setError(null);

    const maxSeq = project.seq_no;
    const { data: existingWOs, error: woCountError } = await supabase
      .from('work_orders')
      .select('seq_no')
      .eq('project_id', project.id);
    if (woCountError) {
      console.error('Work order sequence lookup failed', woCountError);
      setError('Could not prepare the work order number. Please try again.');
      setSaving(false);
      return;
    }

    const nextSubSeq = (existingWOs?.length ?? 0) + 1;
    const seqNo = `${maxSeq}.${nextSubSeq}.0`;

    const { data: woData, error: woError } = await supabase.from('work_orders').insert({
      project_id: project.id,
      seq_no: seqNo,
      title: title.trim(),
      code: `${project.code}-WO${nextSubSeq}`,
      manager: project.manager,
      state: project.state,
      district: project.district,
      category: project.category,
      subcategory: project.subcategory,
      target_pct: 0,
      completed_pct: 0,
      delay_status: 'On Time',
      qty_deviations: 0,
      spec_deviations: 0,
      extension_days: 0,
      project_value: woValue.trim() ? parsedWoValue : 0,
      mbook_entry: 0,
      billed_amount: 0,
      paid_amount: 0,
      start_date: project.start_date,
      end_date: null,
    }).select();

    if (woError || !woData || woData.length === 0) {
      console.error('Work order insert failed', woError);
      setError('Could not create the work order. Please check the values and try again.');
      setSaving(false);
      return;
    }

    const woId = woData[0].id;
    const { error: detailError } = await supabase.from('work_order_details').insert({
      work_order_id: woId,
      agency_name: normalizedAgencyName,
      agency_type: normalizedAgencyType || null,
      scope: normalizedScope || null,
      wo_value: woValue.trim() ? parsedWoValue : 0,
      nodal_officer: null,
      start_date: project.start_date,
      end_date: null,
      status: 'draft',
    });

    if (detailError) {
      console.error('Agency details insert failed', detailError);
      setError('The work order was created, but the agency details could not be saved. Please try again.');
      setSaving(false);
      return;
    }

    sessionStorage.removeItem('pms_data_v8');
    setSaving(false);
    onCreated();
  };

  const inputClass = 'w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition-colors';
  const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-3">
          <h2 className="text-base font-bold text-white">Create Agency / Work Order</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-5">
          {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
          <div>
            <label className={labelClass}>Work Order Name *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Civil Construction Package A" />
          </div>
          <div>
            <label className={labelClass}>Agency Name *</label>
            <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className={inputClass} placeholder="e.g. L&T Construction" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Agency Type</label>
              <input type="text" value={agencyType} onChange={(e) => setAgencyType(e.target.value)} className={inputClass} placeholder="e.g. Contractor" />
            </div>
            <div>
              <label className={labelClass}>WO Value (₹ Lakhs)</label>
              <input type="number" value={woValue} onChange={(e) => setWoValue(e.target.value)} className={inputClass} placeholder="0" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Scope</label>
            <textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={2} className={inputClass} placeholder="Brief scope of work..." />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button onClick={onClose} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-1.5 rounded bg-cyan-700 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create
          </button>
        </div>
      </div>
    </div>
  );
}

type DisciplineChartPoint = {
  name: string;
  value: number;
  color: string;
  itemCount: number;
  cat1Completed: number;
  cat1Total: number;
  cat2Completed: number;
  cat2Total: number;
  cat3Completed: number;
  cat3Total: number;
  totalCompleted: number;
  totalDrawings: number;
};

function DisciplineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DisciplineChartPoint }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] shadow-lg">
      <div className="mb-1.5 font-bold text-slate-800">{point.name}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
        <span>Items</span><strong className="text-right text-slate-800">{point.itemCount}</strong>
        <span>Category 1</span><strong className="text-right text-slate-800">{point.cat1Completed}/{point.cat1Total}</strong>
        <span>Category 2</span><strong className="text-right text-slate-800">{point.cat2Completed}/{point.cat2Total}</strong>
        <span>Category 3</span><strong className="text-right text-slate-800">{point.cat3Completed}/{point.cat3Total}</strong>
        <span>Completed</span><strong className="text-right text-emerald-700">{point.totalCompleted}</strong>
        <span>Total</span><strong className="text-right text-slate-800">{point.totalDrawings}</strong>
        <span>Progress</span><strong className="text-right text-cyan-700">{point.value.toFixed(1)}%</strong>
      </div>
    </div>
  );
}

function ProjectDrawingStatus({
  workOrders,
  sections,
  drawingProgress,
}: {
  workOrders: WorkOrder[];
  sections: WOSection[];
  drawingProgress: WODrawingProgress[];
}) {
  const summary = useMemo(
    () => aggregateDrawingStatus(sections, drawingProgress, workOrders, { onlyApproved: true }),
    [sections, drawingProgress, workOrders],
  );

  const [statusChartType, setStatusChartType] = useState<'bar' | 'pie'>('bar');
  const [disciplineChartType, setDisciplineChartType] = useState<'bar' | 'pie'>('bar');

  const statusData = useMemo(() => [
    { name: 'Total', value: summary.totalDrawings, color: '#1e40af' },
    { name: 'Completed', value: summary.totalCompleted, color: '#059669' },
    { name: 'Pending', value: Math.max(0, summary.totalDrawings - summary.totalCompleted), color: '#d97706' },
  ], [summary]);

  const chartData = useMemo(
    () => summary.byDiscipline.map((d, idx) => ({
      name: d.discipline,
      value: Number(d.progressPct.toFixed(1)),
      color: CHART_COLORS[idx % CHART_COLORS.length],
      itemCount: d.itemCount,
      cat1Completed: d.cat1Completed,
      cat1Total: d.cat1Total,
      cat2Completed: d.cat2Completed,
      cat2Total: d.cat2Total,
      cat3Completed: d.cat3Completed,
      cat3Total: d.cat3Total,
      totalCompleted: d.totalCompleted,
      totalDrawings: d.totalDrawings,
    })),
    [summary],
  );

  const renderStatusBar = () => (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={statusData} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 2" className="stroke-slate-100" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 600 }} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 8 }} width={28} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28} maxBarSize={36}>
          {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderStatusPie = () => (
    <ResponsiveContainer width="100%" height={120}>
      <PieChart>
        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={42} innerRadius={20} label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`} labelLine={false}>
          {statusData.map((d) => <Cell key={d.name} fill={d.color} stroke="#fff" strokeWidth={1} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderDisciplineBar = () => (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 2" className="stroke-slate-100" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 600 }} angle={-15} textAnchor="end" height={28} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} tickFormatter={(v) => `${v}%`} width={30} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(8,145,178,0.05)' }} content={<DisciplineTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28} maxBarSize={36}>
          {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderDisciplinePie = () => (
    <ResponsiveContainer width="100%" height={120}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={42} innerRadius={20} label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}%`} labelLine={false}>
          {chartData.map((d) => <Cell key={d.name} fill={d.color} stroke="#fff" strokeWidth={1} />)}
        </Pie>
        <Tooltip content={<DisciplineTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const chartButtons = (type: 'bar' | 'pie', setType: (value: 'bar' | 'pie') => void) => (
    <div className="flex items-center gap-0.5">
      <button onClick={() => setType('bar')} className={`rounded p-0.5 ${type === 'bar' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}>
        <BarChart3 className="h-3 w-3" />
      </button>
      <button onClick={() => setType('pie')} className={`rounded p-0.5 ${type === 'pie' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}>
        <PieChartIcon className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <div className="p-2">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
        <div>
          <h3 className="text-xs font-semibold text-slate-700">Project-level Drawing Status</h3>
          <p className="text-[9px] font-medium text-slate-500">Auto-consolidated from approved Work Order drawing items.</p>
        </div>
        <span className="rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold text-cyan-800">{summary.progressPct.toFixed(1)}% complete</span>
      </div>

      {summary.byDiscipline.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400">No approved drawing items yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="mirror-card rounded border-t-2 border-t-cyan-600 p-2">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-700">Drawing Status</h4>
                <p className="text-[9px] font-medium text-slate-500">Total, completed, and pending drawings</p>
              </div>
              {chartButtons(statusChartType, setStatusChartType)}
            </div>
            {statusChartType === 'bar' ? renderStatusBar() : renderStatusPie()}
          </div>
          <div className="mirror-card rounded border-t-2 border-t-cyan-600 p-2">
            <div className="mb-1 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-700">Progress by Discipline</h4>
              {chartButtons(disciplineChartType, setDisciplineChartType)}
            </div>
            {disciplineChartType === 'bar' ? renderDisciplineBar() : renderDisciplinePie()}
          </div>
        </div>
      )}
    </div>
  );
}
