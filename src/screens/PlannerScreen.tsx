import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PromptModal from '../components/PromptModal';
import SlotCard from '../components/SlotCard';
import WeekNav from '../components/WeekNav';
import WeekStrip from '../components/WeekStrip';
import { Button } from '../components/ui';
import { randomMeal } from '../api/mealdb';
import { bus } from '../events';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, slotMeta, type } from '../theme';
import { SLOT_ORDER, type MealPreview, type SlotKey, type Target } from '../types';
import { conflicts } from '../utils/diet';
import { addDays, formatDay, formatLongDay, formatRange, parseISO, toISO, weekDates } from '../utils/dates';

interface Props {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onPickFor: (target: Target) => void;
  onOpenMeal: (meal: MealPreview) => void;
}

export default function PlannerScreen({ selectedDate, onSelectDate, onPickFor, onOpenMeal }: Props) {
  const { plan, cooked, profile, setMeal, removeMeal, clearDay, copyDay, copyWeek, toggleCooked, setCalories } = usePlanner();
  const [filling, setFilling] = useState(false);
  const [kcalSlot, setKcalSlot] = useState<SlotKey | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);

  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const weekStart = toISO(dates[0]);
  const today = toISO(new Date());
  const isCurrentWeek = dates.some((d) => toISO(d) === today);
  const day = plan[selectedDate] ?? {};
  const planned = SLOT_ORDER.filter((s) => day[s]).length;
  const kcal = SLOT_ORDER.reduce((sum, s) => sum + (day[s]?.calories ?? 0), 0);

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

  const shareWeek = async () => {
    const lines: string[] = [`MealWise plan, ${formatRange(dates)}`, ''];
    dates.forEach((d) => {
      const iso = toISO(d);
      const meals = SLOT_ORDER.filter((s) => plan[iso]?.[s]).map((s) => `  ${slotMeta[s].label}: ${plan[iso]![s]!.name}`);
      if (meals.length) lines.push(formatLongDay(iso), ...meals, '');
    });
    if (lines.length <= 2) {
      bus.emit('toast', { message: 'Plan some meals first, then share the week.', tone: 'info' });
      return;
    }
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      bus.emit('toast', { message: 'Could not open the share sheet.', tone: 'danger' });
    }
  };

  const copyTargets = Array.from({ length: 14 }, (_, i) => toISO(addDays(new Date(), i))).filter((d) => d !== selectedDate);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WeekNav dates={dates} isCurrentWeek={isCurrentWeek} onShift={shiftWeek} onToday={() => onSelectDate(today)} />
      <View style={{ height: 16 }} />
      <WeekStrip dates={dates} selected={selectedDate} today={today} plan={plan} onSelect={onSelectDate} />

      <View style={styles.dayHeader}>
        <Text style={type.h2}>{formatLongDay(selectedDate)}</Text>
        <Text style={type.small}>
          {planned === 0 ? 'Nothing planned' : `${planned} of ${SLOT_ORDER.length} planned`}
          {kcal > 0 ? ` · ${kcal}${profile.calorieGoal ? ` of ${profile.calorieGoal}` : ''} kcal` : ''}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {SLOT_ORDER.map((slot) => {
          const meal = day[slot];
          return (
            <SlotCard
              key={slot}
              slot={slot}
              meal={meal}
              cooked={!!cooked[`${selectedDate}|${slot}`]}
              conflicts={meal ? conflicts(meal, profile) : []}
              onAdd={() => onPickFor({ date: selectedDate, slot })}
              onSwap={() => onPickFor({ date: selectedDate, slot })}
              onOpen={() => meal && onOpenMeal(meal)}
              onRemove={() => removeMeal(selectedDate, slot)}
              onToggleCooked={() => toggleCooked(selectedDate, slot)}
              onEditCalories={() => setKcalSlot(slot)}
            />
          );
        })}
      </View>

      <Text style={[type.small, styles.hint]}>Tap a meal to open it. Press and hold to swap it.</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={fillEmpty}
          disabled={filling}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }, filling && { opacity: 0.6 }]}
        >
          {filling ? <ActivityIndicator color={colors.white} /> : <Ionicons name="shuffle" size={18} color={colors.white} />}
          <Text style={styles.primaryText}>{filling ? 'Picking meals' : 'Fill empty slots'}</Text>
        </Pressable>
        <Button label="Clear day" icon="trash-outline" kind="danger" disabled={planned === 0} onPress={confirmClear} />
      </View>

      <View style={styles.actions}>
        <Button label="Copy day" icon="copy-outline" kind="soft" small disabled={planned === 0} onPress={() => setCopyOpen(true)} style={{ flex: 1 }} />
        <Button label="Repeat week" icon="repeat" kind="soft" small onPress={() => copyWeek(weekStart)} style={{ flex: 1 }} />
        <Button label="Share" icon="share-outline" kind="soft" small onPress={shareWeek} style={{ flex: 1 }} />
      </View>

      <PromptModal
        visible={kcalSlot !== null}
        title="Calories for this meal"
        message="Enter your own estimate. Leave it empty to remove it."
        initial={kcalSlot && day[kcalSlot]?.calories ? String(day[kcalSlot]!.calories) : ''}
        placeholder="e.g. 450"
        keyboardType="numeric"
        confirmLabel="Save"
        onCancel={() => setKcalSlot(null)}
        onConfirm={(v) => {
          if (kcalSlot) {
            const n = parseInt(v.replace(/\D/g, ''), 10);
            setCalories(selectedDate, kcalSlot, n > 0 ? n : undefined);
          }
          setKcalSlot(null);
        }}
      />

      <Modal visible={copyOpen} transparent animationType="fade" onRequestClose={() => setCopyOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCopyOpen(false)} />
          <View style={styles.sheet}>
            <Text style={type.h2}>Copy {formatDay(selectedDate)} to</Text>
            <Text style={type.small}>This replaces the meals already planned on that day.</Text>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
              {copyTargets.map((iso) => (
                <Pressable
                  key={iso}
                  onPress={() => {
                    copyDay(selectedDate, iso);
                    setCopyOpen(false);
                  }}
                  style={styles.copyRow}
                >
                  <Text style={styles.copyText}>{formatLongDay(iso)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </ScrollView>
            <Button label="Cancel" kind="soft" onPress={() => setCopyOpen(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  dayHeader: { marginTop: 26, marginBottom: 12, gap: 2 },
  hint: { textAlign: 'center', marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
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
  overlay: { flex: 1, backgroundColor: 'rgba(20,53,40,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: 20, gap: 8 },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  copyText: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
