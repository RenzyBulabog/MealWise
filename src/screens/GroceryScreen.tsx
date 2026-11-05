import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import WeekNav from '../components/WeekNav';
import { Button, Segmented, TextField } from '../components/ui';
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
  manualId?: string;
}

type Seg = 'list' | 'pantry';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onGoPlan: () => void;
  onFindRecipes: (ingredient: string) => void;
}

export default function GroceryScreen({ selectedDate, onSelectDate, onGoPlan, onFindRecipes }: Props) {
  const { plan, checked, pantry, manual, toggleChecked, clearChecked, addPantry, removePantry, addManual, removeManual } = usePlanner();
  const [seg, setSeg] = useState<Seg>('list');
  const [manualText, setManualText] = useState('');
  const [pantryText, setPantryText] = useState('');

  const dates = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const weekISO = toISO(dates[0]);
  const today = toISO(new Date());
  const isCurrentWeek = dates.some((d) => toISO(d) === today);

  const inPantry = (name: string) => {
    const b = name.toLowerCase();
    return pantry.some((p) => {
      const a = p.name.trim().toLowerCase();
      return a.length > 0 && (b.includes(a) || a.includes(b));
    });
  };

  // Combine ingredients from every meal planned this week, plus items typed in by hand.
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
    const planned = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    const extra: Item[] = manual
      .filter((m) => m.week === weekISO)
      .map((m) => ({ key: `manual:${m.id}`, name: capitalize(m.name), measures: [], meals: [], manualId: m.id }));
    return [...planned, ...extra];
  }, [plan, dates, manual, weekISO]);

  const keyFor = (item: Item) => `${weekISO}|${item.key}`;
  const have = items.filter((i) => !i.manualId && inPantry(i.name));
  const needed = items.filter((i) => !have.includes(i));
  const toBuy = needed.filter((i) => !checked[keyFor(i)]);
  const inBasket = needed.filter((i) => checked[keyFor(i)]);

  const shiftWeek = (weeks: number) => onSelectDate(toISO(addDays(parseISO(selectedDate), weeks * 7)));

  const shareList = async () => {
    const lines = toBuy.map((i) => `• ${i.name}${i.measures.length ? ` (${i.measures.join(', ')})` : ''}`);
    try {
      await Share.share({ message: `MealWise grocery list, ${formatRange(dates)}\n\n${lines.join('\n')}` });
    } catch {
      bus.emit('toast', { message: 'Could not open the share sheet.', tone: 'danger' });
    }
  };

  const submitManual = () => {
    addManual(manualText, weekISO);
    setManualText('');
  };

  const submitPantry = () => {
    if (addPantry(pantryText)) setPantryText('');
  };

  const renderRow = (item: Item, done: boolean) => (
    <View key={item.key} style={styles.row}>
      <Pressable
        onPress={() => toggleChecked(keyFor(item))}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        style={styles.rowMain}
      >
        <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={done ? colors.pandan : colors.line} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, done && styles.done]}>{item.name}</Text>
          <Text style={[type.small, done && styles.done]} numberOfLines={1}>
            {item.manualId
              ? 'Added by you'
              : [item.measures.join(', '), `for ${item.meals.length} ${item.meals.length === 1 ? 'meal' : 'meals'}`].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </Pressable>
      {item.manualId && (
        <Pressable onPress={() => removeManual(item.manualId!)} hitSlop={8} accessibilityLabel={`Remove ${item.name}`}>
          <Ionicons name="close" size={20} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <WeekNav dates={dates} isCurrentWeek={isCurrentWeek} onShift={shiftWeek} onToday={() => onSelectDate(today)} />
      <View style={{ marginTop: 14 }}>
        <Segmented
          options={[
            { key: 'list' as Seg, label: 'Grocery list' },
            { key: 'pantry' as Seg, label: `Pantry (${pantry.length})` },
          ]}
          value={seg}
          onChange={setSeg}
        />
      </View>

      {seg === 'list' && (
        <>
          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <TextField
                value={manualText}
                onChangeText={setManualText}
                onSubmitEditing={submitManual}
                placeholder="Add something else to buy"
                autoCapitalize="sentences"
                returnKeyType="done"
              />
            </View>
            <Button label="Add" kind="soft" onPress={submitManual} style={{ height: 48 }} />
          </View>

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
                <Button label="Share list" icon="share-outline" small onPress={shareList} disabled={toBuy.length === 0} />
                {inBasket.length > 0 && <Button label="Untick all" kind="soft" small onPress={() => clearChecked(`${weekISO}|`)} />}
              </View>

              {toBuy.length > 0 ? (
                <>
                  <Text style={styles.section}>To buy ({toBuy.length})</Text>
                  <View style={styles.card}>{toBuy.map((i) => renderRow(i, false))}</View>
                </>
              ) : (
                <Text style={[type.h3, { marginTop: 24, textAlign: 'center' }]}>Nothing left to buy.</Text>
              )}

              {inBasket.length > 0 && (
                <>
                  <Text style={styles.section}>In the basket ({inBasket.length})</Text>
                  <View style={styles.card}>{inBasket.map((i) => renderRow(i, true))}</View>
                </>
              )}

              {have.length > 0 && (
                <>
                  <Text style={styles.section}>Already in your pantry ({have.length})</Text>
                  <View style={styles.card}>
                    {have.map((i) => (
                      <View key={i.key} style={styles.row}>
                        <Ionicons name="home-outline" size={22} color={colors.pandan} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{i.name}</Text>
                          <Text style={type.small} numberOfLines={1}>
                            {i.measures.join(', ')}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </>
      )}

      {seg === 'pantry' && (
        <>
          <Text style={[type.small, { marginTop: 16 }]}>
            Add what you already have. Those ingredients move out of your grocery list, and you can find meals that use them.
          </Text>
          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <TextField value={pantryText} onChangeText={setPantryText} onSubmitEditing={submitPantry} placeholder="e.g. rice, garlic, soy sauce" autoCapitalize="sentences" returnKeyType="done" />
            </View>
            <Button label="Add" kind="soft" onPress={submitPantry} style={{ height: 48 }} />
          </View>

          {pantry.length === 0 ? (
            <EmptyState icon="home-outline" title="Your pantry is empty" message="Add a few staples to skip buying them twice." />
          ) : (
            <View style={styles.card}>
              {pantry.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text style={[styles.name, { flex: 1 }]}>{capitalize(p.name)}</Text>
                  <Pressable onPress={() => onFindRecipes(p.name)} style={styles.find} accessibilityRole="button">
                    <Ionicons name="search" size={14} color={colors.pandan} />
                    <Text style={styles.findText}>Find meals</Text>
                  </Pressable>
                  <Pressable onPress={() => removePantry(p.id)} hitSlop={8} accessibilityLabel={`Remove ${p.name}`}>
                    <Ionicons name="close" size={20} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  section: { ...type.h3, marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  done: { textDecorationLine: 'line-through', color: colors.muted },
  find: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: radius.pill, backgroundColor: colors.pandanSoft },
  findText: { fontSize: 13, fontWeight: '800', color: colors.pandan },
});
