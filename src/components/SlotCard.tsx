import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MealImage from './MealImage';
import { colors, radius, slotMeta, type } from '../theme';
import type { Meal, SlotKey } from '../types';

interface Props {
  slot: SlotKey;
  meal?: Meal;
  onAdd: () => void;
  onOpen: () => void;
  onSwap: () => void;
  onRemove: () => void;
}

export default function SlotCard({ slot, meal, onAdd, onOpen, onSwap, onRemove }: Props) {
  const meta = slotMeta[slot];

  if (!meal) {
    return (
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={`Add ${meta.label.toLowerCase()}`}
        style={({ pressed }) => [styles.empty, pressed && { backgroundColor: meta.soft }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.soft }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color === colors.calamansi ? '#9A7500' : meta.color} />
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

  return (
    <Pressable
      onPress={onOpen}
      onLongPress={onSwap}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityHint="Long press to swap this meal"
      style={({ pressed }) => [styles.filled, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.bar, { backgroundColor: meta.color }]} />
      <MealImage uri={meal.thumb} size="small" style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <View style={styles.slotRow}>
          <Ionicons name={meta.icon} size={14} color={colors.muted} />
          <Text style={type.small}>{meta.label}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {meal.name}
        </Text>
        <Text style={type.small} numberOfLines={1}>
          {[meal.category, meal.area].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityLabel={`Remove ${meal.name}`}
        style={styles.remove}
      >
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingLeft: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, marginVertical: 2 },
  remove: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
