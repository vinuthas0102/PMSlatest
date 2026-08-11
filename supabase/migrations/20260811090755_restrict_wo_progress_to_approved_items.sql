/*
# Restrict WO progress tracking to approved items only

## Purpose
Site engineers must not be allowed to record progress against work order items
that are still in `draft` or `pending_approval` status. Only `approved` items
are frozen in their definition and therefore safe to track site progress on.

## Changes
1. Replaces the permissive INSERT policy on `wo_section_progress` with one that
   only allows inserts when the referenced `wo_sections` row has
   `approval_status = 'approved'`.
2. Replaces the permissive UPDATE policy on `wo_section_progress` with the same
   approval check, so existing progress rows cannot be edited against
   non-approved items either.
3. SELECT and DELETE policies are left unchanged (read access remains open;
   deletion remains open for cleanup by the same client roles).

## Security
- RLS on `wo_section_progress` remains enabled.
- The new INSERT and UPDATE policies enforce `approval_status = 'approved'` on
  the parent `wo_sections` row via a correlated subquery, so a direct data API
  call cannot bypass the check the UI performs.
*/

-- INSERT: only allow progress inserts against approved sections
DROP POLICY IF EXISTS "anon_insert_wo_section_progress" ON wo_section_progress;
CREATE POLICY "anon_insert_wo_section_progress" ON wo_section_progress
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wo_sections
      WHERE wo_sections.id = wo_section_progress.section_id
        AND wo_sections.approval_status = 'approved'
    )
  );

-- UPDATE: only allow progress updates against approved sections
DROP POLICY IF EXISTS "anon_update_wo_section_progress" ON wo_section_progress;
CREATE POLICY "anon_update_wo_section_progress" ON wo_section_progress
  FOR UPDATE TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wo_sections
      WHERE wo_sections.id = wo_section_progress.section_id
        AND wo_sections.approval_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wo_sections
      WHERE wo_sections.id = wo_section_progress.section_id
        AND wo_sections.approval_status = 'approved'
    )
  );
