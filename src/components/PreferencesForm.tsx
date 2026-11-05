import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Chip from './Chip';
import { Button, TextField } from './ui';
import { colors, radius, type } from '../theme';
import type { Diet, Profile } from '../types';

const DIETS: { key: Diet; label: string }[] = [
  { key: 'none', label: 'No restriction' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'pescatarian', label: 'Pescatarian' },
];

/** Diet, foods to avoid, and daily calorie goal. Used in onboarding and in the profile. */
export default function PreferencesForm({ value, onChange }: { value: Profile; onChange: (p: Profile) => void }) {
  const [draft, setDraft] = useState('');

  const addExclusions = () => {
    const words = draft
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w && !value.exclusions.includes(w));
    if (words.length) onChange({ ...value, exclusions: [...value.exclusions, ...words] });
    setDraft('');
  };

  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 10 }}>
        <Text style={type.h3}>Eating style</Text>
        <View style={styles.wrap}>
          {DIETS.map((d) => (
            <Chip key={d.key} label={d.label} active={value.diet === d.key} onPress={() => onChange({ ...value, diet: d.key })} />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={type.h3}>Foods to avoid</Text>
        <Text style={type.small}>We flag meals that contain these. Separate with commas, e.g. peanut, shrimp.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextField value={draft} onChangeText={setDraft} onSubmitEditing={addExclusions} placeholder="Add a food" returnKeyType="done" />
          </View>
          <Button label="Add" kind="soft" onPress={addExclusions} style={{ height: 48 }} />
        </View>
        {value.exclusions.length > 0 && (
          <View style={styles.wrap}>
            {value.exclusions.map((w) => (
              <Pressable
                key={w}
                onPress={() => onChange({ ...value, exclusions: value.exclusions.filter((x) => x !== w) })}
                accessibilityLabel={`Remove ${w}`}
                style={styles.tag}
              >
                <Text style={styles.tagText}>{w}</Text>
                <Ionicons name="close" size={14} color={colors.sili} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={type.h3}>Daily calorie goal</Text>
        <Text style={type.small}>Optional. Used to show your progress on the Today tab.</Text>
        <TextField
          value={value.calorieGoal ? String(value.calorieGoal) : ''}
          onChangeText={(t) => {
            const n = parseInt(t.replace(/\D/g, ''), 10);
            onChange({ ...value, calorieGoal: n > 0 ? n : null });
          }}
          keyboardType="numeric"
          placeholder="e.g. 2000"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: radius.pill, backgroundColor: colors.siliSoft },
  tagText: { fontSize: 13, fontWeight: '700', color: colors.sili },
});
