import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MealImage from './MealImage';
import { colors, radius, slotMeta, type } from '../theme';
import type { Meal, SlotKey } from '../types';

interface Props {
  slot: SlotKey;
  meal?: Meal;
  cooked: boolean;
  conflicts: string[];
  onAdd: () => void;
  onOpen: () => void;
  onSwap: () => void;
  onRemove: () => void;
  onToggleCooked: () => void;
  onEditCalories: () => void;
}

const iconColor = (c: string) => (c === colors.calamansi ? '#9A7500' : c);

export default function SlotCard(p: Props) {
  const meta = slotMeta[p.slot];

  if (!p.meal) {
    return (
      <Pressable
        onPress={p.onAdd}
        accessibilityRole="button"
        accessibilityLabel={`Add ${meta.label.toLowerCase()}`}
        style={({ pressed }) => [styles.empty, pressed && { backgroundColor: meta.soft }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.soft }]}>
          <Ionicons name={meta.icon} size={22} color={iconColor(meta.color)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>{meta.label}</Text>
          <Text style={type.small}>Nothing planned yet</Text>
        </View>
        <View style={[styles.addBtn, { backgroundColor: meta.soft }]}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </View>
      </Pressable>
    );
  }

  const meal = p.meal;
  return (
    <View style={styles.filled}>
      <View style={[styles.bar, { backgroundColor: meta.color }]} />
      <Pressable
        onPress={p.onOpen}
        onLongPress={p.onSwap}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityHint="Long press to swap this meal"
        style={({ pressed }) => [styles.top, pressed && { opacity: 0.85 }]}
      >
        <MealImage uri={meal.thumb} name={meal.name} size="small" style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <View style={styles.slotRow}>
            <Ionicons name={meta.icon} size={14} color={colors.muted} />
            <Text style={type.small}>{meta.label}</Text>
          </View>
          <Text style={[styles.name, p.cooked && styles.cookedName]} numberOfLines={2}>
            {meal.name}
          </Text>
          <Text style={type.small} numberOfLines={1}>
            {[meal.category, meal.area].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Pressable onPress={p.onRemove} hitSlop={10} accessibilityLabel={`Remove ${meal.name}`} style={styles.remove}>
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      </Pressable>

      <View style={styles.pills}>
        <Pressable onPress={p.onToggleCooked} style={[styles.pill, p.cooked && { backgroundColor: colors.pandan }]} accessibilityRole="button">
          <Ionicons name={p.cooked ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={p.cooked ? colors.white : colors.pandan} />
          <Text style={[styles.pillText, p.cooked && { color: colors.white }]}>{p.cooked ? 'Cooked' : 'Mark cooked'}</Text>
        </Pressable>
        <Pressable onPress={p.onEditCalories} style={styles.pill} accessibilityRole="button">
          <Ionicons name="flame-outline" size={16} color={colors.pandan} />
          <Text style={styles.pillText}>{meal.calories ? `${meal.calories} kcal` : 'Add kcal'}</Text>
        </Pressable>
      </View>

      {p.conflicts.length > 0 && (
        <View style={styles.warn}>
          <Ionicons name="warning-outline" size={16} color={colors.sili} />
          <Text style={styles.warnText} numberOfLines={2}>
            Contains {p.conflicts.slice(0, 3).join(', ')}
            {p.conflicts.length > 3 ? ` and ${p.conflicts.length - 3} more` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  iconWrap: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  filled: {
    padding: 10,
    paddingLeft: 16,
    gap: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, marginVertical: 2 },
  cookedName: { textDecorationLine: 'line-through', color: colors.muted },
  remove: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.pandanSoft,
  },
  pillText: { fontSize: 13, fontWeight: '700', color: colors.pandan },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: radius.sm, backgroundColor: colors.siliSoft },
  warnText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.sili },
});
