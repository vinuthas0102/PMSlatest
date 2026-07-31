/*
# Seed tracking-level and schedule-level specs for the six new states
#
# Adds 10 tracking-level spec rows per tracking entry (72 entries => 720 rows)
# and 8 schedule-level spec rows per schedule (24 schedules => 192 rows)
# for Assam, Delhi, Gujarat, Odisha, Andhra Pradesh, Uttar Pradesh.
# Idempotent via NOT EXISTS guards. No schema changes.
*/

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'tracking', t.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, t.measurement_date, v.att
FROM tracking_entries t
JOIN schedules sch ON t.schedule_id = sch.id
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('PILE-DRV', 'Pile driving for foundation', 'no', 48, 36, 12500, true),
  ('SHUTTER', 'Steel shuttering erection', 'sqm', 320, 240, 450, false),
  ('CASTING', 'RCC casting for piers', 'cum', 180, 135, 8500, false),
  ('REBAR', 'Reinforcement steel binding', 'kg', 12500, 9375, 85, true),
  ('BEARING', 'Elastomeric bearing plates', 'no', 24, 18, 18500, false),
  ('WATERPRF', 'Waterproofing of deck slab', 'sqm', 410, 295, 320, false),
  ('EXPJNT', 'Expansion joint installation', 'm', 96, 72, 2100, true),
  ('RAILING', 'Structural railing fabrication', 'm', 180, 135, 1450, false),
  ('APPROACH', 'Approach slab construction', 'cum', 75, 48, 6800, false),
  ('PAINT', 'Protective coating application', 'sqm', 540, 405, 280, true)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Assam'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='tracking' AND s.parent_id=t.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'tracking', t.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, t.measurement_date, v.att
FROM tracking_entries t
JOIN schedules sch ON t.schedule_id = sch.id
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('EXCAV', 'Trench excavation for pipelines', 'cum', 850, 595, 320, true),
  ('PIPELAY', 'HDPE pipe laying DN300', 'm', 420, 294, 1850, false),
  ('JOINT', 'Pipe jointing & sealing', 'no', 168, 126, 450, false),
  ('BACKFILL', 'Backfilling & compaction', 'cum', 620, 434, 280, true),
  ('MANHOLE', 'Precast manhole construction', 'no', 28, 19, 22500, false),
  ('CHAMBER', 'Junction chamber casting', 'no', 14, 9, 18500, false),
  ('CCTV', 'CCTV inspection of sewers', 'm', 420, 315, 350, true),
  ('PTEST', 'Pressure & leakage testing', 'lot', 6, 4, 42000, false),
  ('REINSTATE', 'Surface reinstatement', 'sqm', 980, 686, 220, false),
  ('CHLOR', 'Chlorination & disinfection', 'lot', 4, 3, 35000, true)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Delhi'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='tracking' AND s.parent_id=t.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'tracking', t.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, t.measurement_date, v.att
FROM tracking_entries t
JOIN schedules sch ON t.schedule_id = sch.id
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('BOX-CULV', 'Box culvert construction', 'cum', 240, 168, 7200, true),
  ('CATCH-BASIN', 'Catch basin installation', 'no', 32, 22, 14500, false),
  ('OUTLET', 'Outlet structure casting', 'no', 8, 5, 28500, false),
  ('GRADING', 'Channel grading & slope', 'm', 560, 392, 380, true),
  ('LINING', 'Concrete lining of drains', 'sqm', 1450, 1015, 420, false),
  ('JBOX', 'Junction box construction', 'no', 18, 12, 16500, false),
  ('GRATING', 'Inlet grating installation', 'no', 64, 44, 1250, true),
  ('SLUICE', 'Sluice gate installation', 'no', 6, 4, 48000, false),
  ('HEADWALL', 'Headwall masonry work', 'cum', 95, 66, 3500, false),
  ('EROSION', 'Erosion protection pitching', 'sqm', 720, 504, 540, true)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Gujarat'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='tracking' AND s.parent_id=t.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'tracking', t.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, t.measurement_date, v.att
FROM tracking_entries t
JOIN schedules sch ON t.schedule_id = sch.id
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('EARTHWORK', 'Earthwork excavation', 'cum', 3200, 2240, 180, true),
  ('SUBGRADE', 'Sub-grade preparation', 'sqm', 8500, 5950, 95, false),
  ('GSB', 'Granular sub-base laying', 'cum', 1450, 1015, 650, false),
  ('WMM', 'Wet mix macadam laying', 'cum', 980, 686, 820, true),
  ('BM', 'Bituminous macadam course', 'cum', 620, 434, 1450, false),
  ('DBM', 'Dense bituminous macadam', 'cum', 480, 336, 2200, false),
  ('BC', 'Bituminous concrete surfacing', 'cum', 360, 252, 3100, true),
  ('KERB', 'Kerb stone installation', 'm', 1240, 868, 540, false),
  ('STORMWATER', 'Stormwater drain alongside', 'm', 620, 434, 780, false),
  ('STUDS', 'Road stud installation', 'no', 480, 336, 320, true)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Odisha'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='tracking' AND s.parent_id=t.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'tracking', t.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, t.measurement_date, v.att
FROM tracking_entries t
JOIN schedules sch ON t.schedule_id = sch.id
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('EARTHWORK', 'Earthwork excavation', 'cum', 3200, 2240, 180, true),
  ('SUBGRADE', 'Sub-grade preparation', 'sqm', 8500, 5950, 95, false),
  ('GSB', 'Granular sub-base laying', 'cum', 1450, 1015, 650, false),
  ('WMM', 'Wet mix macadam laying', 'cum', 980, 686, 820, true),
  ('BM', 'Bituminous macadam course', 'cum', 620, 434, 1450, false),
  ('DBM', 'Dense bituminous macadam', 'cum', 480, 336, 2200, false),
  ('BC', 'Bituminous concrete surfacing', 'cum', 360, 252, 3100, true),
  ('KERB', 'Kerb stone installation', 'm', 1240, 868, 540, false),
  ('STORMWATER', 'Stormwater drain alongside', 'm', 620, 434, 780, false),
  ('STUDS', 'Road stud installation', 'no', 480, 336, 320, true)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Andhra Pradesh'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='tracking' AND s.parent_id=t.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'tracking', t.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, t.measurement_date, v.att
FROM tracking_entries t
JOIN schedules sch ON t.schedule_id = sch.id
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('EXCAV', 'Cable trench excavation', 'cum', 540, 378, 280, true),
  ('TRENCH', 'Cable trench lining', 'm', 320, 224, 1450, false),
  ('HT-CABLE', 'HT cable laying 11kV', 'm', 1850, 1295, 820, false),
  ('LT-CABLE', 'LT cable laying', 'm', 2400, 1680, 420, true),
  ('TRANS-FND', 'Transformer foundation', 'cum', 85, 59, 6800, false),
  ('SWITCHGEAR', 'Switchgear installation', 'no', 12, 8, 185000, false),
  ('EARTHING', 'Earthing pit installation', 'no', 24, 16, 12500, true),
  ('LA', 'Lightning arrestor fitting', 'no', 8, 5, 42000, false),
  ('FENCE', 'Substation fencing', 'm', 420, 294, 980, false),
  ('COMMIS', 'Commissioning & testing', 'lot', 1, 0, 285000, true)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Uttar Pradesh'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='tracking' AND s.parent_id=t.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'schedule', sch.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, sch.start_date, v.att
FROM schedules sch
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('SURVEY', 'Topographic survey & layout', 'lot', 1, 1, 85000, true),
  ('DESIGN', 'Structural design & drawings', 'lot', 1, 1, 245000, false),
  ('FOUNDATION', 'Foundation work package', 'cum', 240, 168, 5200, false),
  ('SUBSTRUCTURE', 'Substructure construction', 'cum', 380, 266, 7800, false),
  ('SUPERSTRUCT', 'Superstructure erection', 'cum', 420, 294, 12500, true),
  ('DECK', 'Deck slab & finishing', 'sqm', 620, 434, 1850, false),
  ('APPROACH-W', 'Approach works package', 'cum', 180, 126, 4500, false),
  ('MISC', 'Miscellaneous bridge works', 'lot', 1, 1, 165000, false)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Assam'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='schedule' AND s.parent_id=sch.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'schedule', sch.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, sch.start_date, v.att
FROM schedules sch
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('SURVEY', 'Site survey & alignment', 'lot', 1, 1, 65000, true),
  ('DESIGN', 'Network design & layout', 'lot', 1, 1, 185000, false),
  ('CIVIL-W', 'Civil works package', 'cum', 850, 595, 3200, false),
  ('MECH-W', 'Mechanical equipment install', 'lot', 1, 1, 420000, false),
  ('ELEC-W', 'Electrical & SCADA works', 'lot', 1, 1, 285000, true),
  ('PIPE-NW', 'Pipeline network laying', 'm', 1850, 1295, 1650, false),
  ('TESTING', 'Testing & commissioning', 'lot', 1, 1, 145000, false),
  ('MISC', 'Miscellaneous sanitary works', 'lot', 1, 1, 95000, false)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Delhi'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='schedule' AND s.parent_id=sch.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'schedule', sch.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, sch.start_date, v.att
FROM schedules sch
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('SURVEY', 'Hydrological survey', 'lot', 1, 1, 55000, true),
  ('DESIGN', 'Drainage design & layout', 'lot', 1, 1, 165000, false),
  ('EARTH-W', 'Earthwork & shaping', 'cum', 2400, 1680, 220, false),
  ('STRUCT-W', 'Structural drain works', 'cum', 680, 476, 5800, false),
  ('LINING-W', 'Lining & waterproofing', 'sqm', 1850, 1295, 380, true),
  ('APPURT', 'Appurtenant structures', 'no', 28, 19, 22500, false),
  ('TESTING', 'Flow testing & commissioning', 'lot', 1, 1, 85000, false),
  ('MISC', 'Miscellaneous drainage works', 'lot', 1, 1, 75000, false)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Gujarat'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='schedule' AND s.parent_id=sch.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'schedule', sch.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, sch.start_date, v.att
FROM schedules sch
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('SURVEY', 'Road alignment survey', 'lot', 1, 1, 75000, true),
  ('DESIGN', 'Pavement design & drawings', 'lot', 1, 1, 195000, false),
  ('EARTH-W', 'Earthwork & embankment', 'cum', 4200, 2940, 180, false),
  ('SUB-BASE', 'Sub-base & base course', 'cum', 1850, 1295, 720, false),
  ('BITUM-W', 'Bituminous works package', 'cum', 980, 686, 1850, true),
  ('DRAIN-W', 'Drainage works alongside', 'm', 850, 595, 780, false),
  ('SAFETY', 'Road safety furniture', 'lot', 1, 1, 145000, false),
  ('MISC', 'Miscellaneous road works', 'lot', 1, 1, 95000, false)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Odisha'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='schedule' AND s.parent_id=sch.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'schedule', sch.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, sch.start_date, v.att
FROM schedules sch
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('SURVEY', 'Road alignment survey', 'lot', 1, 1, 75000, true),
  ('DESIGN', 'Pavement design & drawings', 'lot', 1, 1, 195000, false),
  ('EARTH-W', 'Earthwork & embankment', 'cum', 4200, 2940, 180, false),
  ('SUB-BASE', 'Sub-base & base course', 'cum', 1850, 1295, 720, false),
  ('BITUM-W', 'Bituminous works package', 'cum', 980, 686, 1850, true),
  ('DRAIN-W', 'Drainage works alongside', 'm', 850, 595, 780, false),
  ('SAFETY', 'Road safety furniture', 'lot', 1, 1, 145000, false),
  ('MISC', 'Miscellaneous road works', 'lot', 1, 1, 95000, false)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Andhra Pradesh'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='schedule' AND s.parent_id=sch.id AND s.spec_code=v.code);

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'schedule', sch.id, v.code, v.descr, v.unit, v.est, v.exec, v.rate, v.est * v.rate, sch.start_date, v.att
FROM schedules sch
JOIN work_orders wo ON sch.work_order_id = wo.id
JOIN projects p ON wo.project_id = p.id
CROSS JOIN LATERAL (VALUES
  ('SURVEY', 'Site survey & soil testing', 'lot', 1, 1, 65000, true),
  ('DESIGN', 'Substation design & SLD', 'lot', 1, 1, 225000, false),
  ('CIVIL-W', 'Civil & foundation works', 'cum', 320, 224, 5200, false),
  ('STRUCT-W', 'Structural erection works', 'lot', 1, 1, 285000, false),
  ('CABLE-W', 'Cable laying & termination', 'm', 2400, 1680, 680, true),
  ('EQUIP-W', 'Equipment installation', 'lot', 1, 1, 520000, false),
  ('TESTING', 'Testing & commissioning', 'lot', 1, 1, 185000, false),
  ('MISC', 'Miscellaneous electrical works', 'lot', 1, 1, 95000, false)
) AS v(code, descr, unit, est, exec, rate, att)
WHERE p.state = 'Uttar Pradesh'
  AND p.seq_no IN ('9.0.0','10.0.0','11.0.0','12.0.0','13.0.0','14.0.0')
  AND NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='schedule' AND s.parent_id=sch.id AND s.spec_code=v.code);
