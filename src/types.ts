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
  project_value: number;
  mbook_entry: number;
  billed_amount: number;
  paid_amount: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export type ProjectType = 'EPC' | 'PMC';
export type ProjectStatus = 'draft' | 'finalized';

export interface Project extends BaseEntity {
  description: string | null;
  remarks: string | null;
  duration_days: number | null;
  project_type: ProjectType;
  project_code: string | null;
  segment_id: string | null;
  client_name: string | null;
  contract_type_id: string | null;
  scheme_id: string | null;
  tender_ref_number: string | null;
  site_city: string | null;
  region_id: string | null;
  site_address_a: string | null;
  site_address_b: string | null;
  pin_code: string | null;
  engineer_incharge_id: string | null;
  phone_number: string | null;
  email_id: string | null;
  work_category_id: string | null;
  workorder_value: number;
  security_deposit: number;
  sd_bg_number: string | null;
  sd_bg_valid_from: string | null;
  sd_bg_valid_to: string | null;
  claim_period_upto: string | null;
  status: ProjectStatus;
  drawing_pct: number;
  supply_pct: number;
  civil_pct: number;
  manpower_pct: number;
  others_pct: number;
}

export interface ProjectFormData {
  title: string;
  description: string;
  project_type: ProjectType;
  project_code: string;
  segment_id: string;
  client_name: string;
  contract_type_id: string;
  scheme_id: string;
  tender_ref_number: string;
  state: string;
  district: string;
  site_city: string;
  region_id: string;
  site_address_a: string;
  site_address_b: string;
  pin_code: string;
  category: string;
  subcategory: string;
  work_category_id: string;
  start_date: string;
  duration_days: string;
  project_value: string;
  workorder_value: string;
  mbook_entry: string;
  security_deposit: string;
  sd_bg_number: string;
  sd_bg_valid_from: string;
  sd_bg_valid_to: string;
  claim_period_upto: string;
  engineer_incharge_id: string;
  phone_number: string;
  email_id: string;
  manager: string;
  remarks: string;
  drawing_pct: string;
  supply_pct: string;
  civil_pct: string;
  manpower_pct: string;
  others_pct: string;
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

export interface WorkOrderDetail {
  id: string;
  work_order_id: string;
  agency_name: string;
  agency_type: string;
  scope: string;
  wo_value: number;
  payment_terms: string | null;
  nodal_officer: string | null;
  work_order_number: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface WOSection {
  id: string;
  work_order_id: string;
  section_type: string;
  discipline: string | null;
  item_code: string | null;
  description: string | null;
  unit: string | null;
  start_date: string | null;
  end_date: string | null;
  required_qty: number;
  executed_qty: number;
  cat1_total: number;
  cat2_total: number;
  cat3_total: number;
  skilled_count: number;
  unskilled_count: number;
  target_deployment: string | null;
  value: number;
  certificate_name: string | null;
  has_certificate: boolean;
  approval_status: 'draft' | 'pending_approval' | 'approved';
  defined_by: string | null;
  submitted_by: string | null;
  approved_by: string | null;
  approved_role: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approval_remarks: string | null;
  created_at: string;
}

export interface WOSectionProgress {
  id: string;
  work_order_id: string;
  section_id: string;
  entry_date: string;
  progress_value: number;
  progress_unit: string | null;
  status: string;
  remarks: string | null;
  created_by: string | null;
  created_role: string | null;
  created_at: string;
}

export interface WOSectionDocument {
  id: string;
  work_order_id: string;
  section_id: string;
  document_name: string;
  description: string | null;
  is_mandatory: boolean;
  status: 'not_submitted' | 'submitted' | 'accepted' | 'returned';
  file_name: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_remarks: string | null;
  created_at: string;
}

export interface WOSectionActivity {
  id: string;
  work_order_id: string;
  section_id: string;
  action: string;
  actor_name: string | null;
  actor_role: string | null;
  details: string | null;
  created_at: string;
}

export interface PaymentEntry {
  id: string;
  work_order_id: string;
  section_id: string | null;
  amount_paid: number;
  cumulative_paid: number;
  payment_date: string;
  vendor_invoice_number: string | null;
  vendor_invoice_date: string | null;
  voucher_number: string | null;
  voucher_date: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WODrawingProgress {
  id: string;
  work_order_id: string;
  section_id: string;
  entry_date: string;
  cat1_completed: number;
  cat2_completed: number;
  cat3_completed: number;
  total_completed: number;
  progress_pct: number;
  remarks: string | null;
  created_by: string | null;
  created_role: string | null;
  created_at: string;
}

export interface Amendment {
  id: string;
  project_id: string | null;
  work_order_id: string | null;
  amendment_type: string;
  reason: string;
  requested_by: string;
  revised_value: number | null;
  approval_doc_name: string | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  noting_entries: string | null;
  created_at: string;
}

export interface DashboardData {
  projects: Project[];
  workOrders: WorkOrder[];
  schedules: Schedule[];
  trackingEntries: TrackingEntry[];
  specs: Spec[];
  trackingUpdates: TrackingUpdate[];
  workOrderDetails: WorkOrderDetail[];
  woSections: WOSection[];
  paymentEntries: PaymentEntry[];
  amendments: Amendment[];
  woSectionProgress: WOSectionProgress[];
  woSectionDocuments: WOSectionDocument[];
  woSectionActivity: WOSectionActivity[];
  woDrawingProgress: WODrawingProgress[];
}
