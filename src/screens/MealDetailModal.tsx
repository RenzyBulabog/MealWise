import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Chip from '../components/Chip';
import MealImage from '../components/MealImage';
import { lookupMeal } from '../api/mealdb';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, slotMeta, type } from '../theme';
import { SLOT_ORDER, type Meal, type MealPreview, type SlotKey, type Target } from '../types';
import { addDays, dayShort, formatDay, toISO } from '../utils/dates';

interface Props {
  preview: MealPreview | null;
  target: Target | null;
  onClose: () => void;
  /** Called after the meal was added to the plan. */
  onAdded: () => void;
}

const suggestSlot = (category: string): SlotKey => {
  const c = category.toLowerCase();
  if (c === 'breakfast') return 'breakfast';
  if (['dessert', 'starter', 'side', 'miscellaneous'].includes(c)) return 'snack';
  return 'dinner';
};

export default function MealDetailModal({ preview, target, onClose, onAdded }: Props) {
  const { plan, setMeal, isFavorite, toggleFavorite } = usePlanner();
  const insets = useSafeAreaInsets();

  const [meal, setMealState] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [pickDate, setPickDate] = useState(toISO(new Date()));
  const [pickSlot, setPickSlot] = useState<SlotKey>('dinner');

  // Load the full recipe whenever a different meal is opened.
  useEffect(() => {
    if (!preview) return;
    let alive = true;
    setMealState(null);
    setError(null);
    setLoading(true);
    lookupMeal(preview.id)
      .then((m) => {
        if (!alive) return;
        setMealState(m);
        setPickSlot(suggestSlot(m.category));
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Could not load this recipe.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [preview?.id, attempt]);

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const date = target ? target.date : pickDate;
  const slot = target ? target.slot : pickSlot;
  const replacing = !!plan[date]?.[slot];

  const add = () => {
    if (!meal) return;
    setMeal(date, slot, meal);
    onClose();
    onAdded();
  };

  const steps = (meal?.instructions ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const favorite = preview ? isFavorite(preview.id) : false;

  return (
    <Modal visible={!!preview} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.pandan} />
          </View>
        )}

        {error && (
          <View style={styles.center}>
            <Text style={[type.h2, { textAlign: 'center' }]}>Couldn't load this recipe</Text>
            <Text style={[type.body, { textAlign: 'center', color: colors.muted, marginTop: 6 }]}>{error}</Text>
            <Pressable onPress={() => setAttempt((n) => n + 1)} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {meal && (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
              <MealImage uri={meal.thumb} size="large" style={styles.hero} />

              <View style={styles.body}>
                <Text style={type.title}>{meal.name}</Text>
                <View style={styles.tags}>
                  <View style={[styles.tag, { backgroundColor: colors.pandanSoft }]}>
                    <Text style={styles.tagText}>{meal.category}</Text>
                  </View>
                  {!!meal.area && (
                    <View style={[styles.tag, { backgroundColor: colors.calamansiSoft }]}>
                      <Text style={styles.tagText}>{meal.area}</Text>
                    </View>
                  )}
                </View>

                {!target && (
                  <View style={styles.picker}>
                    <Text style={type.h3}>Add to your plan</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                      {days.map((d) => {
                        const iso = toISO(d);
                        return (
                          <Chip
                            key={iso}
                            label={`${dayShort(d)} ${d.getDate()}`}
                            active={iso === pickDate}
                            onPress={() => setPickDate(iso)}
                          />
                        );
                      })}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                      {SLOT_ORDER.map((s) => (
                        <Chip
                          key={s}
                          label={slotMeta[s].label}
                          active={s === pickSlot}
                          tint={slotMeta[s].color === colors.calamansi ? '#9A7500' : slotMeta[s].color}
                          onPress={() => setPickSlot(s)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Text style={[type.h2, styles.section]}>Ingredients</Text>
                <View style={styles.card}>
                  {meal.ingredients.map((ing, i) => (
                    <View key={`${ing.name}-${i}`} style={[styles.ingRow, i > 0 && styles.ingBorder]}>
                      <Text style={styles.ingName}>{ing.name}</Text>
                      <Text style={styles.ingMeasure}>{ing.measure}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[type.h2, styles.section]}>How to cook it</Text>
                {steps.map((s, i) => (
                  <Text key={i} style={[type.body, { marginBottom: 10 }]}>
                    {s}
                  </Text>
                ))}

                {!!meal.youtube && (
                  <Pressable
                    onPress={() => Linking.openURL(meal.youtube!)}
                    style={styles.video}
                    accessibilityRole="link"
                  >
                    <Ionicons name="logo-youtube" size={20} color={colors.sili} />
                    <Text style={styles.videoText}>Watch a video of this recipe</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>

            <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
              <Pressable
                onPress={add}
                accessibilityRole="button"
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.white} />
                <Text style={styles.ctaText} numberOfLines={1}>
                  {replacing ? 'Replace' : 'Add to'} {formatDay(date)} · {slotMeta[slot].label}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Floating controls stay available while loading or on error. */}
        <View style={[styles.floatRow, { top: Math.max(insets.top, 16) }]} pointerEvents="box-none">
          <Pressable onPress={onClose} style={styles.fab} accessibilityLabel="Close" hitSlop={6}>
            <Ionicons name="chevron-down" size={22} color={colors.ink} />
          </Pressable>
          {preview && (
            <Pressable
              onPress={() => toggleFavorite(preview)}
              style={styles.fab}
              accessibilityLabel={favorite ? 'Remove from saved' : 'Save meal'}
              hitSlop={6}
            >
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? colors.sili : colors.ink} />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 32 },
  retry: { marginTop: 16, backgroundColor: colors.pandan, paddingHorizontal: 22, paddingVertical: 13, borderRadius: radius.pill },
  retryText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  hero: { width: '100%', height: 300 },
  body: { padding: 20, marginTop: -24, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: colors.bg },
  tags: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  tagText: { fontSize: 13, fontWeight: '700', color: colors.pandanDeep },
  picker: {
    marginTop: 20,
    padding: 14,
    gap: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { gap: 8 },
  section: { marginTop: 26, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  ingBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  ingName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  ingMeasure: { fontSize: 14, color: colors.muted, flexShrink: 1, textAlign: 'right' },
  video: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingVertical: 8 },
  videoText: { fontSize: 15, fontWeight: '700', color: colors.sili },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cta: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.pandan,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  floatRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
