export type DelayStatus = 'On Time' | 'Delayed - Warning' | 'Delayed - Serious' | 'Delayed - Critical';

export type Level = 'project' | 'wo' | 'schedule' | 'tracking';

export type ViewType = 'chart' | 'tile' | 'table' | 'card';

export interface BaseEntity {
  id: string;
  seq_no: string;
  title: string;
  code: string;
  manager: string;
  state: string;
  district: string;
  category: string;
  subcategory: string;
  target_pct: number;
  completed_pct: number;
  delay_status: DelayStatus;
  qty_deviations: number;
  spec_deviations: number;
  extension_days: number;
  mbook_entry: number;
  billed_amount: number;
  paid_amount: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Project extends BaseEntity {
  description: string | null;
  remarks: string | null;
  duration_days: number | null;
}

export interface ProjectFormData {
  title: string;
  description: string;
  state: string;
  district: string;
  category: string;
  subcategory: string;
  start_date: string;
  duration_days: string;
  mbook_entry: string;
  manager: string;
  remarks: string;
}

export interface WorkOrder extends BaseEntity {
  project_id: string;
}

export interface Schedule extends BaseEntity {
  work_order_id: string;
}

export interface TrackingEntry {
  id: string;
  schedule_id: string;
  seq_no: string;
  title: string;
  site_officer: string;
  measurement_date: string | null;
  completion_tag: string;
  mbook_entry: number;
  billed_amount: number;
  paid_amount: number;
  created_at: string;
}

export interface Spec {
  id: string;
  level: Level;
  parent_id: string;
  spec_code: string;
  description: string;
  unit: string;
  estimated_qty: number;
  executed_qty: number;
  rate: number;
  amount: number;
  measurement_date: string | null;
  has_attachment: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  officer: string;
  details: string;
  revision: string;
}

export interface Filters {
  states: string[];
  districts: string[];
  categories: string[];
  subcategories: string[];
  delayStatuses: DelayStatus[];
  startMonth: string;
  endMonth: string;
}

export type TrackingType = 'delay' | 'quantity' | 'delivery' | 'spec' | 'price';

export interface TrackingUpdate {
  id: string;
  project_id: string;
  tracking_type: TrackingType;
  deviation_value: string;
  officer_name: string;
  remarks: string;
  created_at: string;
}

export interface DashboardData {
  projects: Project[];
  workOrders: WorkOrder[];
  schedules: Schedule[];
  trackingEntries: TrackingEntry[];
  specs: Spec[];
  trackingUpdates: TrackingUpdate[];
}
