import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, floating, radius } from '../theme';
import type { IconName } from '../theme';

export interface TabDef<K extends string> {
  key: K;
  label: string;
  icon: IconName;
  active: IconName;
}

export default function TabBar<K extends string>({
  tabs,
  tab,
  onChange,
}: {
  tabs: TabDef<K>[];
  tab: K;
  onChange: (key: K) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.bar, floating]}>
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: active }}
              style={[styles.item, active && styles.itemActive]}
            >
              <Ionicons name={active ? t.active : t.icon} size={22} color={active ? colors.pandanDeep : 'rgba(255,255,255,0.75)'} />
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
    gap: 2,
    width: '100%',
    justifyContent: 'space-between',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  itemActive: { backgroundColor: colors.calamansi, paddingHorizontal: 14 },
  label: { fontWeight: '800', fontSize: 14, color: colors.pandanDeep },
});
