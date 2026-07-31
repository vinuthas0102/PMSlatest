/*
# Seed new all-India branch data + richer WO specs

1. Purpose
   Expands the dashboard to cover the department's branches across India by seeding
   projects, work orders, schedules, tracking entries, and specs for six new states:
   Assam, Delhi, Gujarat, Odisha, Andhra Pradesh, and Uttar Pradesh. Also enriches
   every existing work order with additional spec line items (6-8 items each).

2. New data
   - 6 new projects (seq 9.0.0 - 14.0.0), one per new state.
   - 12 new work orders (2 per new project).
   - 24 new schedules (2 per new WO).
   - 72 new tracking entries (3 per new schedule).
   - 84 new WO-level specs for the 12 new work orders (7 each).
   - 60 additional WO-level specs for the 15 existing work orders (4 extra each).

3. Security
   - No schema changes. All inserts respect existing RLS policies (anon + authenticated).
   - No destructive operations. Pure INSERT statements, idempotent via NOT EXISTS guards.

4. Notes
   - Financial values are in INR Lakhs.
   - `descr` alias used because `desc` is a reserved keyword.
   - Date literals cast with ::date in VALUES tables.
*/

-- ============================================================
-- 1. New projects (one per new state)
-- ============================================================
INSERT INTO projects (seq_no, title, code, manager, state, district, category, subcategory, target_pct, completed_pct, delay_status, qty_deviations, spec_deviations, extension_days, mbook_entry, billed_amount, paid_amount, start_date, end_date)
SELECT v.seq_no, v.title, v.code, v.manager, v.state, v.district, v.category, v.subcategory, v.tgt, v.cmp, v.ds, v.qd, v.spc, v.ed, v.mb, v.bl, v.pa, v.sd::date, v.ed1::date
FROM (VALUES
  ('9.0.0',  'Guwahati Bridge Construction',           'PWD-ASM-GHY-009', 'D. Borah',     'Assam',          'Guwahati',      'Civil & Structures',  'Bridges',         70, 55, 'Delayed - Warning',  2, 1, 30,  2100, 1155,  900, '2024-02-01', '2025-08-31'),
  ('10.0.0', 'New Delhi Sewer Network Renewal',         'PWD-DEL-NDL-010', 'S. Verma',     'Delhi',         'New Delhi',      'Water & Sanitation',  'Sewage Plants',   80, 40, 'Delayed - Serious',  3, 2, 45,  3200, 1280, 1000, '2023-10-15', '2025-05-31'),
  ('11.0.0', 'Ahmedabad Storm Drain Network',           'PWD-GUJ-AHM-011', 'R. Patel',     'Gujarat',       'Ahmedabad',      'Water & Sanitation',  'Storm Drains',    65, 65, 'On Time',            1, 0,  0,  1450,  942,  800, '2024-01-10', '2025-07-31'),
  ('12.0.0', 'Bhubaneswar Road Widening Phase I',       'PWD-ODI-BHB-012', 'B. Mohanty',   'Odisha',        'Bhubaneswar',    'Civil & Structures',  'Roads',           60, 35, 'Delayed - Warning',  2, 1, 20,  1850,  647,  500, '2024-03-20', '2025-10-31'),
  ('13.0.0', 'Visakhapatnam Port Access Road',          'PWD-APD-VSK-013', 'K. Naidu',     'Andhra Pradesh','Visakhapatnam', 'Civil & Structures',  'Roads',           75, 50, 'Delayed - Warning',  1, 1, 15,  2600, 1300, 1050, '2024-01-05', '2025-09-30'),
  ('14.0.0', 'Lucknow 132kV Substation & Cabling',      'PWD-UP-LKO-014',  'A. Tiwari',    'Uttar Pradesh', 'Lucknow',        'Electrical & HVAC',   'Substations',     70, 25, 'Delayed - Critical',  4, 3, 60,  3800,  950,  600, '2023-07-01', '2025-03-31')
) AS v(seq_no, title, code, manager, state, district, category, subcategory, tgt, cmp, ds, qd, spc, ed, mb, bl, pa, sd, ed1)
WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.seq_no = v.seq_no);

-- ============================================================
-- 2. Work orders for new projects (2 per project)
-- ============================================================
INSERT INTO work_orders (project_id, seq_no, title, code, manager, state, district, category, subcategory, target_pct, completed_pct, delay_status, qty_deviations, spec_deviations, extension_days, mbook_entry, billed_amount, paid_amount, start_date, end_date)
SELECT p.id, v.wo_seq, v.title, v.code, v.manager, p.state, p.district, p.category, p.subcategory, v.tgt, v.cmp, v.ds, v.qd, v.spc, v.ed, v.mb, v.bl, v.pa, v.sd1::date, v.ed1::date
FROM projects p
JOIN (VALUES
  ('9.0.0',  '9.1.0',  'Guwahati Bridge - Foundation Works',    'ASM-GHY-091', 'D. Borah',     70, 60, 'On Time',            1, 0,  0,  1200,  720,  600, '2024-02-15', '2025-03-31'),
  ('9.0.0',  '9.2.0',  'Guwahati Bridge - Superstructure',      'ASM-GHY-092', 'D. Borah',     70, 45, 'Delayed - Warning',  1, 1, 30,   900,  405,  300, '2024-06-01', '2025-08-31'),
  ('10.0.0', '10.1.0', 'Delhi Sewer - Laying & Jointing',        'DEL-NDL-101', 'S. Verma',     80, 42, 'Delayed - Serious',  2, 1, 45,  1800,  756,  600, '2023-11-01', '2025-02-28'),
  ('10.0.0', '10.2.0', 'Delhi Sewer - Pump House & Electrical',  'DEL-NDL-102', 'S. Verma',     80, 35, 'Delayed - Serious',  1, 1, 30,  1400,  490,  350, '2024-01-15', '2025-05-31'),
  ('11.0.0', '11.1.0', 'Ahmedabad Drain - Excavation & Pipe',    'GUJ-AHM-111', 'R. Patel',     65, 70, 'On Time',            0, 0,  0,   800,  560,  480, '2024-01-20', '2025-04-30'),
  ('11.0.0', '11.2.0', 'Ahmedabad Drain - Chambers & Finishing', 'GUJ-AHM-112', 'R. Patel',     65, 58, 'On Time',            1, 0,  0,   650,  377,  300, '2024-04-01', '2025-07-31'),
  ('12.0.0', '12.1.0', 'Bhubaneswar Road - Earthwork & Subgrade','ODI-BHB-121', 'B. Mohanty',   60, 40, 'Delayed - Warning',  1, 1, 20,  1000,  400,  300, '2024-04-01', '2025-08-31'),
  ('12.0.0', '12.2.0', 'Bhubaneswar Road - Base & Bituminous',   'ODI-BHB-122', 'B. Mohanty',   60, 28, 'Delayed - Warning',  1, 0, 15,   850,  238,  180, '2024-07-15', '2025-10-31'),
  ('13.0.0', '13.1.0', 'Vizag Port Road - Embankment & Culvert', 'APD-VSK-131', 'K. Naidu',     75, 55, 'On Time',            1, 0, 10,  1500,  825,  660, '2024-01-20', '2025-06-30'),
  ('13.0.0', '13.2.0', 'Vizag Port Road - Pavement & Markings',  'APD-VSK-132', 'K. Naidu',     75, 42, 'Delayed - Warning',  0, 1, 15,  1100,  462,  360, '2024-05-01', '2025-09-30'),
  ('14.0.0', '14.1.0', 'Lucknow Substation - Civil Works',      'UP-LKO-141',  'A. Tiwari',    70, 30, 'Delayed - Critical', 2, 2, 60,  2000,  600,  400, '2023-07-15', '2025-01-31'),
  ('14.0.0', '14.2.0', 'Lucknow Substation - Cabling & Equip',  'UP-LKO-142',  'A. Tiwari',    70, 18, 'Delayed - Critical', 2, 1, 60,  1800,  324,  180, '2023-10-01', '2025-03-31')
) AS v(proj_seq, wo_seq, title, code, manager, tgt, cmp, ds, qd, spc, ed, mb, bl, pa, sd1, ed1)
ON p.seq_no = v.proj_seq
WHERE NOT EXISTS (SELECT 1 FROM work_orders w WHERE w.seq_no = v.wo_seq);

-- ============================================================
-- 3. Schedules for new work orders (2 per WO)
-- ============================================================
INSERT INTO schedules (work_order_id, seq_no, title, code, manager, state, district, category, subcategory, target_pct, completed_pct, delay_status, qty_deviations, spec_deviations, extension_days, mbook_entry, billed_amount, paid_amount, start_date, end_date)
SELECT w.id, v.sched_seq, v.title, v.code, w.manager, w.state, w.district, w.category, w.subcategory, v.tgt, v.cmp, v.ds, v.qd, v.spc, v.ed, v.mb, v.bl, v.pa, v.sd1::date, v.ed1::date
FROM work_orders w
JOIN (VALUES
  ('9.1.0',  '9.1.1', 'Foundation - Excavation & Piling',    'ASM-0911', 'D. Borah',     70, 75, 'On Time',           0, 0,  0,  600, 450, 380, '2024-02-20', '2024-12-31'),
  ('9.1.0',  '9.1.2', 'Foundation - Pile Cap & Rebar',       'ASM-0912', 'D. Borah',     70, 60, 'On Time',           1, 0,  0,  600, 360, 280, '2024-05-01', '2025-03-31'),
  ('9.2.0',  '9.2.1', 'Superstructure - Pier & Girders',      'ASM-0921', 'D. Borah',     70, 50, 'Delayed - Warning', 1, 1, 30,  500, 250, 180, '2024-06-15', '2025-05-31'),
  ('9.2.0',  '9.2.2', 'Superstructure - Deck Slab & Finishing','ASM-0922','D. Borah',     70, 35, 'Delayed - Warning', 0, 0, 30,  400, 140,  100, '2024-10-01', '2025-08-31'),
  ('10.1.0', '10.1.1','Sewer Laying - Trenching & Pipe',      'DEL-1011', 'S. Verma',     80, 45, 'Delayed - Serious', 2, 1, 45, 1000, 450, 350, '2023-11-10', '2025-01-31'),
  ('10.1.0', '10.1.2','Sewer Laying - Manholes & Testing',    'DEL-1012', 'S. Verma',     80, 38, 'Delayed - Serious', 0, 0, 45,  800, 304, 220, '2024-02-01', '2025-02-28'),
  ('10.2.0', '10.2.1','Pump House - Civil Structure',        'DEL-1021', 'S. Verma',     80, 40, 'Delayed - Serious', 1, 1, 30,  800, 320, 240, '2024-01-20', '2025-03-31'),
  ('10.2.0', '10.2.2','Pump House - MEP & Commissioning',    'DEL-1022', 'S. Verma',     80, 28, 'Delayed - Serious', 0, 0, 30,  600, 168, 100, '2024-06-01', '2025-05-31'),
  ('11.1.0', '11.1.1','Drain - Excavation & Bedding',         'GUJ-1111', 'R. Patel',     65, 80, 'On Time',           0, 0,  0,  450, 360, 300, '2024-01-25', '2024-11-30'),
  ('11.1.0', '11.1.2','Drain - Pipe Laying & Jointing',       'GUJ-1112', 'R. Patel',     65, 65, 'On Time',           0, 0,  0,  350, 227, 180, '2024-04-01', '2025-04-30'),
  ('11.2.0', '11.2.1','Chambers - Brickwork & Plaster',      'GUJ-1121', 'R. Patel',     65, 62, 'On Time',           1, 0,  0,  350, 217, 170, '2024-04-15', '2025-05-31'),
  ('11.2.0', '11.2.2','Finishing - Grating & Surrounds',     'GUJ-1122', 'R. Patel',     65, 52, 'On Time',           0, 0,  0,  300, 156, 120, '2024-08-01', '2025-07-31'),
  ('12.1.0', '12.1.1','Earthwork - Clearing & Grubbing',      'ODI-1211', 'B. Mohanty',   60, 50, 'Delayed - Warning', 1, 1, 20,  500, 250, 180, '2024-04-10', '2024-12-31'),
  ('12.1.0', '12.1.2','Subgrade - Compaction & Leveling',    'ODI-1212', 'B. Mohanty',   60, 32, 'Delayed - Warning', 0, 0, 20,  500, 160, 120, '2024-08-01', '2025-08-31'),
  ('12.2.0', '12.2.1','Base - WMM & Compaction',             'ODI-1221', 'B. Mohanty',   60, 35, 'Delayed - Warning', 1, 0, 15,  450, 157, 120, '2024-07-20', '2025-06-30'),
  ('12.2.0', '12.2.2','Bituminous - BC Layer & Tack Coat',   'ODI-1222', 'B. Mohanty',   60, 20, 'Delayed - Warning', 0, 0, 15,  400,  80,  60, '2024-10-01', '2025-10-31'),
  ('13.1.0', '13.1.1','Embankment - Earth Fill & Compaction','APD-1311', 'K. Naidu',     75, 60, 'On Time',           1, 0, 10,  800, 480, 380, '2024-01-25', '2024-12-31'),
  ('13.1.0', '13.1.2','Culvert - Box & Wing Walls',          'APD-1312', 'K. Naidu',     75, 50, 'On Time',           0, 0, 10,  700, 350, 260, '2024-04-01', '2025-06-30'),
  ('13.2.0', '13.2.1','Pavement - Sub-base & Base',          'APD-1321', 'K. Naidu',     75, 48, 'On Time',           0, 0,  0,  600, 288, 220, '2024-05-10', '2025-07-31'),
  ('13.2.0', '13.2.2','Markings - Signage & Road Marking',   'APD-1322', 'K. Naidu',     75, 35, 'Delayed - Warning', 0, 1, 15,  500, 175, 140, '2024-09-01', '2025-09-30'),
  ('14.1.0', '14.1.1','Civil - Foundation & Plinth',         'UP-1411',  'A. Tiwari',    70, 35, 'Delayed - Critical', 2, 2, 60, 1100, 385, 250, '2023-07-20', '2024-12-31'),
  ('14.1.0', '14.1.2','Civil - Superstructure & Roofing',    'UP-1412',  'A. Tiwari',    70, 22, 'Delayed - Critical', 0, 0, 60,  900, 198, 120, '2024-01-01', '2025-01-31'),
  ('14.2.0', '14.2.1','Cabling - HV Cable Laying',          'UP-1421',  'A. Tiwari',    70, 20, 'Delayed - Critical', 2, 1, 60, 1000, 200, 120, '2023-10-10', '2025-02-28'),
  ('14.2.0', '14.2.2','Equip - Transformer & Switchgear',   'UP-1422',  'A. Tiwari',    70, 15, 'Delayed - Critical', 0, 0, 60,  800, 120,  60, '2024-02-01', '2025-03-31')
) AS v(wo_seq, sched_seq, title, code, manager, tgt, cmp, ds, qd, spc, ed, mb, bl, pa, sd1, ed1)
ON w.seq_no = v.wo_seq
WHERE NOT EXISTS (SELECT 1 FROM schedules s WHERE s.seq_no = v.sched_seq);

-- ============================================================
-- 4. Tracking entries for new schedules (3 per schedule)
-- ============================================================
INSERT INTO tracking_entries (schedule_id, seq_no, title, site_officer, measurement_date, completion_tag, mbook_entry, billed_amount, paid_amount)
SELECT s.id, v.trk_seq, v.title, v.officer, v.mdate::date, v.tag, v.mb, v.bl, v.pa
FROM schedules s
JOIN (VALUES
  ('9.1.1','9.1.1-TRK-01','Bore pile #1-12 measurement',     'Site Eng. A', '2024-03-15','Approved', 200, 150, 120),
  ('9.1.1','9.1.1-TRK-02','Bore pile #13-24 measurement',    'Site Eng. A', '2024-05-20','Approved', 200, 150, 130),
  ('9.1.1','9.1.1-TRK-03','Pile cap rebar measurement',     'Site Eng. A', '2024-08-01','Pending',   200,  50,   0),
  ('9.1.2','9.1.2-TRK-01','Pile cap concrete pour',         'Site Eng. B', '2024-06-15','Approved', 200, 120, 100),
  ('9.1.2','9.1.2-TRK-02','Pedestal rebar & pouring',       'Site Eng. B', '2024-09-01','Approved', 200, 100,  80),
  ('9.1.2','9.1.2-TRK-03','Anchor bolt setting',             'Site Eng. B', '2024-11-01','Pending',  200,  40,   0),
  ('9.2.1','9.2.1-TRK-01','Pier stem rebar cage',            'Site Eng. C', '2024-07-10','Approved', 180,  90,  60),
  ('9.2.1','9.2.1-TRK-02','Pier concrete pour',             'Site Eng. C', '2024-10-01','Approved', 170,  85,  60),
  ('9.2.1','9.2.1-TRK-03','Girder erection survey',          'Site Eng. C', '2025-01-15','Pending',  150,  40,   0),
  ('9.2.2','9.2.2-TRK-01','Deck slab formwork',             'Site Eng. D', '2024-11-01','Approved', 150,  60,  40),
  ('9.2.2','9.2.2-TRK-02','Deck slab concrete',              'Site Eng. D', '2025-02-01','Pending',  150,  50,  30),
  ('9.2.2','9.2.2-TRK-03','Finishing & parapet',             'Site Eng. D', '2025-05-01','Pending',  100,  20,   0),
  ('10.1.1','10.1.1-TRK-01','Trench excavation 500m',        'Site Eng. E', '2023-12-10','Approved', 350, 160, 120),
  ('10.1.1','10.1.1-TRK-02','Pipe laying 400m',              'Site Eng. E', '2024-02-15','Approved', 350, 160, 120),
  ('10.1.1','10.1.1-TRK-03','Jointing & hydrotest',          'Site Eng. E', '2024-05-01','Pending',  300, 130, 100),
  ('10.1.2','10.1.2-TRK-01','Manhole #1-8 construction',    'Site Eng. F', '2024-03-01','Approved', 300, 120,  90),
  ('10.1.2','10.1.2-TRK-02','Manhole #9-14 construction',   'Site Eng. F', '2024-06-01','Approved', 280, 110,  80),
  ('10.1.2','10.1.2-TRK-03','CCTV inspection',               'Site Eng. F', '2024-09-01','Pending',  220,  74,  50),
  ('10.2.1','10.2.1-TRK-01','Pump house foundation',        'Site Eng. G', '2024-02-15','Approved', 300, 120,  90),
  ('10.2.1','10.2.1-TRK-02','Walls & slab',                 'Site Eng. G', '2024-06-01','Approved', 300, 110,  80),
  ('10.2.1','10.2.1-TRK-03','Waterproofing',                'Site Eng. G', '2024-09-01','Pending',  200,  90,  70),
  ('10.2.2','10.2.2-TRK-01','Pump installation',            'Site Eng. H', '2024-07-01','Approved', 250,  70,  50),
  ('10.2.2','10.2.2-TRK-02','Electrical panel',             'Site Eng. H', '2024-10-01','Pending',  200,  60,  40),
  ('10.2.2','10.2.2-TRK-03','Commissioning & testing',      'Site Eng. H', '2025-01-01','Pending',  150,  38,  10),
  ('11.1.1','11.1.1-TRK-01','Stretch 1 excavation',         'Site Eng. I', '2024-03-01','Approved', 200, 160, 130),
  ('11.1.1','11.1.1-TRK-02','Stretch 2 excavation',         'Site Eng. I', '2024-06-01','Approved', 150, 120, 100),
  ('11.1.1','11.1.1-TRK-03','Bedding concrete',             'Site Eng. I', '2024-09-01','Approved', 100,  80,  70),
  ('11.1.2','11.1.2-TRK-01','Pipe laying 600m',             'Site Eng. J', '2024-05-01','Approved', 150, 100,  80),
  ('11.1.2','11.1.2-TRK-02','Pipe laying 700m',             'Site Eng. J', '2024-08-01','Approved', 120,  80,  60),
  ('11.1.2','11.1.2-TRK-03','Jointing & test',              'Site Eng. J', '2024-11-01','Pending',   80,  47,  40),
  ('11.2.1','11.2.1-TRK-01','Brickwork chambers',           'Site Eng. K', '2024-05-15','Approved', 150,  95,  75),
  ('11.2.1','11.2.1-TRK-02','Plastering',                   'Site Eng. K', '2024-08-01','Approved', 120,  75,  60),
  ('11.2.1','11.2.1-TRK-03','Waterproofing coat',           'Site Eng. K', '2024-11-01','Pending',   80,  47,  35),
  ('11.2.2','11.2.2-TRK-01','Grating installation',        'Site Eng. L', '2024-09-01','Approved', 120,  62,  50),
  ('11.2.2','11.2.2-TRK-02','Surround backfill',            'Site Eng. L', '2024-12-01','Pending',  100,  52,  40),
  ('11.2.2','11.2.2-TRK-03','Finishing & site cleanup',     'Site Eng. L', '2025-03-01','Pending',   80,  42,  30),
  ('12.1.1','12.1.1-TRK-01','Site clearing 2km',             'Site Eng. M', '2024-05-01','Approved', 180,  90,  70),
  ('12.1.1','12.1.1-TRK-02','Grubbing & disposal',          'Site Eng. M', '2024-08-01','Approved', 160,  80,  60),
  ('12.1.1','12.1.1-TRK-03','Embankment fill',              'Site Eng. M', '2024-11-01','Pending',  160,  80,  50),
  ('12.1.2','12.1.2-TRK-01','Compaction layer 1',           'Site Eng. N', '2024-09-01','Approved', 180,  60,  45),
  ('12.1.2','12.1.2-TRK-02','Compaction layer 2',           'Site Eng. N', '2024-12-01','Pending',  170,  55,  40),
  ('12.1.2','12.1.2-TRK-03','Leveling & trim',              'Site Eng. N', '2025-03-01','Pending',  150,  45,  35),
  ('12.2.1','12.2.1-TRK-01','WMM laying 1km',              'Site Eng. O', '2024-08-15','Approved', 180,  80,  60),
  ('12.2.1','12.2.1-TRK-02','WMM compaction',              'Site Eng. O', '2024-11-01','Approved', 150,  52,  40),
  ('12.2.1','12.2.1-TRK-03','Quality checks',              'Site Eng. O', '2025-02-01','Pending',  120,  25,  20),
  ('12.2.2','12.2.2-TRK-01','Tack coat & BC lay',          'Site Eng. P', '2024-11-01','Approved', 150,  40,  30),
  ('12.2.2','12.2.2-TRK-02','BC compaction',              'Site Eng. P', '2025-02-01','Pending',  150,  30,  20),
  ('12.2.2','12.2.2-TRK-03','Surface finish',             'Site Eng. P', '2025-05-01','Pending',  100,  10,  10),
  ('13.1.1','13.1.1-TRK-01','Earth fill 5000 cum',        'Site Eng. Q', '2024-03-01','Approved', 300, 180, 140),
  ('13.1.1','13.1.1-TRK-02','Compaction & testing',       'Site Eng. Q', '2024-06-01','Approved', 280, 170, 130),
  ('13.1.1','13.1.1-TRK-03','Final trim',                'Site Eng. Q', '2024-09-01','Approved', 220, 130, 110),
  ('13.1.2','13.1.2-TRK-01','Box culvert base',          'Site Eng. R', '2024-05-01','Approved', 280, 140, 100),
  ('13.1.2','13.1.2-TRK-02','Wing walls',               'Site Eng. R', '2024-08-01','Approved', 240, 120,  90),
  ('13.1.2','13.1.2-TRK-03','Backfill & finish',        'Site Eng. R', '2024-11-01','Pending', 180,  90,  70),
  ('13.2.1','13.2.1-TRK-01','Sub-base 1km',             'Site Eng. S', '2024-06-01','Approved', 250, 120,  90),
  ('13.2.1','13.2.1-TRK-02','Base layer',              'Site Eng. S', '2024-09-01','Approved', 220, 100,  80),
  ('13.2.1','13.2.1-TRK-03','Quality check',           'Site Eng. S', '2024-12-01','Pending', 130,  68,  50),
  ('13.2.2','13.2.2-TRK-01','Signage installation',    'Site Eng. T', '2024-10-01','Approved', 200,  70,  55),
  ('13.2.2','13.2.2-TRK-02','Road marking 2km',       'Site Eng. T', '2025-01-01','Pending', 180,  60,  45),
  ('13.2.2','13.2.2-TRK-03','Final inspection',       'Site Eng. T', '2025-04-01','Pending', 120,  45,  40),
  ('14.1.1','14.1.1-TRK-01','Excavation & PCC',         'Site Eng. U', '2023-09-01','Approved', 400, 140,  90),
  ('14.1.1','14.1.1-TRK-02','Foundation rebar',        'Site Eng. U', '2023-12-01','Approved', 380, 133,  85),
  ('14.1.1','14.1.1-TRK-03','Foundation concrete',     'Site Eng. U', '2024-03-01','Pending',  320, 112,  75),
  ('14.1.2','14.1.2-TRK-01','Column & beam rebar',     'Site Eng. V', '2024-02-01','Approved', 350,  77,  50),
  ('14.1.2','14.1.2-TRK-02','Slab concrete',          'Site Eng. V', '2024-06-01','Pending',  320,  70,  40),
  ('14.1.2','14.1.2-TRK-03','Roofing & waterproof',   'Site Eng. V', '2024-10-01','Pending',  230,  51,  30),
  ('14.2.1','14.2.1-TRK-01','Cable trenching',        'Site Eng. W', '2023-11-01','Approved', 380,  76,  45),
  ('14.2.1','14.2.1-TRK-02','HV cable laying 1km',    'Site Eng. W', '2024-02-01','Approved', 360,  72,  45),
  ('14.2.1','14.2.1-TRK-03','Cable jointing',        'Site Eng. W', '2024-06-01','Pending',  260,  52,  30),
  ('14.2.2','14.2.2-TRK-01','Transformer foundation', 'Site Eng. X', '2024-03-01','Approved', 320,  48,  30),
  ('14.2.2','14.2.2-TRK-02','Switchgear install',    'Site Eng. X', '2024-07-01','Pending',  280,  42,  20),
  ('14.2.2','14.2.2-TRK-03','Testing & commission',   'Site Eng. X', '2024-11-01','Pending',  200,  30,  10)
) AS v(sched_seq, trk_seq, title, officer, mdate, tag, mb, bl, pa)
ON s.seq_no = v.sched_seq
WHERE NOT EXISTS (SELECT 1 FROM tracking_entries t WHERE t.seq_no = v.trk_seq);

-- ============================================================
-- 5. Richer WO-level specs for the 12 NEW work orders (7 each)
-- ============================================================
INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'wo', w.id, v.code, v.descr, v.unit, v.eq, v.xq, v.rate, v.amt, v.mdate::date, v.att
FROM work_orders w
JOIN (VALUES
  ('9.1.0','EXCAVATION','Excavation for foundation pits','cum',  1200, 1200,   350,  420000,'2024-03-20',true),
  ('9.1.0','CONCRETE', 'M25 grade concrete for pile caps','cum',   480,  450,   5200, 2340000,'2024-06-20',true),
  ('9.1.0','STEEL',    'TMT steel reinforcement Fe500','kg',   45000,42000,     62, 2604000,'2024-06-25',true),
  ('9.1.0','SHUTTERING','Steel shuttering for pile caps','sqm',    850,  820,    280,  229600,'2024-06-15',false),
  ('9.1.0','CURING',   'Curing compound application','sqm',     850,  820,     25,   20500,'2024-07-01',false),
  ('9.1.0','BACKFILL', 'Earth backfill around foundation','cum',   600,  600,    180,  108000,'2024-07-15',false),
  ('9.1.0','WATERPROOFING','Waterproofing coating to caps','sqm',   320,  300,    145,   43500,'2024-08-01',true),
  ('9.2.0','STRUCTURAL STEEL','Structural steel for girders','kg',  55000, 30000,     78, 2340000,'2024-09-01',true),
  ('9.2.0','CONCRETE', 'M30 deck slab concrete','cum',           220,  120,   6800,  816000,'2024-11-15',true),
  ('9.2.0','STEEL',    'Deck slab reinforcement','kg',         18000,12000,     62,  744000,'2024-11-10',true),
  ('9.2.0','SHUTTERING','Deck slab shuttering','sqm',             640,  400,    280,  112000,'2024-11-01',false),
  ('9.2.0','CURING',   'Deck curing membrane','sqm',             640,  400,     25,   10000,'2024-12-01',false),
  ('9.2.0','PAVING',   'Bridge deck wearing course','sqm',        580,    0,    450,       0,'2025-03-01',false),
  ('9.2.0','WATERPROOFING','Deck waterproofing membrane','sqm',   580,  200,    220,   44000,'2025-01-15',true),
  ('10.1.0','EXCAVATION','Trench excavation for sewer','cum',    4500, 2800,    280,  784000,'2024-01-15',true),
  ('10.1.0','EARTHWORK','Earthwork support & shoring','cum',     1200,  900,    220,  198000,'2024-01-20',false),
  ('10.1.0','CONCRETE', 'PCC bedding & haunching','cum',          380,  300,   4500, 1350000,'2024-03-01',true),
  ('10.1.0','BACKFILL', 'Backfill over pipes','cum',             3200, 2000,    150,  300000,'2024-04-01',false),
  ('10.1.0','PLASTERING','Manhole plastering inside','sqm',       640,  420,    260,  109200,'2024-05-15',true),
  ('10.1.0','WATERPROOFING','Manhole waterproofing','sqm',         640,  420,    180,   75600,'2024-06-01',true),
  ('10.1.0','BITUMEN', 'Bitumen joint seal','m',                   850,  600,    120,   72000,'2024-06-20',false),
  ('10.2.0','EXCAVATION','Pump house excavation','cum',           1800, 1800,   300,  540000,'2024-02-01',true),
  ('10.2.0','CONCRETE', 'M25 RCC walls & slab','cum',              420,  300,   5400, 1620000,'2024-05-01',true),
  ('10.2.0','STEEL',    'Reinforcement for pump house','kg',     28000,20000,     62, 1240000,'2024-05-10',true),
  ('10.2.0','SHUTTERING','Shuttering for walls & slab','sqm',      1200,  900,    280,  252000,'2024-04-15',false),
  ('10.2.0','WATERPROOFING','Tank waterproofing','sqm',            800,  500,    200,  100000,'2024-07-01',true),
  ('10.2.0','WIRING',   'Pump house electrical wiring','m',       2200,  800,     85,   68000,'2024-09-01',true),
  ('10.2.0','CURING',   'Curing of concrete','sqm',               1200,  900,     25,   22500,'2024-05-20',false),
  ('11.1.0','EXCAVATION','Drain trench excavation','cum',         3200, 3200,   250,  800000,'2024-02-15',true),
  ('11.1.0','EARTHWORK','Shoring & bracing','cum',                 600,  600,    200,  120000,'2024-02-20',false),
  ('11.1.0','CONCRETE', 'PCC bedding','cum',                       280,  280,   4200, 1176000,'2024-04-01',true),
  ('11.1.0','BACKFILL', 'Backfill over drain','cum',              2200, 2200,    140,  308000,'2024-06-01',false),
  ('11.1.0','PLASTERING','Internal plastering','sqm',               500,  500,    250,  125000,'2024-07-01',true),
  ('11.1.0','WATERPROOFING','Joint waterproofing','m',             400,  400,    110,   44000,'2024-07-15',true),
  ('11.1.0','BITUMEN', 'Bitumen sealant at joints','m',            400,  400,    120,   48000,'2024-08-01',false),
  ('11.2.0','CONCRETE', 'Chamber concrete M25','cum',              180,  160,   5200,  832000,'2024-05-20',true),
  ('11.2.0','STEEL',    'Chamber reinforcement','kg',            12000,11000,     62,  682000,'2024-05-25',true),
  ('11.2.0','SHUTTERING','Chamber shuttering','sqm',               420,  380,    280,  106400,'2024-05-15',false),
  ('11.2.0','PLASTERING','Chamber plastering','sqm',                640,  580,    260,  150800,'2024-07-01',true),
  ('11.2.0','WATERPROOFING','Chamber waterproofing','sqm',          640,  580,    180,  104400,'2024-08-01',true),
  ('11.2.0','BACKFILL', 'Surround backfill','cum',                 300,  300,    150,   45000,'2024-09-01',false),
  ('11.2.0','CURING',   'Curing chambers','sqm',                   420,  380,     25,    9500,'2024-06-01',false),
  ('12.1.0','EARTHWORK','Clearing & grubbing','sqm',              8000, 8000,     18,  144000,'2024-05-10',true),
  ('12.1.0','EXCAVATION','Roadway excavation','cum',              3500, 2500,    240,  600000,'2024-06-01',true),
  ('12.1.0','BACKFILL', 'Embankment fill','cum',                  5000, 3500,    160,  560000,'2024-07-01',false),
  ('12.1.0','CONCRETE', 'Subgrade stabilization','cum',             800,  600,   1800, 1080000,'2024-09-01',true),
  ('12.1.0','CONCRETE', 'PCC for culvert','cum',                    120,  100,   4500,  450000,'2024-10-01',true),
  ('12.1.0','STEEL',    'Culvert reinforcement','kg',            8000, 6000,      62,  372000,'2024-10-15',true),
  ('12.1.0','CURING',   'Curing PCC & culvert','sqm',               400,  300,     25,    7500,'2024-11-01',false),
  ('12.2.0','EARTHWORK','Subgrade preparation','sqm',             6000, 4000,     22,   88000,'2024-08-01',true),
  ('12.2.0','CONCRETE', 'WMM base layer','cum',                    1800, 1200,   2200, 2640000,'2024-10-01',true),
  ('12.2.0','BITUMEN', 'Tack coat application','sqm',              6000, 3000,     45,  135000,'2025-01-01',true),
  ('12.2.0','BITUMEN', 'Bituminous concrete (BC) layer','cum',      450,  200,   9500, 1900000,'2025-02-01',true),
  ('12.2.0','PAVING',   'Paver finishing','sqm',                  6000, 3000,    120,  360000,'2025-02-15',false),
  ('12.2.0','BACKFILL', 'Shoulder earthwork','cum',                400,  200,    150,   30000,'2025-03-01',false),
  ('12.2.0','CURING',   'Curing of base','sqm',                   6000, 3000,     15,   45000,'2025-01-15',false),
  ('13.1.0','EARTHWORK','Embankment fill along port road','cum',  8000, 7000,     160, 1120000,'2024-03-15',true),
  ('13.1.0','CONCRETE', 'Subgrade compaction','cum',               1500, 1400,   1800, 2520000,'2024-05-01',true),
  ('13.1.0','CONCRETE', 'Culvert box concrete M25','cum',          280,  240,   5400, 1296000,'2024-06-15',true),
  ('13.1.0','STEEL',    'Culvert reinforcement','kg',            14000,12000,      62,  744000,'2024-06-10',true),
  ('13.1.0','SHUTTERING','Culvert shuttering','sqm',               640,  560,     280,  156800,'2024-06-01',false),
  ('13.1.0','BACKFILL', 'Wing wall backfill','cum',                500,  450,     150,   67500,'2024-08-01',false),
  ('13.1.0','WATERPROOFING','Culvert waterproofing','sqm',         400,  350,     200,   70000,'2024-09-01',true),
  ('13.2.0','EARTHWORK','Subgrade finishing','sqm',               5000, 4000,     22,   88000,'2024-06-01',true),
  ('13.2.0','CONCRETE', 'Sub-base & base course','cum',            1600, 1200,   2200, 2640000,'2024-08-01',true),
  ('13.2.0','BITUMEN', 'Prime coat & tack coat','sqm',            5000, 3000,     40,  120000,'2024-11-01',true),
  ('13.2.0','BITUMEN', 'BC layer paving','cum',                     400,  200,   9500, 1900000,'2025-01-15',true),
  ('13.2.0','PAVING',   'Paver & roller finishing','sqm',         5000, 3000,    120,  360000,'2025-02-01',false),
  ('13.2.0','BACKFILL', 'Shoulder fill','cum',                     350,  200,     150,   30000,'2025-03-01',false),
  ('13.2.0','CURING',   'Curing base course','sqm',               5000, 3000,     15,   45000,'2024-12-15',false),
  ('14.1.0','EXCAVATION','Substation excavation','cum',           2500, 2500,   280,  700000,'2023-08-01',true),
  ('14.1.0','CONCRETE', 'PCC & leveling course','cum',              400,  400,   4200, 1680000,'2023-09-01',true),
  ('14.1.0','CONCRETE', 'RCC foundation & plinth','cum',            350,  280,   5400, 1512000,'2023-12-01',true),
  ('14.1.0','STEEL',    'Foundation reinforcement','kg',         22000,18000,      62, 1116000,'2023-11-15',true),
  ('14.1.0','SHUTTERING','Foundation shuttering','sqm',             900,  800,     280,  224000,'2023-10-01',false),
  ('14.1.0','BACKFILL', 'Plinth backfill','cum',                   600,  600,     150,   90000,'2024-01-01',false),
  ('14.1.0','CURING',   'Curing foundation','sqm',                 900,  800,      25,   20000,'2023-12-15',false),
  ('14.2.0','EXCAVATION','Cable trench excavation','cum',          1800, 1500,   260,  390000,'2023-11-01',true),
  ('14.2.0','CONCRETE', 'Trench lining concrete','cum',             220,  180,   4800,  864000,'2024-01-01',true),
  ('14.2.0','WIRING',   'HV cable laying 11kV','m',                3200, 1800,     120,  216000,'2024-03-01',true),
  ('14.2.0','WIRING',   'LV control cabling','m',                  1800,  900,      85,   76500,'2024-04-01',true),
  ('14.2.0','STEEL',    'Equipment support structures','kg',      8000, 5000,      72,  360000,'2024-05-01',true),
  ('14.2.0','BACKFILL', 'Trench backfill & reinstatement','cum',   1200,  900,     150,  135000,'2024-06-01',false),
  ('14.2.0','WATERPROOFING','Trench waterproofing','sqm',            600,  400,     200,   80000,'2024-02-01',true)
) AS v(wo_seq, code, descr, unit, eq, xq, rate, amt, mdate, att)
ON w.seq_no = v.wo_seq
WHERE NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='wo' AND s.parent_id = w.id AND s.spec_code = v.code AND s.description = v.descr);

-- ============================================================
-- 6. Add 4 extra specs to each of the 15 EXISTING work orders
--    (bringing them from 3 to 7 specs each)
-- ============================================================
INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'wo', w.id, v.code, v.descr, v.unit, v.eq, v.xq, v.rate, v.amt, v.mdate::date, v.att
FROM work_orders w
JOIN (VALUES
  ('1.1.0','SHUTTERING','Steel shuttering for piers','sqm',         1200, 1000,    280,  280000,'2024-04-01',true),
  ('1.1.0','CURING',    'Curing compound for concrete','sqm',        1200, 1000,     25,   25000,'2024-05-01',false),
  ('1.1.0','WATERPROOFING','Waterproofing deck surface','sqm',        800,  600,    200,  120000,'2024-06-01',true),
  ('1.1.0','BACKFILL',  'Earth backfill abutments','cum',             600,  500,    150,   75000,'2024-07-01',false),
  ('1.2.0','SHUTTERING','Deck slab shuttering','sqm',                 950,  800,    280,  224000,'2024-08-01',true),
  ('1.2.0','CURING',    'Curing deck slab','sqm',                     950,  800,     25,   20000,'2024-09-01',false),
  ('1.2.0','WATERPROOFING','Bridge deck waterproofing','sqm',          750,  500,    220,  110000,'2024-10-01',true),
  ('1.2.0','BITUMEN',  'Expansion joint sealant','m',                180,  120,    120,   14400,'2024-11-01',false),
  ('2.1.0','SHUTTERING','Kerb stone shuttering','sqm',                400,  400,    220,   88000,'2024-05-01',false),
  ('2.1.0','CURING',    'Curing PCC & base','sqm',                   2000, 2000,     15,   30000,'2024-06-01',false),
  ('2.1.0','BITUMEN',  'Tack coat for BC','sqm',                     2000, 1800,     40,   72000,'2024-07-01',true),
  ('2.1.0','BACKFILL', 'Shoulder backfill','cum',                    300,  300,    150,   45000,'2024-08-01',false),
  ('2.2.0','SHUTTERING','Drain shuttering','sqm',                    350,  300,    220,   66000,'2024-06-01',false),
  ('2.2.0','CURING',    'Curing drain walls','sqm',                   350,  300,     25,    7500,'2024-07-01',false),
  ('2.2.0','WATERPROOFING','Drain waterproofing','sqm',                350,  300,    180,   54000,'2024-08-01',true),
  ('2.2.0','BITUMEN',  'Joint sealant','m',                          200,  180,    120,   21600,'2024-09-01',false),
  ('3.1.0','SHUTTERING','Trench shoring','sqm',                       800,  600,    280,  168000,'2023-12-01',true),
  ('3.1.0','CURING',    'Curing concrete bedding','sqm',              800,  600,     25,   15000,'2024-01-01',false),
  ('3.1.0','WATERPROOFING','Pipe joint waterproofing','m',            400,  300,    110,   33000,'2024-02-01',true),
  ('3.1.0','BACKFILL', 'Trench backfill','cum',                      1500, 1000,    150,  150000,'2024-03-01',false),
  ('3.2.0','SHUTTERING','Manhole shuttering','sqm',                   450,  350,    280,   98000,'2024-03-01',true),
  ('3.2.0','CURING',    'Curing manhole walls','sqm',                 450,  350,     25,    8750,'2024-04-01',false),
  ('3.2.0','WATERPROOFING','Manhole waterproofing','sqm',             450,  350,    180,   63000,'2024-05-01',true),
  ('3.2.0','BITUMEN',  'Bitumen collar seal','m',                    150,  100,    120,   12000,'2024-06-01',false),
  ('4.1.0','SHUTTERING','Tank shuttering','sqm',                    1200, 1000,    280,  280000,'2023-10-01',true),
  ('4.1.0','CURING',    'Curing tank walls','sqm',                  1200, 1000,     25,   25000,'2023-11-01',false),
  ('4.1.0','WATERPROOFING','Tank internal waterproofing','sqm',      1200, 1000,    200,  200000,'2023-12-01',true),
  ('4.1.0','BACKFILL', 'Tank surround backfill','cum',                500,  500,    150,   75000,'2024-01-01',false),
  ('4.2.0','WIRING',   'Pump wiring & control','m',                 1500, 1200,     85,  102000,'2024-02-01',true),
  ('4.2.0','SHUTTERING','Pump house shuttering','sqm',                 400,  350,    280,   98000,'2024-01-01',false),
  ('4.2.0','CURING',    'Curing pump house','sqm',                    400,  350,     25,    8750,'2024-02-01',false),
  ('4.2.0','WATERPROOFING','Pump house waterproofing','sqm',          400,  350,    180,   63000,'2024-03-01',true),
  ('5.1.0','SHUTTERING','Equipment foundation shuttering','sqm',      600,  400,    280,  112000,'2023-07-01',true),
  ('5.1.0','CURING',    'Curing foundation','sqm',                    600,  400,     25,   10000,'2023-08-01',false),
  ('5.1.0','WATERPROOFING','Plinth waterproofing','sqm',               400,  250,    200,   50000,'2023-09-01',true),
  ('5.1.0','BACKFILL', 'Cable trench backfill','cum',                 300,  200,    150,   30000,'2023-10-01',false),
  ('5.2.0','WIRING',   'HV cable laying','m',                       2000,  800,    120,   96000,'2023-11-01',true),
  ('5.2.0','WIRING',   'Control & LT cabling','m',                  1200,  500,     85,   42500,'2023-12-01',true),
  ('5.2.0','SHUTTERING','Cable trench shuttering','sqm',              300,  200,    220,   44000,'2023-10-01',false),
  ('5.2.0','WATERPROOFING','Trench waterproofing','sqm',              300,  200,    200,   40000,'2024-01-01',true),
  ('6.1.0','WIRING',   'Street light cabling','m',                  3500, 3500,     75,  262500,'2023-05-01',true),
  ('6.1.0','EARTHWORK','Pole foundation excavation','cum',            120,  120,    250,   30000,'2023-04-01',false),
  ('6.1.0','CONCRETE', 'Pole foundation concrete','cum',              60,   60,   4500,  270000,'2023-05-15',true),
  ('6.1.0','BACKFILL', 'Pole surround backfill','cum',                80,   80,    150,   12000,'2023-06-01',false),
  ('6.2.0','WIRING',   'Feeder pillar wiring','m',                   800,  800,     85,   68000,'2023-06-01',true),
  ('6.2.0','WIRING',   'Earthing & lightning protection','m',        400,  400,    110,   44000,'2023-07-01',true),
  ('6.2.0','CONCRETE', 'PCC for feeder bases','cum',                  30,   30,   4200,  126000,'2023-06-15',true),
  ('6.2.0','CURING',   'Curing PCC bases','sqm',                     100,  100,     25,    2500,'2023-07-01',false),
  ('7.1.0','EXCAVATION','Trench excavation for pipeline','cum',     2800, 2000,    260,  520000,'2024-03-01',true),
  ('7.1.0','SHUTTERING','Trench shoring','sqm',                       600,  400,    280,  112000,'2024-04-01',true),
  ('7.1.0','BACKFILL', 'Pipe trench backfill','cum',                 2200, 1500,    150,  225000,'2024-05-01',false),
  ('7.1.0','WATERPROOFING','Pipe joint wrapping','m',                500,  350,    110,   38500,'2024-06-01',true),
  ('7.2.0','SHUTTERING','Valve chamber shuttering','sqm',            300,  200,    280,   56000,'2024-06-01',false),
  ('7.2.0','CURING',    'Curing chamber walls','sqm',                300,  200,     25,    5000,'2024-07-01',false),
  ('7.2.0','WATERPROOFING','Chamber waterproofing','sqm',            300,  200,    180,   36000,'2024-08-01',true),
  ('7.2.0','BITUMEN',  'Bitumen coating to pipes','sqm',             600,  400,     95,   38000,'2024-09-01',true),
  ('8.1.0','SHUTTERING','Retaining wall shuttering','sqm',          2200, 1800,    280,  504000,'2024-03-01',true),
  ('8.1.0','CURING',    'Curing retaining walls','sqm',             2200, 1800,     25,   45000,'2024-04-01',false),
  ('8.1.0','WATERPROOFING','Wall waterproofing','sqm',              1800, 1400,    200,  280000,'2024-05-01',true),
  ('8.1.0','BACKFILL', 'Wall backfill','cum',                       1500, 1000,    150,  150000,'2024-06-01',false),
  ('8.2.0','SHUTTERING','Pavement shuttering','sqm',                1500, 1000,    280,  280000,'2024-07-01',true),
  ('8.2.0','BITUMEN',  'Tack coat & BC','sqm',                      4000, 2500,     45,  112500,'2024-09-01',true),
  ('8.2.0','PAVING',   'Paver finishing','sqm',                     4000, 2500,    120,  300000,'2024-10-01',false),
  ('8.2.0','CURING',   'Curing pavement','sqm',                    4000, 2500,     15,   37500,'2024-11-01',false)
) AS v(wo_seq, code, descr, unit, eq, xq, rate, amt, mdate, att)
ON w.seq_no = v.wo_seq
WHERE NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='wo' AND s.parent_id = w.id AND s.spec_code = v.code AND s.description = v.descr);
