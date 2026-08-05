-- Re-seed specs.amount so each spec row holds its proportional share of its
-- parent's MBook Entry value (in lakhs), guaranteeing that the spec rows for a
-- given parent sum exactly to that parent's mbook_entry. This puts the amount
-- column in the same unit (lakhs) as the project/work-order/schedule/tracking
-- financials already use, so the on-screen Total Amount reconciles with the
-- MBook Entry shown in the Financials section.
--
-- Formula per spec:
--   amount = parent.mbook_entry * (rate * estimated_qty) / SUM(rate * estimated_qty)
-- for all specs sharing that parent. Specs with zero executed qty still receive
-- their planned share so the total always reconciles.

-- Helper: recompute amounts for specs whose parent lives in a given table.
-- We do this per parent table because the parent_id column is polymorphic
-- (it references projects, work_orders, schedules, or tracking_entries
-- depending on the level).

-- 1) Project-level specs
WITH parent_totals AS (
  SELECT
    s.parent_id,
    SUM(s.rate * s.estimated_qty) AS planned_total
  FROM specs s
  WHERE s.level = 'project'
  GROUP BY s.parent_id
),
spec_shares AS (
  SELECT
    s.id,
    p.mbook_entry * (s.rate * s.estimated_qty) / NULLIF(pt.planned_total, 0) AS new_amount
  FROM specs s
  JOIN projects p ON p.id = s.parent_id
  JOIN parent_totals pt ON pt.parent_id = s.parent_id
  WHERE s.level = 'project'
)
UPDATE specs
SET amount = COALESCE(ss.new_amount, 0)
FROM spec_shares ss
WHERE specs.id = ss.id;

-- 2) Work-order-level specs
WITH parent_totals AS (
  SELECT
    s.parent_id,
    SUM(s.rate * s.estimated_qty) AS planned_total
  FROM specs s
  WHERE s.level = 'wo'
  GROUP BY s.parent_id
),
spec_shares AS (
  SELECT
    s.id,
    p.mbook_entry * (s.rate * s.estimated_qty) / NULLIF(pt.planned_total, 0) AS new_amount
  FROM specs s
  JOIN work_orders p ON p.id = s.parent_id
  JOIN parent_totals pt ON pt.parent_id = s.parent_id
  WHERE s.level = 'wo'
)
UPDATE specs
SET amount = COALESCE(ss.new_amount, 0)
FROM spec_shares ss
WHERE specs.id = ss.id;

-- 3) Schedule-level specs
WITH parent_totals AS (
  SELECT
    s.parent_id,
    SUM(s.rate * s.estimated_qty) AS planned_total
  FROM specs s
  WHERE s.level = 'schedule'
  GROUP BY s.parent_id
),
spec_shares AS (
  SELECT
    s.id,
    p.mbook_entry * (s.rate * s.estimated_qty) / NULLIF(pt.planned_total, 0) AS new_amount
  FROM specs s
  JOIN schedules p ON p.id = s.parent_id
  JOIN parent_totals pt ON pt.parent_id = s.parent_id
  WHERE s.level = 'schedule'
)
UPDATE specs
SET amount = COALESCE(ss.new_amount, 0)
FROM spec_shares ss
WHERE specs.id = ss.id;

-- 4) Tracking-level specs
WITH parent_totals AS (
  SELECT
    s.parent_id,
    SUM(s.rate * s.estimated_qty) AS planned_total
  FROM specs s
  WHERE s.level = 'tracking'
  GROUP BY s.parent_id
),
spec_shares AS (
  SELECT
    s.id,
    p.mbook_entry * (s.rate * s.estimated_qty) / NULLIF(pt.planned_total, 0) AS new_amount
  FROM specs s
  JOIN tracking_entries p ON p.id = s.parent_id
  JOIN parent_totals pt ON pt.parent_id = s.parent_id
  WHERE s.level = 'tracking'
)
UPDATE specs
SET amount = COALESCE(ss.new_amount, 0)
FROM spec_shares ss
WHERE specs.id = ss.id;
