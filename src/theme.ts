import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { TextStyle } from 'react-native';
import type { SlotKey } from './types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// Palette drawn from the Filipino kitchen: pandan, calamansi, ube, sili.
export const colors = {
  bg: '#F5F7F0',
  surface: '#FFFFFF',
  pandan: '#1F4D3A',
  pandanDeep: '#143528',
  pandanSoft: '#E2EDE6',
  calamansi: '#F2BF2B',
  calamansiSoft: '#FBF1CC',
  ube: '#6B4CB3',
  ubeSoft: '#ECE7F8',
  sili: '#D6452A',
  siliSoft: '#F8E2DC',
  ink: '#1E2E26',
  muted: '#66756D',
  line: '#DDE3D6',
  white: '#FFFFFF',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const floating = {
  shadowColor: colors.pandanDeep,
  shadowOpacity: 0.14,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

export const type: Record<'title' | 'h2' | 'h3' | 'body' | 'small', TextStyle> = {
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, color: colors.ink },
  h2: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontSize: 13, color: colors.muted },
};

export const slotMeta: Record<
  SlotKey,
  { label: string; icon: IconName; color: string; soft: string }
> = {
  breakfast: { label: 'Breakfast', icon: 'sunny-outline', color: colors.calamansi, soft: colors.calamansiSoft },
  lunch: { label: 'Lunch', icon: 'restaurant-outline', color: colors.pandan, soft: colors.pandanSoft },
  dinner: { label: 'Dinner', icon: 'moon-outline', color: colors.ube, soft: colors.ubeSoft },
  snack: { label: 'Snack', icon: 'cafe-outline', color: colors.sili, soft: colors.siliSoft },
};
