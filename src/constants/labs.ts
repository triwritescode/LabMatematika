import { Operation } from '@/curriculum/types';

// Per-lab identity colors (specs §14) + soft tints for cards and meters.
export const LabColors: Record<
  Operation,
  { main: string; soft: string; softDark: string; onMain: string }
> = {
  add: { main: '#3B82F6', soft: '#DBEAFE', softDark: '#1E3A5F', onMain: '#FFFFFF' },
  sub: { main: '#EF4444', soft: '#FEE2E2', softDark: '#5F1E1E', onMain: '#FFFFFF' },
  mul: { main: '#22C55E', soft: '#DCFCE7', softDark: '#1E5F2E', onMain: '#FFFFFF' },
  div: { main: '#EAB308', soft: '#FEF9C3', softDark: '#5F4E1E', onMain: '#FFFFFF' },
};

export const StreakColor = '#F97316';
