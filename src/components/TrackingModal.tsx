import { useState, useMemo, useRef, useCallback } from 'react';
import {
  X, Clock, AlertTriangle, Ruler, Truck, FileText, TrendingUp,
  Bold, Italic, Underline, Save, Loader2, User, CalendarClock,
} from 'lucide-react';
import type { BaseEntity, TrackingUpdate, TrackingType } from '@/types';
import { delayStatusColor, delayStatusShort, DELAY_STATUSES } from '@/lib/format';

interface TrackingModalProps {
  item: BaseEntity;
  updates: TrackingUpdate[];
  onClose: () => void;
  onSave: (entry: {
    project_id: string;
    tracking_type: TrackingType;
    deviation_value: string;
    officer_name: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const TABS: { key: TrackingType; label: string; icon: typeof Clock; color: string }[] = [
  { key: 'delay', label: 'Track Delay', icon: Clock, color: 'text-rose-600' },
  { key: 'quantity', label: 'Quantity Deviation', icon: Ruler, color: 'text-orange-600' },
  { key: 'delivery', label: 'Schedule Deviation', icon: Truck, color: 'text-amber-600' },
  { key: 'spec', label: 'Spec Deviation', icon: FileText, color: 'text-cyan-600' },
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

export function TrackingModal({ item, updates, onClose, onSave }: TrackingModalProps) {
  const [activeTab, setActiveTab] = useState<TrackingType>('delay');
  const [delayStatus, setDelayStatus] = useState<string>(item.delay_status);
  const [deviationPct, setDeviationPct] = useState<number>(0);
  const [officerName, setOfficerName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const colors = delayStatusColor(item.delay_status);

  const tabUpdates = useMemo(
    () => updates.filter((u) => u.project_id === item.id && u.tracking_type === activeTab),
    [updates, item.id, activeTab]
  );

  const resetEditor = useCallback(() => {
    if (editorRef.current) editorRef.current.innerHTML = '';
  }, []);

  const handleTabChange = (tab: TrackingType) => {
    setActiveTab(tab);
    setError(null);
    resetEditor();
  };

  const execCommand = (cmd: string) => {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!officerName.trim()) {
      setError('Officer name is required.');
      return;
    }
    const remarksHtml = editorRef.current?.innerHTML.trim() ?? '';
    if (!remarksHtml || remarksHtml === '<br>' || remarksHtml === '<div><br></div>') {
      setError('Please enter remarks explaining this update.');
      return;
    }

    setSaving(true);
    setError(null);

    const dv = activeTab === 'delay' ? delayStatus : `${deviationPct}%`;

    const result = await onSave({
      project_id: item.id,
      tracking_type: activeTab,
      deviation_value: dv,
      officer_name: officerName.trim(),
      remarks: remarksHtml,
    });

    setSaving(false);

    if (result.success) {
      resetEditor();
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 2500);
    } else {
      setError(result.error ?? 'Could not save the tracking update.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark header banner */}
        <div className="shrink-0 overflow-hidden rounded-t-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
                <AlertTriangle className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white">Project Tracking Maintenance</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                    {item.seq_no}
                  </span>
                  <span className="truncate text-[11px] text-slate-300">{item.title}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-[11px] text-slate-400">{item.state} · {item.district}</span>
                  {item.manager && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="text-[11px] text-slate-400">Mgr: {item.manager}</span>
                    </>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                    {delayStatusShort(item.delay_status)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-400'}`} />
                {tab.label}
                {tabUpdates.length > 0 && tab.key === activeTab && (
                  <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                    {tabUpdates.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body: two-column layout */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: input form */}
            <div className="p-5 border-r border-slate-200">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                New Entry
              </h3>

              {successFlash && (
                <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                  <Save className="w-4 h-4 shrink-0" />
                  Update saved successfully.
                </div>
              )}
              {error && (
                <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Deviation field */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  {activeTab === 'delay' ? 'Delay Status' : 'Deviation Level'}
                </label>
                {activeTab === 'delay' ? (
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
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => execCommand('bold')}
                      className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('italic')}
                      className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('underline')}
                      className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[100px] max-h-[200px] overflow-y-auto px-3 py-2 text-xs text-slate-700 outline-none prose-sm"
                    data-placeholder="Enter detailed remarks about this tracking update..."
                    style={{ emptyState: 'show' }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-700 rounded-lg hover:bg-cyan-800 transition-colors disabled:opacity-60 w-full justify-center"
              >
                {saving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Save Tracking Update</>
                )}
              </button>
            </div>

            {/* Right: history */}
            <div className="p-5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Update History
                </h3>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {tabUpdates.length} {tabUpdates.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {tabUpdates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">
                    No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} updates recorded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tabUpdates.map((u) => {
                    const tabMeta = TABS.find((t) => t.key === u.tracking_type);
                    const Icon = tabMeta?.icon ?? Clock;
                    return (
                      <div
                        key={u.id}
                        className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${tabMeta?.color ?? 'text-slate-400'}`} />
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {u.deviation_value}
                            </span>
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
                        <div
                          className="text-xs text-slate-700 prose-sm max-w-none [&_b]:font-bold [&_i]:italic [&_u]:underline"
                          dangerouslySetInnerHTML={{ __html: u.remarks }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
