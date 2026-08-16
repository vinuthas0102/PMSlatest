import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import type { LifecycleAction, LifecycleEvent, LifecycleTargetType } from '@/types';
import { LIFECYCLE_ACTION_LABEL, performLifecycleAction } from '@/lib/lifecycle';

interface LifecycleActionPanelProps {
  open: boolean;
  action: LifecycleAction | null;
  targetType: LifecycleTargetType;
  targetId: string;
  targetLabel: string;
  performedBy: string | null;
  events: LifecycleEvent[];
  onClose: () => void;
  onDone: () => Promise<void>;
}

export function LifecycleActionPanel({
  open, action, targetType, targetId, targetLabel, performedBy, events, onClose, onDone,
}: LifecycleActionPanelProps) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
      setSaving(false);
    }
  }, [open, action]);

  if (!open || !action) return null;

  const actionLabel = LIFECYCLE_ACTION_LABEL[action];

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please enter a reason for this action.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await performLifecycleAction({
      targetType,
      targetId,
      action,
      reason,
      performedBy,
    });
    setSaving(false);
    if (result.success) {
      await onDone();
      onClose();
    } else {
      setError(result.error ?? 'Could not perform this action.');
    }
  };

  const accent =
    action === 'cancel'
      ? 'from-rose-600 to-red-700'
      : action === 'reinstate'
        ? 'from-emerald-600 to-green-700'
        : 'from-blue-600 to-indigo-700';

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity" />
      <div
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between bg-gradient-to-r ${accent} px-5 py-4`}>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-white">{actionLabel}</h2>
            <p className="truncate text-[11px] text-white/80">{targetLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Reason for {actionLabel} *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              autoFocus
              placeholder={`Explain why this item is being ${action === 'cancel' ? 'cancelled' : action === 'reinstate' ? 'reinstated' : 'marked complete'}...`}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-200"
            />
          </div>

          {events.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Lifecycle History
              </h3>
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {LIFECYCLE_ACTION_LABEL[ev.action]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{ev.reason}</p>
                    {ev.performed_by && (
                      <p className="mt-0.5 text-[10px] text-slate-400">by {ev.performed_by}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className={`flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${accent} px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Confirm {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
