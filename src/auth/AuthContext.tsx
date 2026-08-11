import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Role = 'admin' | 'management' | 'pm' | 'nodal' | 'site';

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: Role;
  roleLabel: string;
  accessLevel: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@epi.gov.in',
    password: 'admin123',
    name: 'A. Administrator',
    role: 'admin',
    roleLabel: 'Admin User',
    accessLevel: 'Full system setup, configuration, editing, and deletion rights',
  },
  {
    email: 'management@epi.gov.in',
    password: 'mgmt123',
    name: 'M. Executive',
    role: 'management',
    roleLabel: 'Executive Management',
    accessLevel: 'Read-only inquiry mode across all dashboards with report export rights',
  },
  {
    email: 'pm.sharma@epi.gov.in',
    password: 'pm123',
    name: 'P. Sharma',
    role: 'pm',
    roleLabel: 'Project Manager (PM)',
    accessLevel: 'Create/maintain Projects & Agencies, Save Draft and Finish Finalize actions',
  },
  {
    email: 'nodal.verma@epi.gov.in',
    password: 'nodal123',
    name: 'N. Verma',
    role: 'nodal',
    roleLabel: 'Nodal Officer',
    accessLevel: 'Maintain assigned Work Orders (WO), manage Payment entries, approve WO Value Escalations',
  },
  {
    email: 'site.singh@epi.gov.in',
    password: 'site123',
    name: 'S. Singh',
    role: 'site',
    roleLabel: 'Site Engineer',
    accessLevel: 'Track site progress against approved Work Order items',
  },
];

export interface Permissions {
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canFinalizeProject: boolean;
  canRequestAmendment: boolean;
  canManageWorkOrders: boolean;
  canLogPayments: boolean;
  canApproveEscalation: boolean;
  canViewDashboard: boolean;
  canViewMaintenance: boolean;
  canExportReports: boolean;
  canTrackDeviations: boolean;
  canDefineWOItems: boolean;
  canApproveWOItems: boolean;
  canTrackWOProgress: boolean;
  canUploadWODocuments: boolean;
}

export function getPermissions(role: Role): Permissions {
  switch (role) {
    case 'admin':
      return {
        canCreateProject: true,
        canEditProject: true,
        canDeleteProject: true,
        canFinalizeProject: true,
        canRequestAmendment: true,
        canManageWorkOrders: true,
        canLogPayments: true,
        canApproveEscalation: true,
        canViewDashboard: true,
        canViewMaintenance: true,
        canExportReports: true,
        canTrackDeviations: true,
        canDefineWOItems: true,
        canApproveWOItems: true,
        canTrackWOProgress: false,
        canUploadWODocuments: false,
      };
    case 'management':
      return {
        canCreateProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canFinalizeProject: false,
        canRequestAmendment: false,
        canManageWorkOrders: false,
        canLogPayments: false,
        canApproveEscalation: false,
        canViewDashboard: true,
        canViewMaintenance: true,
        canExportReports: true,
        canTrackDeviations: false,
        canDefineWOItems: false,
        canApproveWOItems: false,
        canTrackWOProgress: false,
        canUploadWODocuments: false,
      };
    case 'pm':
      return {
        canCreateProject: true,
        canEditProject: true,
        canDeleteProject: false,
        canFinalizeProject: true,
        canRequestAmendment: true,
        canManageWorkOrders: true,
        canLogPayments: false,
        canApproveEscalation: false,
        canViewDashboard: true,
        canViewMaintenance: true,
        canExportReports: true,
        canTrackDeviations: true,
        canDefineWOItems: true,
        canApproveWOItems: true,
        canTrackWOProgress: false,
        canUploadWODocuments: false,
      };
    case 'nodal':
      return {
        canCreateProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canFinalizeProject: false,
        canRequestAmendment: false,
        canManageWorkOrders: true,
        canLogPayments: true,
        canApproveEscalation: true,
        canViewDashboard: true,
        canViewMaintenance: true,
        canExportReports: true,
        canTrackDeviations: true,
        canDefineWOItems: true,
        canApproveWOItems: true,
        canTrackWOProgress: false,
        canUploadWODocuments: false,
      };
    case 'site':
      return {
        canCreateProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canFinalizeProject: false,
        canRequestAmendment: false,
        canManageWorkOrders: false,
        canLogPayments: false,
        canApproveEscalation: false,
        canViewDashboard: true,
        canViewMaintenance: true,
        canExportReports: false,
        canTrackDeviations: false,
        canDefineWOItems: false,
        canApproveWOItems: false,
        canTrackWOProgress: true,
        canUploadWODocuments: true,
      };
  }
}

interface AuthState {
  user: DemoUser | null;
  permissions: Permissions;
  login: (email: string, password: string) => boolean;
  loginAs: (user: DemoUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const SESSION_KEY = 'epi_auth_user_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (found) {
      setUser(found);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(found));
      return true;
    }
    return false;
  }, []);

  const loginAs = useCallback((demoUser: DemoUser) => {
    setUser(demoUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const permissions = user ? getPermissions(user.role) : getPermissions('site');

  return (
    <AuthContext.Provider value={{ user, permissions, login, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
