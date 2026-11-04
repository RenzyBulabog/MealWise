import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, floating, radius } from '../theme';
import type { IconName } from '../theme';

export type TabKey = 'plan' | 'discover' | 'groceries' | 'saved';

const TABS: { key: TabKey; label: string; icon: IconName; active: IconName }[] = [
  { key: 'plan', label: 'Plan', icon: 'calendar-outline', active: 'calendar' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline', active: 'compass' },
  { key: 'groceries', label: 'Groceries', icon: 'basket-outline', active: 'basket' },
  { key: 'saved', label: 'Saved', icon: 'heart-outline', active: 'heart' },
];

export default function TabBar({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.bar, floating]}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.item, active && styles.itemActive]}
            >
              <Ionicons
                name={active ? t.active : t.icon}
                size={22}
                color={active ? colors.pandanDeep : 'rgba(255,255,255,0.75)'}
              />
              {active && <Text style={styles.label}>{t.label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.pandan,
    borderRadius: radius.pill,
    padding: 6,
    gap: 4,
    width: '100%',
    justifyContent: 'space-between',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    minWidth: 52,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  itemActive: { backgroundColor: colors.calamansi },
  label: { fontWeight: '800', fontSize: 14, color: colors.pandanDeep },
});
