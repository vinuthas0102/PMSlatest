import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type {
  BaseEntity, ViewType, Filters, Level, DelayStatus, Spec,
} from '@/types';
import { Header } from '@/components/Header';
import { StatusBar } from '@/components/StatusBar';
import { ViewControls } from '@/components/ViewControls';
import { ChartView } from '@/components/ChartView';
import { TileView } from '@/components/TileView';
import { TableView } from '@/components/TableView';
import { CardView } from '@/components/CardView';
import { FilterDrawer } from '@/components/FilterDrawer';
import { SpecModal } from '@/components/SpecModal';
import { SubcategoryModal } from '@/components/SubcategoryModal';

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

  const [viewType, setViewType] = useState<ViewType>('chart');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

  const [specModalItem, setSpecModalItem] = useState<{ item: BaseEntity; level: Level } | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<string | null>(null);

  // Project-level items only
  const currentItems = useMemo<BaseEntity[]>(() => {
    if (!data) return [];
    return data.projects;
  }, [data]);

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

  const handleShowDetails = useCallback((item: BaseEntity) => {
    setSpecModalItem({ item, level: 'project' });
  }, []);

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
      <Header levelLabel="Project Dashboard" />

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

      {/* Main Content */}
      <div className="flex-1">
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
          />
        )}
        {viewType === 'table' && (
          <TableView
            items={filteredItems}
            onShowDetails={(item) => handleShowDetails(item)}
          />
        )}
        {viewType === 'card' && (
          <CardView
            items={filteredItems}
            onShowDetails={(item) => handleShowDetails(item)}
          />
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
