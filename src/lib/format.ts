import type { DelayStatus } from '@/types';

export function formatINR(lakhs: number): string {
  if (lakhs >= 100) {
    return `₹${(lakhs / 100).toFixed(2)} Cr`;
  }
  return `₹${lakhs.toFixed(1)} L`;
}

export function formatINRShort(lakhs: number): string {
  if (lakhs >= 100) {
    return `₹${(lakhs / 100).toFixed(1)}Cr`;
  }
  return `₹${lakhs.toFixed(0)}L`;
}

export function formatPct(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(date: string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function delayStatusColor(status: DelayStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'On Time':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'Delayed - Warning':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'Delayed - Serious':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
    case 'Delayed - Critical':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
  }
}

export function delayStatusShort(status: DelayStatus): string {
  switch (status) {
    case 'On Time':
      return 'On Time';
    case 'Delayed - Warning':
      return 'Warning';
    case 'Delayed - Serious':
      return 'Serious';
    case 'Delayed - Critical':
      return 'Critical';
  }
}

export const DELAY_STATUSES: DelayStatus[] = [
  'On Time',
  'Delayed - Warning',
  'Delayed - Serious',
  'Delayed - Critical',
];

export const CATEGORIES = [
  'Civil & Structures',
  'Water & Sanitation',
  'Electrical & HVAC',
];

export const SUBCATEGORIES: Record<string, string[]> = {
  'Civil & Structures': ['Flyovers', 'Buildings', 'Roads'],
  'Water & Sanitation': ['Pipeline Laying', 'Sewage Plants', 'Storm Drains'],
  'Electrical & HVAC': ['Substations', 'Street Lighting'],
};

export const STATES = [
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Assam',
  'Delhi',
  'Gujarat',
  'Odisha',
  'Andhra Pradesh',
  'Uttar Pradesh',
];

export const DISTRICTS: Record<string, string[]> = {
  Karnataka: ['Bengaluru Urban', 'Mysuru'],
  Maharashtra: ['Pune', 'Nagpur', 'Mumbai'],
  'Tamil Nadu': ['Chennai', 'Coimbatore'],
  Assam: ['Guwahati', 'Dibrugarh'],
  Delhi: ['New Delhi', 'Dwarka'],
  Gujarat: ['Ahmedabad', 'Surat'],
  Odisha: ['Bhubaneswar', 'Cuttack'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada'],
  'Uttar Pradesh': ['Lucknow', 'Noida'],
};
