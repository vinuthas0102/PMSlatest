import { supabase } from '@/lib/supabase';
import type { LifecycleAction, LifecycleStatus, LifecycleTargetType } from '@/types';

export const LIFECYCLE_STATUS_LABEL: Record<LifecycleStatus, string> = {
  active: 'Active',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const LIFECYCLE_STATUS_BADGE: Record<LifecycleStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-300',
  completed: 'bg-blue-100 text-blue-700 border-blue-300',
};

export const LIFECYCLE_ACTION_LABEL: Record<LifecycleAction, string> = {
  cancel: 'Cancel',
  reinstate: 'Reinstate',
  complete: 'Mark Complete',
};

export const ACTION_TO_STATUS: Record<LifecycleAction, LifecycleStatus> = {
  cancel: 'cancelled',
  reinstate: 'active',
  complete: 'completed',
};

export async function performLifecycleAction(params: {
  targetType: LifecycleTargetType;
  targetId: string;
  action: LifecycleAction;
  reason: string;
  performedBy: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const { targetType, targetId, action, reason, performedBy } = params;
  const trimmedReason = reason.trim();
  if (!trimmedReason) return { success: false, error: 'A reason is required.' };

  const table = targetType === 'project' ? 'projects' : 'work_order_details';
  const matchColumn = targetType === 'project' ? 'id' : 'work_order_id';
  const newStatus = ACTION_TO_STATUS[action];

  const { error: updateError } = await supabase
    .from(table)
    .update({ lifecycle_status: newStatus })
    .eq(matchColumn, targetId);

  if (updateError) {
    return { success: false, error: 'Could not update the lifecycle status.' };
  }

  const { error: eventError } = await supabase.from('lifecycle_events').insert({
    target_type: targetType,
    target_id: targetId,
    action,
    reason: trimmedReason,
    performed_by: performedBy,
  });

  if (eventError) {
    return { success: false, error: 'Status updated, but the audit record could not be saved.' };
  }

  return { success: true };
}
