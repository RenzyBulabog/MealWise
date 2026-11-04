import React, { useMemo } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import WeekNav from '../components/WeekNav';
import { bus } from '../events';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, type } from '../theme';
import { SLOT_ORDER } from '../types';
import { addDays, formatRange, parseISO, toISO, weekDates } from '../utils/dates';

interface Item {
  key: string;
  name: string;
  measures: string[];
  meals: string[];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onGoPlan: () => void;
}

export default function GroceryScreen({ selectedDate, onSelectDate, onGoPlan }: Props) {
  const { plan, checked, toggleChecked, clearChecked } = usePlanner();

  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const weekISO = toISO(dates[0]);
  const today = toISO(new Date());
  const isCurrentWeek = dates.some((d) => toISO(d) === today);

  // Combine ingredients from every meal planned this week into one list.
  const items = useMemo(() => {
    const map = new Map<string, Item>();
    dates.forEach((d) => {
      const day = plan[toISO(d)];
      if (!day) return;
      SLOT_ORDER.forEach((slot) => {
        const meal = day[slot];
        if (!meal) return;
        meal.ingredients.forEach((ing) => {
          const key = ing.name.toLowerCase();
          let item = map.get(key);
          if (!item) {
            item = { key, name: capitalize(ing.name), measures: [], meals: [] };
            map.set(key, item);
          }
          if (ing.measure && !item.measures.includes(ing.measure)) item.measures.push(ing.measure);
          if (!item.meals.includes(meal.name)) item.meals.push(meal.name);
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [plan, dates]);

  const keyFor = (item: Item) => `${weekISO}|${item.key}`;
  const toBuy = items.filter((i) => !checked[keyFor(i)]);
  const inBasket = items.filter((i) => checked[keyFor(i)]);

  const shiftWeek = (weeks: number) => onSelectDate(toISO(addDays(parseISO(selectedDate), weeks * 7)));

  const shareList = async () => {
    const lines = toBuy.map((i) => `• ${i.name}${i.measures.length ? ` (${i.measures.join(', ')})` : ''}`);
    try {
      await Share.share({ message: `MealWise grocery list, ${formatRange(dates)}\n\n${lines.join('\n')}` });
    } catch {
      bus.emit('toast', { message: 'Could not open the share sheet.', tone: 'danger' });
    }
  };

  const renderRow = (item: Item, done: boolean) => (
    <Pressable
      key={item.key}
      onPress={() => toggleChecked(keyFor(item))}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.pandanSoft }]}
    >
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={26}
        color={done ? colors.pandan : colors.line}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, done && styles.done]}>{item.name}</Text>
        <Text style={[type.small, done && styles.done]} numberOfLines={1}>
          {[item.measures.join(', '), `for ${item.meals.length} ${item.meals.length === 1 ? 'meal' : 'meals'}`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WeekNav dates={dates} isCurrentWeek={isCurrentWeek} onShift={shiftWeek} onToday={() => onSelectDate(today)} />
      <Text style={[type.h3, { marginTop: 6 }]}>Groceries</Text>

      {items.length === 0 ? (
        <EmptyState
          icon="basket-outline"
          title="Your list is empty"
          message="Plan a few meals for this week and the ingredients land here, combined and ready to tick off."
          actionLabel="Plan meals"
          onAction={onGoPlan}
        />
      ) : (
        <>
          <View style={styles.actions}>
            <Pressable onPress={shareList} style={styles.share} accessibilityRole="button">
              <Ionicons name="share-outline" size={18} color={colors.white} />
              <Text style={styles.shareText}>Share list</Text>
            </Pressable>
            {inBasket.length > 0 && (
              <Pressable
                onPress={() => clearChecked(`${weekISO}|`)}
                style={styles.reset}
                accessibilityRole="button"
              >
                <Text style={styles.resetText}>Untick all</Text>
              </Pressable>
            )}
          </View>

          {toBuy.length > 0 ? (
            <>
              <Text style={styles.section}>To buy ({toBuy.length})</Text>
              <View style={styles.card}>{toBuy.map((i) => renderRow(i, false))}</View>
            </>
          ) : (
            <Text style={[type.h3, { marginTop: 24, textAlign: 'center' }]}>Everything is in the basket.</Text>
          )}

          {inBasket.length > 0 && (
            <>
              <Text style={styles.section}>In the basket ({inBasket.length})</Text>
              <View style={styles.card}>{inBasket.map((i) => renderRow(i, true))}</View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  share: {
    flexDirection: 'row',
    gap: 8,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.pandan,
    alignItems: 'center',
  },
  shareText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  reset: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.pandanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: colors.pandan, fontWeight: '800', fontSize: 14 },
  section: { ...type.h3, marginTop: 24, marginBottom: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  done: { textDecorationLine: 'line-through', color: colors.muted },
});
