import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type {
  BaseEntity, ViewType, Filters, Level, DelayStatus, Spec,
} from '@/types';
import { Header } from '@/components/Header';
import { StatusBar } from '@/components/StatusBar';
import { ViewControls } from '@/components/ViewControls';
import { BreadcrumbTiles } from '@/components/BreadcrumbTiles';
import { ChartView } from '@/components/ChartView';
import { TileView } from '@/components/TileView';
import { TableView } from '@/components/TableView';
import { CardView } from '@/components/CardView';
import { FilterDrawer } from '@/components/FilterDrawer';
import { SpecModal } from '@/components/SpecModal';
import { SubcategoryModal } from '@/components/SubcategoryModal';
import { TrackingScreen } from '@/components/TrackingScreen';

type NavLevel = 'project' | 'wo' | 'schedule' | 'tracking';

const LEVEL_LABELS: Record<NavLevel, string> = {
  project: 'Project Level',
  wo: 'WO Level',
  schedule: 'Schedule Level',
  tracking: 'Tracking Level',
};

const DRILL_LABELS: Record<NavLevel, string> = {
  project: 'Show WOs',
  wo: 'Show Schedules',
  schedule: 'Show Tracking',
  tracking: '',
};

const DEFAULT_FILTERS: Filters = {
  states: [],
  districts: [],
  categories: [],
  subcategories: [],
  delayStatuses: [],
  startMonth: '',
  endMonth: '',
};

export default function App() {
  const { data, loading, error } = useDashboardData();

  const [navLevel, setNavLevel] = useState<NavLevel>('project');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeWorkOrderId, setActiveWorkOrderId] = useState<string | null>(null);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

  const [viewType, setViewType] = useState<ViewType>('chart');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

  const [specModalItem, setSpecModalItem] = useState<{ item: BaseEntity; level: Level } | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<string | null>(null);

  // Get current level items
  const currentItems = useMemo<BaseEntity[]>(() => {
    if (!data) return [];
    if (navLevel === 'project') return data.projects;
    if (navLevel === 'wo') {
      return data.workOrders.filter((w) => w.project_id === activeProjectId);
    }
    if (navLevel === 'schedule') {
      return data.schedules.filter((s) => s.work_order_id === activeWorkOrderId);
    }
    return [];
  }, [data, navLevel, activeProjectId, activeWorkOrderId]);

  // Apply status DP filter
  const statusFilteredItems = useMemo(() => {
    if (!statusFilter) return currentItems;
    const statusMap: Record<string, DelayStatus | null> = {
      total: null,
      active: null,
      completed: null,
      inprogress: null,
      delayed: null,
      'On Time': 'On Time',
      'Delayed - Warning': 'Delayed - Warning',
      'Delayed - Serious': 'Delayed - Serious',
      'Delayed - Critical': 'Delayed - Critical',
    };
    const mappedStatus = statusMap[statusFilter];
    if (mappedStatus) {
      return currentItems.filter((i) => i.delay_status === mappedStatus);
    }
    if (statusFilter === 'completed') {
      return currentItems.filter((i) => i.completed_pct >= 100);
    }
    if (statusFilter === 'active' || statusFilter === 'inprogress') {
      return currentItems.filter((i) => i.completed_pct > 0 && i.completed_pct < 100);
    }
    if (statusFilter === 'delayed') {
      return currentItems.filter((i) => i.delay_status !== 'On Time');
    }
    return currentItems;
  }, [currentItems, statusFilter]);

  // Apply drawer filters
  const filteredItems = useMemo(() => {
    let result = statusFilteredItems;
    const f = appliedFilters;
    if (f.states.length > 0) {
      result = result.filter((i) => f.states.includes(i.state));
    }
    if (f.districts.length > 0) {
      result = result.filter((i) => f.districts.includes(i.district));
    }
    if (f.categories.length > 0) {
      result = result.filter((i) => f.categories.includes(i.category));
    }
    if (f.subcategories.length > 0) {
      result = result.filter((i) => f.subcategories.includes(i.subcategory));
    }
    if (f.delayStatuses.length > 0) {
      result = result.filter((i) => f.delayStatuses.includes(i.delay_status));
    }
    if (f.startMonth) {
      const startDate = new Date(f.startMonth + '-01');
      result = result.filter((i) => i.start_date && new Date(i.start_date) >= startDate);
    }
    if (f.endMonth) {
      const endDate = new Date(f.endMonth + '-01');
      result = result.filter((i) => i.start_date && new Date(i.start_date) <= endDate);
    }
    return result;
  }, [statusFilteredItems, appliedFilters]);

  // Parent breadcrumb items
  const parentItems = useMemo(() => {
    if (!data) return [];
    const parents: { label: string; item: BaseEntity; level: string }[] = [];
    if (navLevel === 'wo' && activeProjectId) {
      const p = data.projects.find((p) => p.id === activeProjectId);
      if (p) parents.push({ label: 'Project', item: p, level: 'project' });
    }
    if (navLevel === 'schedule') {
      if (activeProjectId) {
        const p = data.projects.find((p) => p.id === activeProjectId);
        if (p) parents.push({ label: 'Project', item: p, level: 'project' });
      }
      if (activeWorkOrderId) {
        const w = data.workOrders.find((w) => w.id === activeWorkOrderId);
        if (w) parents.push({ label: 'WO', item: w, level: 'wo' });
      }
    }
    if (navLevel === 'tracking') {
      if (activeProjectId) {
        const p = data.projects.find((p) => p.id === activeProjectId);
        if (p) parents.push({ label: 'Project', item: p, level: 'project' });
      }
      if (activeWorkOrderId) {
        const w = data.workOrders.find((w) => w.id === activeWorkOrderId);
        if (w) parents.push({ label: 'WO', item: w, level: 'wo' });
      }
      if (activeScheduleId) {
        const s = data.schedules.find((s) => s.id === activeScheduleId);
        if (s) parents.push({ label: 'Schedule', item: s, level: 'schedule' });
      }
    }
    return parents;
  }, [data, navLevel, activeProjectId, activeWorkOrderId, activeScheduleId]);

  const handleDrillDown = useCallback((item: BaseEntity) => {
    if (navLevel === 'project') {
      setActiveProjectId(item.id);
      setActiveWorkOrderId(null);
      setActiveScheduleId(null);
      setNavLevel('wo');
    } else if (navLevel === 'wo') {
      setActiveWorkOrderId(item.id);
      setActiveScheduleId(null);
      setNavLevel('schedule');
    } else if (navLevel === 'schedule') {
      setActiveScheduleId(item.id);
      setNavLevel('tracking');
    }
    setStatusFilter(null);
  }, [navLevel]);

  const handleBack = useCallback((level: string) => {
    if (level === 'project') {
      setNavLevel('project');
      setActiveProjectId(null);
      setActiveWorkOrderId(null);
      setActiveScheduleId(null);
    } else if (level === 'wo') {
      setNavLevel('wo');
      setActiveWorkOrderId(null);
      setActiveScheduleId(null);
    } else if (level === 'schedule') {
      setNavLevel('schedule');
      setActiveScheduleId(null);
    }
    setStatusFilter(null);
  }, []);

  const handleShowDetails = useCallback((item: BaseEntity, level?: string) => {
    const lvl: Level = (level as Level) || navLevel;
    setSpecModalItem({ item, level: lvl });
  }, [navLevel]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setFilterDrawerOpen(false);
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setStatusFilter(null);
  }, []);

  const isFiltered =
    appliedFilters.states.length > 0 ||
    appliedFilters.districts.length > 0 ||
    appliedFilters.categories.length > 0 ||
    appliedFilters.subcategories.length > 0 ||
    appliedFilters.delayStatuses.length > 0 ||
    Boolean(appliedFilters.startMonth) ||
    Boolean(appliedFilters.endMonth);

  const trackingEntries = useMemo(() => {
    if (!data || navLevel !== 'tracking' || !activeScheduleId) return [];
    return data.trackingEntries.filter((t) => t.schedule_id === activeScheduleId);
  }, [data, navLevel, activeScheduleId]);

  const activeSchedule = useMemo(() => {
    if (!data || !activeScheduleId) return null;
    return data.schedules.find((s) => s.id === activeScheduleId);
  }, [data, activeScheduleId]);

  const allSpecs: Spec[] = data?.specs ?? [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
          <span className="text-sm">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-red-600 font-medium mb-1">Failed to load data</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header levelLabel={`Dashboard - ${LEVEL_LABELS[navLevel]}`} />

      <StatusBar
        items={currentItems}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <ViewControls
        viewType={viewType}
        onViewTypeChange={setViewType}
        isFiltered={isFiltered || !!statusFilter}
        onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
        onClearFilters={handleClearAllFilters}
        levelLabel={viewType === 'chart' ? 'Chart View' : viewType === 'tile' ? 'Tile View' : viewType === 'table' ? 'Table View' : 'Card View'}
      />

      <BreadcrumbTiles
        parents={parentItems}
        onBack={handleBack}
        onShowDetails={(item, level) => handleShowDetails(item, level)}
      />

      {/* Main Content */}
      <div className="flex-1">
        {navLevel === 'tracking' ? (
          <TrackingScreen
            trackingEntries={trackingEntries}
            specs={allSpecs}
            scheduleSeqNo={activeSchedule?.seq_no ?? ''}
            scheduleTitle={activeSchedule?.title ?? ''}
          />
        ) : (
          <>
            {viewType === 'chart' && (
              <ChartView
                items={filteredItems}
                onCategoryClick={(cat) => setSubcategoryModal(cat)}
              />
            )}
            {viewType === 'tile' && (
              <TileView
                items={filteredItems}
                onShowDetails={(item) => handleShowDetails(item)}
                onDrillDown={handleDrillDown}
                drillLabel={DRILL_LABELS[navLevel]}
              />
            )}
            {viewType === 'table' && (
              <TableView
                items={filteredItems}
                onShowDetails={(item) => handleShowDetails(item)}
                onDrillDown={handleDrillDown}
                drillLabel={DRILL_LABELS[navLevel]}
              />
            )}
            {viewType === 'card' && (
              <CardView
                items={filteredItems}
                onShowDetails={(item) => handleShowDetails(item)}
                onDrillDown={handleDrillDown}
                drillLabel={DRILL_LABELS[navLevel]}
              />
            )}
          </>
        )}
      </div>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        items={currentItems}
      />

      {specModalItem && (
        <SpecModal
          item={specModalItem.item}
          level={specModalItem.level}
          specs={allSpecs}
          onClose={() => setSpecModalItem(null)}
        />
      )}

      {subcategoryModal && (
        <SubcategoryModal
          category={subcategoryModal}
          items={filteredItems}
          onClose={() => setSubcategoryModal(null)}
        />
      )}
    </div>
  );
}
