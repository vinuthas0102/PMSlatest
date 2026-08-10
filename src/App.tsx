import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/auth/AuthContext';
import type {
  BaseEntity, ViewType, Filters, Level, DelayStatus,
  Project, ProjectFormData, TrackingType, TrackingUpdate,
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
import { WorkOrderModal } from '@/components/WorkOrderModal';
import { LandingPage } from '@/components/LandingPage';
import { DPRPanel } from '@/components/DPRPanel';

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
  const { user, permissions } = useAuth();

  if (!user) {
    return <LandingPage />;
  }

  // Site Engineer only sees the DPR panel (Phase 6), but for now show a placeholder
  if (user.role === 'site') {
    return <DPRPanel name={user.name} />;
  }

  return <DashboardApp />;
}



function DashboardApp() {
  const { permissions } = useAuth();
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
  const [workOrderProject, setWorkOrderProject] = useState<Project | null>(null);

  // Determine the effective screen based on permissions
  const effectiveScreen: AppScreen = permissions.canViewMaintenance ? activeScreen : 'dashboard';

  const handleScreenChange = useCallback((s: AppScreen) => {
    setActiveScreen(s);
    if (s === 'maintenance') {
      setViewType('tile');
    } else {
      setViewType('chart');
    }
  }, []);

  const currentItems = useMemo<BaseEntity[]>(() => {
    if (!data) return [];
    return data.projects;
  }, [data]);

  const drawerFilteredItems = useMemo(() => {
    let result = currentItems;
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
  }, [currentItems, appliedFilters]);

  const filteredItems = useMemo(() => {
    if (!statusFilter) return drawerFilteredItems;
    if (statusFilter === 'completed') {
      return drawerFilteredItems.filter((i) => i.completed_pct >= 100);
    }
    if (statusFilter === 'active' || statusFilter === 'inprogress') {
      return drawerFilteredItems.filter((i) => i.completed_pct > 0 && i.completed_pct < 100);
    }
    if (statusFilter === 'delayed') {
      return drawerFilteredItems.filter((i) => i.delay_status !== 'On Time');
    }
    const delayStatusMap: Record<string, DelayStatus> = {
      'On Time': 'On Time',
      'Delayed - Warning': 'Delayed - Warning',
      'Delayed - Serious': 'Delayed - Serious',
      'Delayed - Critical': 'Delayed - Critical',
    };
    if (delayStatusMap[statusFilter]) {
      return drawerFilteredItems.filter((i) => i.delay_status === delayStatusMap[statusFilter]);
    }
    return drawerFilteredItems;
  }, [drawerFilteredItems, statusFilter]);

  const handleShowDetails = useCallback((item: BaseEntity) => {
    if (effectiveScreen === 'maintenance') {
      setProjectFormModal({ project: item as Project, mode: 'edit' });
    } else {
      setSpecModalItem({ item, level: 'project' });
    }
  }, [effectiveScreen]);

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

  const handleSaveTrackingUpdate = useCallback(async (entry: {
    project_id: string;
    tracking_type: TrackingType;
    deviation_value: string;
    officer_name: string;
    remarks: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: insertError } = await supabase
        .from('project_tracking_updates')
        .insert(entry);
      if (insertError) {
        console.error('Tracking update insert failed', insertError);
        return { success: false, error: 'Could not save the tracking update. Please try again.' };
      }
      sessionStorage.removeItem('pms_data_v7');
      await reload();
      return { success: true };
    } catch (e) {
      console.error('Tracking update save failed', e);
      return { success: false, error: 'Something went wrong while saving. Please try again.' };
    }
  }, [reload]);

  const handleSaveProject = useCallback(async (id: string | null, formData: ProjectFormData, status: 'draft' | 'finalized'): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        description: formData.description || null,
        project_type: formData.project_type,
        project_code: formData.project_code || null,
        segment_id: formData.segment_id || null,
        client_name: formData.client_name || null,
        contract_type_id: formData.contract_type_id || null,
        scheme_id: formData.scheme_id || null,
        tender_ref_number: formData.tender_ref_number || null,
        site_city: formData.site_city || null,
        region_id: formData.region_id || null,
        site_address_a: formData.site_address_a || null,
        site_address_b: formData.site_address_b || null,
        pin_code: formData.pin_code || null,
        engineer_incharge_id: formData.engineer_incharge_id || null,
        phone_number: formData.phone_number || null,
        email_id: formData.email_id || null,
        work_category_id: formData.work_category_id || null,
        state: formData.state,
        status,
        district: formData.district,
        category: formData.category,
        subcategory: formData.subcategory,
        start_date: formData.start_date || null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days, 10) : null,
        mbook_entry: formData.mbook_entry ? parseFloat(formData.mbook_entry) : 0,
        project_value: formData.project_value ? parseFloat(formData.project_value) : 0,
        workorder_value: formData.workorder_value ? parseFloat(formData.workorder_value) : 0,
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : 0,
        sd_bg_number: formData.sd_bg_number || null,
        sd_bg_valid_from: formData.sd_bg_valid_from || null,
        sd_bg_valid_to: formData.sd_bg_valid_to || null,
        claim_period_upto: formData.claim_period_upto || null,
        drawing_pct: parseFloat(formData.drawing_pct) || 0,
        supply_pct: parseFloat(formData.supply_pct) || 0,
        civil_pct: parseFloat(formData.civil_pct) || 0,
        manpower_pct: parseFloat(formData.manpower_pct) || 0,
        others_pct: parseFloat(formData.others_pct) || 0,
        manager: formData.manager,
        remarks: formData.remarks || null,
      };

      if (id) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', id);
        if (updateError) {
          console.error('Project update failed', updateError);
          return { success: false, error: 'Could not save your changes. Please check the values and try again.' };
        }
      } else {
        const maxSeq = data?.projects.reduce((max, p) => {
          const n = parseFloat(p.seq_no);
          return isNaN(n) ? max : Math.max(max, n);
        }, 0) ?? 0;
        const nextSeqNo = `${maxSeq + 1}.0.0`;
        const nextCode = `PRJ-${String(maxSeq + 1).padStart(3, '0')}`;

        const insertPayload = {
          ...payload,
          title: formData.title,
          seq_no: nextSeqNo,
          code: nextCode,
        };
        const { error: insertError } = await supabase
          .from('projects')
          .insert(insertPayload);
        if (insertError) {
          console.error('Project insert failed', insertError);
          return {
            success: false,
            error: 'Could not create the project. Please check the values and try again.',
          };
        }
      }

      sessionStorage.removeItem('pms_data_v7');
      await reload();
      return { success: true };
    } catch (e) {
      console.error('Project save failed', e);
      return { success: false, error: 'Something went wrong while saving. Please try again.' };
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

  const allTrackingUpdates: TrackingUpdate[] = data?.trackingUpdates ?? [];

  const isMaintenance = effectiveScreen === 'maintenance';

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
        items={drawerFilteredItems}
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
            trackingUpdates={allTrackingUpdates}
            onShowDetails={(item) => handleShowDetails(item)}
            onCreateNew={isMaintenance && permissions.canCreateProject ? () => setProjectFormModal({ project: null, mode: 'create' }) : undefined}
            onShowWorkOrders={(item) => setWorkOrderProject(item as Project)}
          />
        )}
        {(!isMaintenance ? viewType === 'table' : viewType === 'table') && (
          <TableView
            items={filteredItems}
            onShowDetails={(item) => handleShowDetails(item)}
            onCreateNew={isMaintenance && permissions.canCreateProject ? () => setProjectFormModal({ project: null, mode: 'create' }) : undefined}
            onShowWorkOrders={(item) => setWorkOrderProject(item as Project)}
          />
        )}
        {(!isMaintenance ? viewType === 'card' : viewType === 'card') && (
          <CardView
            items={filteredItems}
            onShowDetails={(item) => handleShowDetails(item)}
            onCreateNew={isMaintenance && permissions.canCreateProject ? () => setProjectFormModal({ project: null, mode: 'create' }) : undefined}
            onShowWorkOrders={(item) => setWorkOrderProject(item as Project)}
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
          trackingUpdates={allTrackingUpdates}
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

      {workOrderProject && data && (
        <WorkOrderModal
          project={workOrderProject}
          workOrders={data.workOrders}
          details={data.workOrderDetails}
          sections={data.woSections}
          payments={data.paymentEntries}
          trackingUpdates={allTrackingUpdates}
          onClose={() => setWorkOrderProject(null)}
          onReload={reload}
          onSaveTrackingUpdate={handleSaveTrackingUpdate}
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
