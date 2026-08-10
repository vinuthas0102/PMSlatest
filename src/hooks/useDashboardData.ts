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
  TrackingUpdate,
  WorkOrderDetail,
  WOSection,
  PaymentEntry,
  DPREntry,
  Amendment,
} from '@/types';

const LOADING_KEY = 'pms_data_v8';

const SPECS_PAGE_SIZE = 1000;

async function fetchAllSpecs(): Promise<Spec[]> {
  const all: Spec[] = [];
  let from = 0;
  while (true) {
    const res = await supabase
      .from('specs')
      .select('*')
      .order('level, spec_code')
      .range(from, from + SPECS_PAGE_SIZE - 1);
    if (res.error) throw res.error;
    const rows = (res.data as Spec[]) ?? [];
    all.push(...rows);
    if (rows.length < SPECS_PAGE_SIZE) break;
    from += SPECS_PAGE_SIZE;
  }
  return all;
}

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
        const cachedData = JSON.parse(cached) as Partial<DashboardData>;
        setData({
          projects: cachedData.projects ?? [],
          workOrders: cachedData.workOrders ?? [],
          schedules: cachedData.schedules ?? [],
          trackingEntries: cachedData.trackingEntries ?? [],
          specs: cachedData.specs ?? [],
          trackingUpdates: cachedData.trackingUpdates ?? [],
          workOrderDetails: cachedData.workOrderDetails ?? [],
          woSections: cachedData.woSections ?? [],
          paymentEntries: cachedData.paymentEntries ?? [],
          dprEntries: cachedData.dprEntries ?? [],
          amendments: cachedData.amendments ?? [],
        });
        setLoading(false);
        return;
      }

      const [projRes, woRes, schedRes, trkRes, allSpecs, trackingUpdatesRes, woDetailsRes, woSectionsRes, paymentsRes, dprRes, amendmentsRes] = await Promise.all([
        supabase.from('projects').select('*').order('seq_no'),
        supabase.from('work_orders').select('*').order('seq_no'),
        supabase.from('schedules').select('*').order('seq_no'),
        supabase.from('tracking_entries').select('*').order('seq_no'),
        fetchAllSpecs(),
        supabase.from('project_tracking_updates').select('*').order('created_at', { ascending: false }),
        supabase.from('work_order_details').select('*').order('created_at', { ascending: false }),
        supabase.from('wo_sections').select('*').order('created_at', { ascending: false }),
        supabase.from('payment_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('dpr_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('amendments').select('*').order('created_at', { ascending: false }),
      ]);

      if (projRes.error) throw projRes.error;
      if (woRes.error) throw woRes.error;
      if (schedRes.error) throw schedRes.error;
      if (trkRes.error) throw trkRes.error;
      if (trackingUpdatesRes.error) throw trackingUpdatesRes.error;
      if (woDetailsRes.error) throw woDetailsRes.error;
      if (woSectionsRes.error) throw woSectionsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (dprRes.error) throw dprRes.error;
      if (amendmentsRes.error) throw amendmentsRes.error;

      const dashboardData: DashboardData = {
        projects: (projRes.data as Project[]) ?? [],
        workOrders: (woRes.data as WorkOrder[]) ?? [],
        schedules: (schedRes.data as Schedule[]) ?? [],
        trackingEntries: (trkRes.data as TrackingEntry[]) ?? [],
        specs: allSpecs,
        trackingUpdates: (trackingUpdatesRes.data as TrackingUpdate[]) ?? [],
        workOrderDetails: (woDetailsRes.data as WorkOrderDetail[]) ?? [],
        woSections: (woSectionsRes.data as WOSection[]) ?? [],
        paymentEntries: (paymentsRes.data as PaymentEntry[]) ?? [],
        dprEntries: (dprRes.data as DPREntry[]) ?? [],
        amendments: (amendmentsRes.data as Amendment[]) ?? [],
      };
      sessionStorage.setItem(LOADING_KEY, JSON.stringify(dashboardData));
      setData(dashboardData);
    } catch (e) {
      // Never surface the underlying database error to the interface: its text
      // discloses table names, column names, constraints and policy behaviour.
      console.error('Dashboard data load failed', e);
      setError('We could not load the dashboard data. Please try again.');
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
