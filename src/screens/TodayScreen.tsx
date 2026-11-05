import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ProgressBar } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, slotMeta, type } from '../theme';
import { SLOT_ORDER, type MealPreview, type Target } from '../types';
import { addDays, formatLongDay, parseISO, startOfWeek, toISO } from '../utils/dates';

interface Props {
  onPickFor: (t: Target) => void;
  onOpenMeal: (m: MealPreview) => void;
  onGoPlan: () => void;
}

export default function TodayScreen({ onPickFor, onOpenMeal, onGoPlan }: Props) {
  const { account, global } = useAuth();
  const { plan, cooked, profile, toggleCooked } = usePlanner();

  const today = toISO(new Date());
  const day = plan[today] ?? {};
  const kcal = SLOT_ORDER.reduce((sum, s) => sum + (day[s]?.calories ?? 0), 0);
  const goal = profile.calorieGoal;

  // This week's progress.
  const weekStart = startOfWeek(parseISO(today));
  let planned = 0;
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const iso = toISO(addDays(weekStart, i));
    SLOT_ORDER.forEach((s) => {
      if (plan[iso]?.[s]) {
        planned += 1;
        if (cooked[`${iso}|${s}`]) done += 1;
      }
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={type.title}>Hello, {account?.name.split(' ')[0] ?? 'there'}</Text>
      <Text style={[type.body, { color: colors.muted, marginBottom: 18 }]}>{formatLongDay(today)}</Text>

      {global.announcement && (
        <View style={styles.notice}>
          <Ionicons name="megaphone-outline" size={20} color={colors.pandanDeep} />
          <Text style={styles.noticeText}>{global.announcement.text}</Text>
        </View>
      )}

      <Text style={[type.h2, { marginBottom: 10 }]}>Today's meals</Text>
      <View style={{ gap: 10 }}>
        {SLOT_ORDER.map((slot) => {
          const meta = slotMeta[slot];
          const meal = day[slot];
          const isDone = !!cooked[`${today}|${slot}`];
          return (
            <View key={slot} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: meta.color }]} />
              {meal ? (
                <>
                  <Pressable style={{ flex: 1 }} onPress={() => onOpenMeal(meal)}>
                    <Text style={type.small}>{meta.label}</Text>
                    <Text style={[styles.mealName, isDone && styles.done]} numberOfLines={1}>
                      {meal.name}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleCooked(today, slot)}
                    hitSlop={8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    accessibilityLabel={`Mark ${meal.name} as cooked`}
                  >
                    <Ionicons name={isDone ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={isDone ? colors.pandan : colors.line} />
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.planRow} onPress={() => onPickFor({ date: today, slot })}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.small}>{meta.label}</Text>
                    <Text style={styles.planText}>Plan {meta.label.toLowerCase()}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={26} color={colors.pandan} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <Card style={{ marginTop: 22 }}>
        <Text style={type.h3}>Calories today</Text>
        {goal ? (
          <>
            <Text style={type.body}>
              {kcal} of {goal} kcal
            </Text>
            <ProgressBar value={kcal / goal} color={kcal > goal ? colors.sili : colors.pandan} />
            {kcal === 0 && <Text style={type.small}>Add kcal to your meals in Plan to track your goal.</Text>}
          </>
        ) : (
          <Text style={type.small}>
            {kcal > 0 ? `${kcal} kcal planned. ` : ''}Set a daily goal in Me to see your progress here.
          </Text>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={type.h3}>This week</Text>
        <Text style={type.body}>
          {planned === 0 ? 'No meals planned yet.' : `${done} of ${planned} planned meals cooked`}
        </Text>
        <ProgressBar value={planned ? done / planned : 0} color={colors.calamansi} />
        <Pressable onPress={onGoPlan} hitSlop={6}>
          <Text style={styles.link}>Open the planner</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  notice: { flexDirection: 'row', gap: 10, padding: 14, marginBottom: 20, borderRadius: radius.md, backgroundColor: colors.calamansiSoft },
  noticeText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.pandanDeep, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  mealName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  done: { textDecorationLine: 'line-through', color: colors.muted },
  planRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  planText: { fontSize: 16, fontWeight: '700', color: colors.pandan },
  link: { fontSize: 14, fontWeight: '800', color: colors.pandan, marginTop: 4 },
});
