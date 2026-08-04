/*
# Seed project-level specs for the six new-state projects

1. Purpose
   Projects 9.0.0 through 14.0.0 (Guwahati Bridge, Delhi Sewer, Ahmedabad
   Drain, Bhubaneswar Road, Vizag Port Road, Lucknow Substation) currently
   have zero project-level specs, so their Spec modal shows "No specs match
   the current filter." Projects 1.0.0-8.0.0 each have 2 project-level specs
   and display fine. This migration gives each of the 6 missing projects
   6-8 tailored project-level spec line items so every project on the
   dashboard shows real specification details.

2. New data
   - 42 new project-level spec rows (level='project') across 6 projects.
   - Specs are tailored to each project's category/subcategory:
     * 9.0.0  Bridge -> survey, foundation, substructure, superstructure, deck, approach, misc
     * 10.0.0 Sewage -> survey, excavation, pipe laying, manholes, backfill, pump house, testing, misc
     * 11.0.0 Drain  -> survey, excavation, concrete, lining, grating, backfill, misc
     * 12.0.0 Road   -> survey, earthwork, subgrade, base, bituminous, paving, misc
     * 13.0.0 Road   -> survey, earthwork, subgrade, base, bituminous, paving, misc
     * 14.0.0 Substation -> survey, excavation, concrete, steel, cabling, equipment, testing, misc
   - Amount is provided directly in the VALUES table (rate * executed_qty).

3. Security
   - No schema changes. All inserts respect existing RLS policies
     (anon + authenticated). No destructive operations. Pure INSERT
     statements, idempotent via NOT EXISTS guards.

4. Notes
   - Financial values are in INR Lakhs.
   - `descr` alias used because `desc` is a reserved keyword.
   - Date literals cast with ::date in VALUES tables.
*/

INSERT INTO specs (level, parent_id, spec_code, description, unit, estimated_qty, executed_qty, rate, amount, measurement_date, has_attachment)
SELECT 'project', p.id, v.code, v.descr, v.unit, v.eq, v.xq, v.rate, v.amt, v.mdate::date, v.att
FROM projects p
JOIN (VALUES
  -- 9.0.0 Guwahati Bridge Construction (Bridges)
  ('9.0.0','SURVEY','Topographic & hydrological survey','lot',       1,    1,  120000,  120000,'2024-02-10',true),
  ('9.0.0','FOUNDATION','Bored pile foundation works','cum',       480,  450,   8500, 3825000,'2024-06-30',true),
  ('9.0.0','SUBSTRUCTURE','Pier & abutment construction','cum',    320,  240,  12500, 3000000,'2024-10-15',true),
  ('9.0.0','SUPERSTRUCTURE','Steel girder fabrication & erection','kg', 55000, 30000,     78, 2340000,'2025-01-20',true),
  ('9.0.0','DECK','Deck slab & wearing course','sqm',             580,  200,   1850,  370000,'2025-02-15',false),
  ('9.0.0','APPROACH','Approach road & embankment','cum',          750,  500,    450,  225000,'2024-12-01',false),
  ('9.0.0','MISC','Miscellaneous bridge works & railings','lot',     1,    1,  185000,  185000,'2025-03-01',false),

  -- 10.0.0 New Delhi Sewer Network Renewal (Sewage Plants)
  ('10.0.0','SURVEY','Alignment & GIS survey','lot',                 1,    1,   95000,   95000,'2023-10-20',true),
  ('10.0.0','EXCAVATION','Trench excavation for sewer network','cum', 4500, 2800,    280,  784000,'2024-02-15',true),
  ('10.0.0','PIPELAY','RCC NP3 pipe laying DN300-600','m',         8500, 5200,   1650, 8580000,'2024-05-01',true),
  ('10.0.0','MANHOLE','Precast manhole construction','no',          120,   80,  22500, 1800000,'2024-06-15',false),
  ('10.0.0','BACKFILL','Backfill & surface reinstatement','cum',   3200, 2000,    150,  300000,'2024-07-01',false),
  ('10.0.0','PUMP','Pump house civil & MEP works','lot',              1,    1, 420000, 420000,'2024-09-01',true),
  ('10.0.0','TESTING','Hydrotest & CCTV inspection','lot',            1,    0, 145000,       0,'2025-02-01',false),
  ('10.0.0','MISC','Miscellaneous sanitary works','lot',              1,    1,  95000,   95000,'2024-11-01',false),

  -- 11.0.0 Ahmedabad Storm Drain Network (Storm Drains)
  ('11.0.0','SURVEY','Hydrological & topographic survey','lot',       1,    1,   65000,   65000,'2024-01-15',true),
  ('11.0.0','EXCAVATION','Drain trench excavation','cum',         3200, 3200,    250,  800000,'2024-03-01',true),
  ('11.0.0','CONCRETE','PCC bedding & haunching','cum',             280,  280,   4200, 1176000,'2024-04-10',true),
  ('11.0.0','LINING','Concrete lining & waterproofing','sqm',     1450, 1450,    380,  551000,'2024-06-01',false),
  ('11.0.0','GRATING','Inlet grating & catch basin installation','no', 64, 64,  1250,   80000,'2024-07-15',true),
  ('11.0.0','BACKFILL','Backfill over drain','cum',               2200, 2200,    140,  308000,'2024-08-01',false),
  ('11.0.0','MISC','Miscellaneous drainage works','lot',             1,    1,   75000,   75000,'2024-09-01',false),

  -- 12.0.0 Bhubaneswar Road Widening Phase I (Roads)
  ('12.0.0','SURVEY','Road alignment & topographic survey','lot',     1,    1,   75000,   75000,'2024-03-25',true),
  ('12.0.0','EARTHWORK','Earthwork & embankment construction','cum', 4200, 2940,    180,  529200,'2024-06-01',true),
  ('12.0.0','SUBGRADE','Sub-grade preparation & compaction','sqm', 8500, 5950,     95,  565250,'2024-08-01',false),
  ('12.0.0','BASE','Sub-base & base course laying','cum',          1850, 1295,    720,  932400,'2024-10-15',true),
  ('12.0.0','BITUMEN','Bituminous concrete surfacing','cum',       360,  252,   3100,  781200,'2025-01-10',true),
  ('12.0.0','PAVING','Paver finishing & road markings','sqm',     6000, 3000,    120,  360000,'2025-02-15',false),
  ('12.0.0','MISC','Miscellaneous road works & safety furniture','lot', 1, 1, 145000, 145000,'2025-03-01',false),

  -- 13.0.0 Visakhapatnam Port Access Road (Roads)
  ('13.0.0','SURVEY','Road alignment & topographic survey','lot',     1,    1,   85000,   85000,'2024-01-15',true),
  ('13.0.0','EARTHWORK','Embankment fill & compaction','cum',      8000, 7000,    160, 1120000,'2024-04-01',true),
  ('13.0.0','SUBGRADE','Sub-grade preparation','sqm',           5000, 4000,     22,   88000,'2024-06-01',false),
  ('13.0.0','BASE','Sub-base & base course','cum',              1600, 1200,   2200, 2640000,'2024-08-15',true),
  ('13.0.0','BITUMEN','BC layer & tack coat','cum',               400,  200,   9500, 1900000,'2024-12-01',true),
  ('13.0.0','PAVING','Paver & roller finishing','sqm',          5000, 3000,    120,  360000,'2025-02-01',false),
  ('13.0.0','MISC','Miscellaneous road works & signage','lot',       1,    1,  125000,  125000,'2025-03-15',false),

  -- 14.0.0 Lucknow 132kV Substation & Cabling (Substations)
  ('14.0.0','SURVEY','Site survey & soil investigation','lot',         1,    1,   95000,   95000,'2023-07-10',true),
  ('14.0.0','EXCAVATION','Cable trench & foundation excavation','cum', 2500, 2500,   280,  700000,'2023-09-01',true),
  ('14.0.0','CONCRETE','RCC foundation & plinth concrete','cum',    350,  280,   5400, 1512000,'2023-12-15',true),
  ('14.0.0','STEEL','Reinforcement & structural steel','kg',      22000, 18000,     62, 1116000,'2023-11-20',true),
  ('14.0.0','CABLE','HV & LV cable laying','m',                   5000, 2700,    120,  324000,'2024-03-01',true),
  ('14.0.0','EQUIP','Transformer & switchgear installation','lot',   1,    0, 520000,       0,'2024-07-01',false),
  ('14.0.0','TESTING','Testing & commissioning','lot',               1,    0, 185000,       0,'2025-01-01',false),
  ('14.0.0','MISC','Miscellaneous electrical works','lot',           1,    1,   95000,   95000,'2024-05-01',false)
) AS v(proj_seq, code, descr, unit, eq, xq, rate, amt, mdate, att)
ON p.seq_no = v.proj_seq
WHERE NOT EXISTS (SELECT 1 FROM specs s WHERE s.level='project' AND s.parent_id = p.id AND s.spec_code = v.code);
