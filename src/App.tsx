import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDashboardData } from '@/hooks/useDashboardData';
import type {
  BaseEntity, ViewType, Filters, Level, DelayStatus, Spec,
  Project, ProjectFormData,
} from '@/types';
import { Header, type AppScreen } from '@/components/Header';
import { StatusBar } from '@/components/StatusBar';
import { ViewControls } from '@/components/ViewControls';
import { ChartView } from '@/components/ChartView';
import { TileView } from '@/components/TileView';
import { TableView } from '@/components/TableView';
import { CardView } from '@/components/CardView';
import { FilterDrawer } from '@/components/FilterDrawer';
import { SpecModal } from '@/components/SpecModal';
import { SubcategoryModal } from '@/components/SubcategoryModal';
import { ProjectFormModal } from '@/components/ProjectFormModal';

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
  const { data, loading, error, reload } = useDashboardData();

  const [activeScreen, setActiveScreen] = useState<AppScreen>('dashboard');
  const [viewType, setViewType] = useState<ViewType>('chart');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

  const [specModalItem, setSpecModalItem] = useState<{ item: BaseEntity; level: Level } | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<string | null>(null);
  const [projectFormModal, setProjectFormModal] = useState<{ project: Project | null; mode: 'edit' | 'create' } | null>(null);

  // When switching to maintenance screen, default to tile view
  const handleScreenChange = useCallback((s: AppScreen) => {
    setActiveScreen(s);
    if (s === 'maintenance') {
      setViewType('tile');
    } else {
      setViewType('chart');
    }
  }, []);

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
    if (activeScreen === 'maintenance') {
      setProjectFormModal({ project: item as Project, mode: 'edit' });
    } else {
      setSpecModalItem({ item, level: 'project' });
    }
  }, [activeScreen]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setFilterDrawerOpen(false);
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  const handleToggleChartSelection = useCallback((field: 'states' | 'categories' | 'delayStatuses', value: string) => {
    setFilters((prev) => {
      const arr = prev[field] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      const updated = { ...prev, [field]: next } as Filters;
      setAppliedFilters(updated);
      return updated;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setStatusFilter(null);
  }, []);

  // Save project (create or update)
  const handleSaveProject = useCallback(async (id: string | null, formData: ProjectFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        state: formData.state,
        district: formData.district,
        category: formData.category,
        subcategory: formData.subcategory,
        start_date: formData.start_date || null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days, 10) : null,
        mbook_entry: formData.mbook_entry ? parseFloat(formData.mbook_entry) : 0,
        manager: formData.manager,
        remarks: formData.remarks || null,
      };

      if (id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', id);
        if (updateError) return { success: false, error: updateError.message };
      } else {
        // Create new - compute next seq_no
        const maxSeq = data?.projects.reduce((max, p) => {
          const n = parseFloat(p.seq_no);
          return isNaN(n) ? max : Math.max(max, n);
        }, 0) ?? 0;
        const nextSeqNo = `${maxSeq + 1}.0.0`;
        const nextCode = `PRJ-${String(maxSeq + 1).padStart(3, '0')}`;

        const insertPayload = {
          ...payload,
          seq_no: nextSeqNo,
          code: nextCode,
          delay_status: 'On Time' as const,
        };
        const { error: insertError } = await supabase
          .from('projects')
          .insert(insertPayload);
        if (insertError) return { success: false, error: insertError.message };
      }

      // Clear cache and reload
      sessionStorage.removeItem('pms_data_v5');
      await reload();
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }, [data, reload]);

  const isFiltered =
    appliedFilters.states.length > 0 ||
    appliedFilters.districts.length > 0 ||
    appliedFilters.categories.length > 0 ||
    appliedFilters.subcategories.length > 0 ||
    appliedFilters.delayStatuses.length > 0 ||
    Boolean(appliedFilters.startMonth) ||
    Boolean(appliedFilters.endMonth);

  const allSpecs: Spec[] = data?.specs ?? [];

  const isMaintenance = activeScreen === 'maintenance';

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

  const levelLabel = isMaintenance ? 'Project Summary' : 'Project Dashboard';
  const viewLabel = isMaintenance
    ? viewType === 'tile' ? 'Tile View' : viewType === 'table' ? 'Table View' : 'Card View'
    : viewType === 'chart' ? 'Chart View' : viewType === 'tile' ? 'Tile View' : viewType === 'table' ? 'Table View' : 'Card View';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header levelLabel={levelLabel} activeScreen={activeScreen} onScreenChange={handleScreenChange} />

      <StatusBar
        items={filteredItems}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <ViewControls
        viewType={viewType}
        onViewTypeChange={setViewType}
        isFiltered={isFiltered || !!statusFilter}
        onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
        onClearFilters={handleClearAllFilters}
        levelLabel={viewLabel}
        hideChartView={isMaintenance}
      />

      {/* Main Content */}
      <div className="flex-1">
        {!isMaintenance && viewType === 'chart' && (
          <ChartView
            items={filteredItems}
            selectedStates={appliedFilters.states}
            selectedCategories={appliedFilters.categories}
            selectedDelayStatuses={appliedFilters.delayStatuses}
            onToggleSelection={handleToggleChartSelection}
          />
        )}
        {(!isMaintenance ? viewType === 'tile' : viewType === 'tile') && (
          <TileView
            items={filteredItems}
            onShowDetails={(item) => handleShowDetails(item)}
            onCreateNew={isMaintenance ? () => setProjectFormModal({ project: null, mode: 'create' }) : undefined}
          />
        )}
        {(!isMaintenance ? viewType === 'table' : viewType === 'table') && (
          <TableView
            items={filteredItems}
            onShowDetails={(item) => handleShowDetails(item)}
            onCreateNew={isMaintenance ? () => setProjectFormModal({ project: null, mode: 'create' }) : undefined}
          />
        )}
        {(!isMaintenance ? viewType === 'card' : viewType === 'card') && (
          <CardView
            items={filteredItems}
            onShowDetails={(item) => handleShowDetails(item)}
            onCreateNew={isMaintenance ? () => setProjectFormModal({ project: null, mode: 'create' }) : undefined}
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

      {specModalItem && !isMaintenance && (
        <SpecModal
          item={specModalItem.item}
          level={specModalItem.level}
          specs={allSpecs}
          onClose={() => setSpecModalItem(null)}
        />
      )}

      {projectFormModal && isMaintenance && (
        <ProjectFormModal
          project={projectFormModal.project}
          mode={projectFormModal.mode}
          onClose={() => setProjectFormModal(null)}
          onSave={handleSaveProject}
        />
      )}

      {subcategoryModal && !isMaintenance && (
        <SubcategoryModal
          category={subcategoryModal}
          items={filteredItems}
          onClose={() => setSubcategoryModal(null)}
        />
      )}
    </div>
  );
}
