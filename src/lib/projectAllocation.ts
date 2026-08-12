import type { Project, WorkOrder, WorkOrderDetail } from '@/types';
import { calculateAllocationPct } from '@/lib/format';

export interface ProjectAllocation {
  value: number;
  percentage: number;
}

export function buildProjectAllocations(
  projects: Project[],
  workOrders: WorkOrder[],
  details: WorkOrderDetail[],
): Map<string, ProjectAllocation> {
  return new Map(projects.map((project) => {
    const value = workOrders
      .filter((workOrder) => workOrder.project_id === project.id)
      .reduce((total, workOrder) => {
        const detailValue = details.find((detail) => detail.work_order_id === workOrder.id)?.wo_value;
        return total + (Number(detailValue ?? workOrder.project_value) || 0);
      }, 0);

    return [project.id, {
      value,
      percentage: calculateAllocationPct(value, Number(project.project_value) || 0),
    }];
  }));
}
