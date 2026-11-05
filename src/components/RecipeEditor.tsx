import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Chip from './Chip';
import { Button, TextField } from './ui';
import { colors, radius, type } from '../theme';
import type { Meal } from '../types';
import { uid } from '../utils/id';

const CATEGORIES = ['Breakfast', 'Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Pasta', 'Side', 'Starter', 'Dessert', 'Miscellaneous'];

interface Row {
  key: string;
  name: string;
  measure: string;
}
const blank = (): Row => ({ key: uid(), name: '', measure: '' });

interface Props {
  visible: boolean;
  /** Pass a meal to edit it, or null to create a new one. */
  initial: Meal | null;
  source: 'custom' | 'featured';
  onClose: () => void;
  onSave: (meal: Meal) => void;
}

export default function RecipeEditor({ visible, initial, source, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Chicken');
  const [area, setArea] = useState('Filipino');
  const [calories, setCalories] = useState('');
  const [rows, setRows] = useState<Row[]>([blank(), blank(), blank()]);
  const [steps, setSteps] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fill the form each time the editor opens.
  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (initial) {
      setName(initial.name);
      setCategory(initial.category);
      setArea(initial.area);
      setCalories(initial.calories ? String(initial.calories) : '');
      setRows(initial.ingredients.map((i) => ({ key: uid(), name: i.name, measure: i.measure })));
      setSteps(initial.instructions);
    } else {
      setName('');
      setCategory('Chicken');
      setArea('Filipino');
      setCalories('');
      setRows([blank(), blank(), blank()]);
      setSteps('');
    }
  }, [visible, initial]);

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const save = () => {
    const ingredients = rows
      .map((r) => ({ name: r.name.trim(), measure: r.measure.trim() }))
      .filter((r) => r.name);
    const instructions = steps
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n');
    if (!name.trim()) return setError('Give the recipe a name.');
    if (ingredients.length === 0) return setError('Add at least one ingredient.');
    if (!instructions) return setError('Write at least one cooking step.');
    const kcal = parseInt(calories, 10);
    const meal: Meal = {
      id: initial?.id ?? `${source}-${uid()}`,
      name: name.trim(),
      thumb: '',
      category,
      area: area.trim(),
      instructions,
      ingredients,
      source,
      ...(kcal > 0 ? { calories: kcal } : {}),
    };
    onSave(meal);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={colors.ink} />
          </Pressable>
          <Text style={type.h2}>{initial ? 'Edit recipe' : 'New recipe'}</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <TextField label="Recipe name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Lola's kare-kare" />

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
              {CATEGORIES.map((c) => (
                <Chip key={c} label={c} active={c === category} onPress={() => setCategory(c)} />
              ))}
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextField label="Cuisine" value={area} onChangeText={setArea} autoCapitalize="words" placeholder="Filipino" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Calories (optional)" value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="450" />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Ingredients</Text>
            {rows.map((r) => (
              <View key={r.key} style={styles.ingRow}>
                <View style={{ flex: 2 }}>
                  <TextField value={r.name} onChangeText={(t) => updateRow(r.key, { name: t })} placeholder="Ingredient" autoCapitalize="sentences" />
                </View>
                <View style={{ flex: 1.3 }}>
                  <TextField value={r.measure} onChangeText={(t) => updateRow(r.key, { measure: t })} placeholder="Amount" />
                </View>
                <Pressable
                  onPress={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
                  hitSlop={8}
                  accessibilityLabel="Remove ingredient"
                  style={styles.rowX}
                >
                  <Ionicons name="close-circle" size={22} color={colors.muted} />
                </Pressable>
              </View>
            ))}
            <Button label="Add ingredient" icon="add" kind="soft" small onPress={() => setRows((rs) => [...rs, blank()])} style={{ alignSelf: 'flex-start' }} />
          </View>

          <TextField
            label="Cooking steps (one step per line)"
            value={steps}
            onChangeText={setSteps}
            multiline
            autoCapitalize="sentences"
            placeholder={'Saute the garlic.\nAdd the chicken.\nSimmer for 30 minutes.'}
            style={{ minHeight: 140 }}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Button label="Save recipe" icon="checkmark" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  body: { padding: 20, gap: 18, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  ingRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  rowX: { height: 48, justifyContent: 'center' },
  error: { color: colors.sili, fontWeight: '700', fontSize: 14 },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
});
