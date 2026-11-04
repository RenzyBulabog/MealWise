import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WeekNav from '../components/WeekNav';
import WeekStrip from '../components/WeekStrip';
import SlotCard from '../components/SlotCard';
import { randomMeal } from '../api/mealdb';
import { bus } from '../events';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, type } from '../theme';
import { SLOT_ORDER, type MealPreview, type Target } from '../types';
import { addDays, formatDay, formatLongDay, parseISO, toISO, weekDates } from '../utils/dates';

interface Props {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onPickFor: (target: Target) => void;
  onOpenMeal: (meal: MealPreview) => void;
}

export default function PlannerScreen({ selectedDate, onSelectDate, onPickFor, onOpenMeal }: Props) {
  const { plan, setMeal, removeMeal, clearDay } = usePlanner();
  const [filling, setFilling] = useState(false);

  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const today = toISO(new Date());
  const isCurrentWeek = dates.some((d) => toISO(d) === today);
  const day = plan[selectedDate] ?? {};
  const planned = SLOT_ORDER.filter((s) => day[s]).length;

  const shiftWeek = (weeks: number) => onSelectDate(toISO(addDays(parseISO(selectedDate), weeks * 7)));

  const fillEmpty = async () => {
    const empty = SLOT_ORDER.filter((s) => !day[s]);
    if (empty.length === 0) {
      bus.emit('toast', { message: 'Every slot is already planned for this day.', tone: 'info' });
      return;
    }
    setFilling(true);
    try {
      const meals = await Promise.all(empty.map(() => randomMeal()));
      meals.forEach((m, i) => setMeal(selectedDate, empty[i], m, { silent: true }));
      bus.emit('toast', {
        message: `Filled ${empty.length} empty ${empty.length === 1 ? 'slot' : 'slots'} on ${formatDay(selectedDate)}`,
        tone: 'success',
      });
    } catch (e) {
      bus.emit('toast', { message: e instanceof Error ? e.message : 'Could not fetch meals.', tone: 'danger' });
    } finally {
      setFilling(false);
    }
  };

  const confirmClear = () => {
    if (planned === 0) return;
    Alert.alert(`Clear ${formatDay(selectedDate)}?`, 'All planned meals for this day will be removed.', [
      { text: 'Keep meals', style: 'cancel' },
      {
        text: 'Clear day',
        style: 'destructive',
        onPress: () => {
          clearDay(selectedDate);
          bus.emit('toast', { message: `Cleared ${formatDay(selectedDate)}`, tone: 'info' });
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WeekNav
        dates={dates}
        isCurrentWeek={isCurrentWeek}
        onShift={shiftWeek}
        onToday={() => onSelectDate(today)}
      />
      <View style={{ height: 16 }} />
      <WeekStrip dates={dates} selected={selectedDate} today={today} plan={plan} onSelect={onSelectDate} />

      <View style={styles.dayHeader}>
        <Text style={type.h2}>{formatLongDay(selectedDate)}</Text>
        <Text style={type.small}>
          {planned === 0 ? 'Nothing planned' : `${planned} of ${SLOT_ORDER.length} planned`}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {SLOT_ORDER.map((slot) => (
          <SlotCard
            key={slot}
            slot={slot}
            meal={day[slot]}
            onAdd={() => onPickFor({ date: selectedDate, slot })}
            onSwap={() => onPickFor({ date: selectedDate, slot })}
            onOpen={() => day[slot] && onOpenMeal(day[slot]!)}
            onRemove={() => removeMeal(selectedDate, slot)}
          />
        ))}
      </View>

      <Text style={[type.small, styles.hint]}>Tap a meal to open it. Press and hold to swap it.</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={fillEmpty}
          disabled={filling}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }, filling && { opacity: 0.6 }]}
        >
          {filling ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Ionicons name="shuffle" size={18} color={colors.white} />
          )}
          <Text style={styles.primaryText}>{filling ? 'Picking meals' : 'Fill empty slots'}</Text>
        </Pressable>
        <Pressable
          onPress={confirmClear}
          disabled={planned === 0}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondary, planned === 0 && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.sili} />
          <Text style={styles.secondaryText}>Clear day</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  dayHeader: { marginTop: 26, marginBottom: 12, gap: 2 },
  hint: { textAlign: 'center', marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  primary: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.pandan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  secondary: {
    flexDirection: 'row',
    gap: 6,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.siliSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.sili, fontWeight: '800', fontSize: 15 },
});
