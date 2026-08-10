-- Add project_value column to work_orders table
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS project_value numeric DEFAULT 0;

-- Update existing work orders with project_value from their mbook_entry as a reasonable default
UPDATE work_orders SET project_value = mbook_entry WHERE project_value = 0 OR project_value IS NULL;

-- Seed work_order_details for existing work orders on project 1.0.0 (Bengaluru Outer Ring Road Flyover)
INSERT INTO work_order_details (work_order_id, agency_name, agency_type, scope, wo_value, payment_terms, nodal_officer, start_date, end_date, status)
VALUES
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 'L&T Construction Ltd', 'EPC Contractor', 'Civil structure works including pier construction, deck slab, and approach structures for the ORR flyover', 1200.00, 'Monthly billing against progress', 'N. Verma', '2024-01-15', '2025-06-30', 'draft'),
  ('aafeac52-3307-4207-b0d8-b637d7e49943', 'Bridgepoint Infra', 'Subcontractor', 'Approach road construction, signage installation, and road marking works', 800.00, 'Milestone-based payment', 'N. Verma', '2024-03-01', '2025-08-31', 'draft')
ON CONFLICT DO NOTHING;

-- Seed wo_sections for the first work order (Civil Structure Works)
INSERT INTO wo_sections (work_order_id, section_type, discipline, item_code, description, unit, required_qty, executed_qty, cat1_total, cat2_total, cat3_total, skilled_count, unskilled_count, target_deployment, value, certificate_name, has_certificate)
VALUES
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 'civil', 'Structural', 'CIV-001', 'Pile foundation concrete M30 grade', 'Cum', 450.00, 380.00, 380.00, 0.00, 0.00, 12, 20, '15 skilled + 20 unskilled', 180.00, 'Concrete Pour Certificate', true),
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 'civil', 'Structural', 'CIV-002', 'Reinforcement steel TMT bars Fe500', 'MT', 85.00, 72.00, 72.00, 0.00, 0.00, 8, 10, '8 skilled + 10 unskilled', 120.00, 'Steel Test Certificate', true),
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 'structural', 'Bridge', 'STR-001', 'Pier cap construction and bearing installation', 'Nos', 12.00, 8.00, 8.00, 0.00, 0.00, 6, 8, '6 skilled + 8 unskilled', 95.00, null, false),
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 'structural', 'Bridge', 'STR-002', 'Deck slab casting and curing', 'Sqm', 1200.00, 840.00, 840.00, 0.00, 0.00, 10, 15, '10 skilled + 15 unskilled', 150.00, 'Curing Certificate', true)
ON CONFLICT DO NOTHING;

-- Seed wo_sections for the second work order (Approach Road & Signage)
INSERT INTO wo_sections (work_order_id, section_type, discipline, item_code, description, unit, required_qty, executed_qty, cat1_total, cat2_total, cat3_total, skilled_count, unskilled_count, target_deployment, value, certificate_name, has_certificate)
VALUES
  ('aafeac52-3307-4207-b0d8-b637d7e49943', 'road', 'Civil', 'RD-001', 'Approach road earthwork and compaction', 'Cum', 5000.00, 3300.00, 3300.00, 0.00, 0.00, 5, 15, '5 skilled + 15 unskilled', 80.00, 'Compaction Test Certificate', true),
  ('aafeac52-3307-4207-b0d8-b637d7e49943', 'road', 'Civil', 'RD-002', 'Bituminous concrete laying', 'Sqm', 8000.00, 5280.00, 5280.00, 0.00, 0.00, 4, 8, '4 skilled + 8 unskilled', 110.00, 'Bitumen Quality Certificate', true),
  ('aafeac52-3307-4207-b0d8-b637d7e49943', 'signage', 'Electrical', 'SGN-001', 'Road signage and markings', 'Nos', 120.00, 79.00, 79.00, 0.00, 0.00, 3, 5, '3 skilled + 5 unskilled', 45.00, null, false)
ON CONFLICT DO NOTHING;

-- Seed payment_entries for the first work order
INSERT INTO payment_entries (work_order_id, amount_paid, cumulative_paid, payment_date, remarks, created_by)
VALUES
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 200.00, 200.00, '2024-03-15', 'Mobilization advance payment', 'N. Verma'),
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 250.00, 450.00, '2024-05-20', 'First interim bill - pile foundation', 'N. Verma'),
  ('28d1b6db-ed70-41f3-8be0-93c0d630b0ac', 200.00, 650.00, '2024-08-10', 'Second interim bill - pier construction', 'N. Verma')
ON CONFLICT DO NOTHING;

-- Seed payment_entries for the second work order
INSERT INTO payment_entries (work_order_id, amount_paid, cumulative_paid, payment_date, remarks, created_by)
VALUES
  ('aafeac52-3307-4207-b0d8-b637d7e49943', 150.00, 150.00, '2024-05-01', 'Mobilization advance', 'N. Verma'),
  ('aafeac52-3307-4207-b0d8-b637d7e49943', 150.00, 300.00, '2024-07-15', 'First interim bill - earthwork', 'N. Verma'),
  ('aafeac52-3307-4207-b0d8-b637d7e49943', 100.00, 400.00, '2024-10-05', 'Second interim bill - bituminous laying', 'N. Verma')
ON CONFLICT DO NOTHING;

-- Seed project_tracking_updates for the project
INSERT INTO project_tracking_updates (project_id, tracking_type, deviation_value, officer_name, remarks)
VALUES
  ('97478ef9-4d22-4a22-aaed-6cf9522d1709', 'delay', 'Delayed - Warning', 'R. Sharma', '<b>15-day extension requested</b> due to monsoon-related disruption in pile foundation work. Revised completion date proposed.'),
  ('97478ef9-4d22-4a22-aaed-6cf9522d1709', 'quantity', '15%', 'S. Singh', '<i>Quantity deviation</i> in concrete pour - actual 380 Cum vs estimated 450 Cum. Additional pour scheduled.'),
  ('97478ef9-4d22-4a22-aaed-6cf9522d1709', 'spec', '1', 'R. Sharma', 'Specification deviation: TMT bar grade changed from Fe500 to Fe550D per site revision note.')
ON CONFLICT DO NOTHING;
