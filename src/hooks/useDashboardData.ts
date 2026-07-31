import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  DashboardData,
  Project,
  WorkOrder,
  Schedule,
  TrackingEntry,
  Spec,
  AuditLogEntry,
} from '@/types';

const LOADING_KEY = 'pms_data_v3';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = sessionStorage.getItem(LOADING_KEY);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const [projRes, woRes, schedRes, trkRes, specRes] = await Promise.all([
        supabase.from('projects').select('*').order('seq_no'),
        supabase.from('work_orders').select('*').order('seq_no'),
        supabase.from('schedules').select('*').order('seq_no'),
        supabase.from('tracking_entries').select('*').order('seq_no'),
        supabase.from('specs').select('*').order('level, spec_code'),
      ]);

      if (projRes.error) throw projRes.error;
      if (woRes.error) throw woRes.error;
      if (schedRes.error) throw schedRes.error;
      if (trkRes.error) throw trkRes.error;
      if (specRes.error) throw specRes.error;

      const dashboardData: DashboardData = {
        projects: (projRes.data as Project[]) ?? [],
        workOrders: (woRes.data as WorkOrder[]) ?? [],
        schedules: (schedRes.data as Schedule[]) ?? [],
        trackingEntries: (trkRes.data as TrackingEntry[]) ?? [],
        specs: (specRes.data as Spec[]) ?? [],
      };
      sessionStorage.setItem(LOADING_KEY, JSON.stringify(dashboardData));
      setData(dashboardData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function generateAuditLog(tracking: TrackingEntry): AuditLogEntry[] {
  const logs: AuditLogEntry[] = [];
  const baseDate = tracking.measurement_date ? new Date(tracking.measurement_date) : new Date();

  logs.push({
    id: '1',
    timestamp: new Date(baseDate.getTime() - 86400000 * 14).toISOString(),
    action: 'MBook Entry Submitted',
    officer: tracking.site_officer,
    details: `Measurement book entry created for ${tracking.seq_no}`,
    revision: 'Rev 0',
  });
  logs.push({
    id: '2',
    timestamp: new Date(baseDate.getTime() - 86400000 * 12).toISOString(),
    action: 'Initial Review',
    officer: 'K. Supervisor',
    details: 'Site inspection conducted, quantities verified against drawings',
    revision: 'Rev 0',
  });
  logs.push({
    id: '3',
    timestamp: new Date(baseDate.getTime() - 86400000 * 10).toISOString(),
    action: 'Revision Requested',
    officer: 'J. Officer',
    details: 'Quantity deviation noted in concrete pour - revision requested',
    revision: 'Rev 1',
  });
  logs.push({
    id: '4',
    timestamp: new Date(baseDate.getTime() - 86400000 * 7).toISOString(),
    action: 'MBook Resubmitted',
    officer: tracking.site_officer,
    details: 'Revised measurement book submitted with corrected quantities',
    revision: 'Rev 1',
  });
  logs.push({
    id: '5',
    timestamp: new Date(baseDate.getTime() - 86400000 * 5).toISOString(),
    action: 'Approval Granted',
    officer: 'R. Sharma - Executive Engineer',
    details: 'Digital signature affixed, entry approved for billing',
    revision: 'Rev 1',
  });
  logs.push({
    id: '6',
    timestamp: new Date(baseDate.getTime() - 86400000 * 3).toISOString(),
    action: 'Bill Processed',
    officer: 'Accounts Section',
    details: `Interim bill raised for ₹${tracking.billed_amount.toFixed(1)} Lakhs`,
    revision: 'Rev 1',
  });

  return logs;
}
