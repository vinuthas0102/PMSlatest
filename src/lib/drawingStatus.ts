import type { WOSection, WODrawingProgress, WorkOrder } from '@/types';

export interface DrawingAggregatedRow {
  discipline: string;
  itemCode: string | null;
  description: string | null;
  unit: string | null;
  cat1Total: number;
  cat2Total: number;
  cat3Total: number;
  cat1Completed: number;
  cat2Completed: number;
  cat3Completed: number;
  totalDrawings: number;
  totalCompleted: number;
  progressPct: number;
  sectionId: string;
  workOrderId: string;
}

export interface DrawingAggregatedDiscipline {
  discipline: string;
  cat1Total: number;
  cat2Total: number;
  cat3Total: number;
  cat1Completed: number;
  cat2Completed: number;
  cat3Completed: number;
  totalDrawings: number;
  totalCompleted: number;
  progressPct: number;
  itemCount: number;
}

export interface DrawingStatusSummary {
  rows: DrawingAggregatedRow[];
  byDiscipline: DrawingAggregatedDiscipline[];
  totalDrawings: number;
  totalCompleted: number;
  progressPct: number;
}

/**
 * Returns the latest drawing progress entry for a given section id.
 * wo_drawing_progress rows are assumed ordered by created_at desc elsewhere;
 * here we defensively pick the max created_at per section.
 */
function latestProgressForSection(
  sectionId: string,
  progress: WODrawingProgress[],
): WODrawingProgress | null {
  const entries = progress.filter((e) => e.section_id === sectionId);
  if (entries.length === 0) return null;
  return entries.reduce((latest, e) =>
    new Date(e.created_at) > new Date(latest.created_at) ? e : latest,
  );
}

/**
 * Aggregate drawing status across a set of work orders (typically the WOs
 * belonging to one project, or all WOs for the dashboard). Only approved
 * drawing sections are counted toward project-level progress, matching the
 * rule that progress can only be tracked after approval.
 */
export function aggregateDrawingStatus(
  sections: WOSection[],
  progress: WODrawingProgress[],
  workOrders?: WorkOrder[] | null,
  options: { onlyApproved?: boolean } = {},
): DrawingStatusSummary {
  const woIds = workOrders ? new Set(workOrders.map((w) => w.id)) : null;
  const drawingSections = sections.filter(
    (s) => s.section_type === 'drawing' && (woIds ? woIds.has(s.work_order_id) : true),
  );

  const rows: DrawingAggregatedRow[] = [];
  for (const section of drawingSections) {
    if (options.onlyApproved && section.approval_status !== 'approved') continue;
    const latest = latestProgressForSection(section.id, progress);
    const cat1Completed = latest?.cat1_completed ?? 0;
    const cat2Completed = latest?.cat2_completed ?? 0;
    const cat3Completed = latest?.cat3_completed ?? 0;
    const totalCompleted = latest?.total_completed ?? 0;
    const totalDrawings = Number(section.required_qty) || 0;
    const progressPct =
      totalDrawings > 0 ? Math.min(100, (totalCompleted / totalDrawings) * 100) : 0;
    rows.push({
      discipline: section.discipline || 'Unspecified',
      itemCode: section.item_code,
      description: section.description,
      unit: section.unit,
      cat1Total: Number(section.cat1_total) || 0,
      cat2Total: Number(section.cat2_total) || 0,
      cat3Total: Number(section.cat3_total) || 0,
      cat1Completed,
      cat2Completed,
      cat3Completed,
      totalDrawings,
      totalCompleted,
      progressPct,
      sectionId: section.id,
      workOrderId: section.work_order_id,
    });
  }

  // Group by discipline
  const disciplineMap = new Map<string, DrawingAggregatedDiscipline>();
  for (const row of rows) {
    const key = row.discipline;
    let d = disciplineMap.get(key);
    if (!d) {
      d = {
        discipline: key,
        cat1Total: 0, cat2Total: 0, cat3Total: 0,
        cat1Completed: 0, cat2Completed: 0, cat3Completed: 0,
        totalDrawings: 0, totalCompleted: 0, progressPct: 0, itemCount: 0,
      };
      disciplineMap.set(key, d);
    }
    d.cat1Total += row.cat1Total;
    d.cat2Total += row.cat2Total;
    d.cat3Total += row.cat3Total;
    d.cat1Completed += row.cat1Completed;
    d.cat2Completed += row.cat2Completed;
    d.cat3Completed += row.cat3Completed;
    d.totalDrawings += row.totalDrawings;
    d.totalCompleted += row.totalCompleted;
    d.itemCount += 1;
  }

  const byDiscipline = Array.from(disciplineMap.values()).map((d) => ({
    ...d,
    progressPct:
      d.totalDrawings > 0
        ? Math.min(100, (d.totalCompleted / d.totalDrawings) * 100)
        : 0,
  }));

  const totalDrawings = byDiscipline.reduce((s, d) => s + d.totalDrawings, 0);
  const totalCompleted = byDiscipline.reduce((s, d) => s + d.totalCompleted, 0);
  const progressPct =
    totalDrawings > 0 ? Math.min(100, (totalCompleted / totalDrawings) * 100) : 0;

  return { rows, byDiscipline, totalDrawings, totalCompleted, progressPct };
}
