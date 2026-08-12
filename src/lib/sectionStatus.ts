import type { WOSection, WOSectionProgress, WorkOrder } from '@/types';

export interface SectionAggregatedDiscipline {
  discipline: string;
  totalRequired: number;
  totalExecuted: number;
  progressPct: number;
  itemCount: number;
}

export interface SectionStatusSummary {
  byDiscipline: SectionAggregatedDiscipline[];
  totalRequired: number;
  totalExecuted: number;
  progressPct: number;
  itemCount: number;
}

function parseTargetDeployment(target: string | null): number {
  if (!target) return 0;
  const match = target.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function latestProgressForSection(
  sectionId: string,
  progress: WOSectionProgress[],
): WOSectionProgress | null {
  const entries = progress.filter((e) => e.section_id === sectionId);
  if (entries.length === 0) return null;
  return entries.reduce((latest, e) =>
    new Date(e.created_at) > new Date(latest.created_at) ? e : latest,
  );
}

export type SectionType = 'equipment' | 'civil' | 'manpower';

export function aggregateSectionStatus(
  sections: WOSection[],
  progress: WOSectionProgress[],
  sectionType: SectionType,
  workOrders?: WorkOrder[] | null,
  options: { onlyApproved?: boolean } = {},
): SectionStatusSummary {
  const woIds = workOrders ? new Set(workOrders.map((w) => w.id)) : null;
  const filtered = sections.filter(
    (s) => s.section_type === sectionType && (woIds ? woIds.has(s.work_order_id) : true),
  );

  const disciplineMap = new Map<string, SectionAggregatedDiscipline>();

  for (const section of filtered) {
    if (options.onlyApproved && section.approval_status !== 'approved') continue;

    const discipline = section.discipline || 'Unspecified';
    let d = disciplineMap.get(discipline);
    if (!d) {
      d = {
        discipline,
        totalRequired: 0,
        totalExecuted: 0,
        progressPct: 0,
        itemCount: 0,
      };
      disciplineMap.set(discipline, d);
    }

    if (sectionType === 'manpower') {
      const target = parseTargetDeployment(section.target_deployment);
      const latest = latestProgressForSection(section.id, progress);
      const deployed = latest
        ? Number(latest.progress_value) || 0
        : (section.skilled_count || 0) + (section.unskilled_count || 0);
      d.totalRequired += target;
      d.totalExecuted += deployed;
    } else {
      const required = Number(section.required_qty) || 0;
      const latest = latestProgressForSection(section.id, progress);
      const executed = latest ? Number(latest.progress_value) || 0 : Number(section.executed_qty) || 0;
      d.totalRequired += required;
      d.totalExecuted += executed;
    }
    d.itemCount += 1;
  }

  const byDiscipline = Array.from(disciplineMap.values()).map((d) => ({
    ...d,
    progressPct:
      d.totalRequired > 0
        ? Math.min(100, (d.totalExecuted / d.totalRequired) * 100)
        : 0,
  }));

  const totalRequired = byDiscipline.reduce((s, d) => s + d.totalRequired, 0);
  const totalExecuted = byDiscipline.reduce((s, d) => s + d.totalExecuted, 0);
  const progressPct =
    totalRequired > 0 ? Math.min(100, (totalExecuted / totalRequired) * 100) : 0;

  return {
    byDiscipline,
    totalRequired,
    totalExecuted,
    progressPct,
    itemCount: byDiscipline.reduce((s, d) => s + d.itemCount, 0),
  };
}
