import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import PreferencesForm from '../components/PreferencesForm';
import { Button, Card, TextField } from '../components/ui';
import { bus } from '../events';
import { useAuth } from '../store/AuthContext';
import { usePlanner } from '../store/PlannerContext';
import { colors, radius, type } from '../theme';
import { SLOT_ORDER } from '../types';
import { addDays, parseISO, startOfWeek, toISO } from '../utils/dates';

export default function ProfileScreen() {
  const { account, logout, changePassword } = useAuth();
  const { profile, setProfile, plan, cooked, favorites, custom, wipeData } = usePlanner();

  const [draft, setDraft] = useState(profile);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  const weekStart = startOfWeek(parseISO(toISO(new Date())));
  let plannedThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const iso = toISO(addDays(weekStart, i));
    SLOT_ORDER.forEach((s) => {
      if (plan[iso]?.[s]) plannedThisWeek += 1;
    });
  }

  const savePrefs = () => {
    setProfile({ ...draft, onboarded: true });
    bus.emit('toast', { message: 'Preferences saved', tone: 'success' });
  };

  const submitPassword = async () => {
    setBusy(true);
    setPwError(null);
    const err = await changePassword(oldPw, newPw);
    setBusy(false);
    if (err) return setPwError(err);
    setOldPw('');
    setNewPw('');
    bus.emit('toast', { message: 'Password changed', tone: 'success' });
  };

  const confirmWipe = () =>
    Alert.alert('Delete your planner data?', 'This removes your plan, saved meals, pantry, grocery ticks, notes and your own recipes. Your account and preferences stay.', [
      { text: 'Keep my data', style: 'cancel' },
      {
        text: 'Delete data',
        style: 'destructive',
        onPress: () => {
          wipeData();
          bus.emit('toast', { message: 'Your planner data was deleted', tone: 'info' });
        },
      },
    ]);

  const stats = [
    { label: 'Planned this week', value: plannedThisWeek },
    { label: 'Meals cooked', value: Object.keys(cooked).length },
    { label: 'Saved meals', value: favorites.length },
    { label: 'My recipes', value: custom.length },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{account?.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.h2}>{account?.name}</Text>
          <Text style={type.small}>{account?.email}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={type.small}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={[type.h2, styles.section]}>Eating preferences</Text>
      <PreferencesForm value={draft} onChange={setDraft} />
      <Button label="Save preferences" onPress={savePrefs} disabled={!dirty} style={{ marginTop: 20 }} />

      <Text style={[type.h2, styles.section]}>Change password</Text>
      <Card>
        <TextField label="Current password" value={oldPw} onChangeText={setOldPw} secureTextEntry />
        <TextField label="New password" value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="At least 8 characters, letters and numbers" />
        {!!pwError && <Text style={styles.error}>{pwError}</Text>}
        <Button label="Update password" kind="soft" onPress={submitPassword} loading={busy} disabled={!oldPw || !newPw} />
      </Card>

      <Text style={[type.h2, styles.section]}>Account</Text>
      <View style={{ gap: 10 }}>
        <Button label="Delete my planner data" icon="trash-outline" kind="danger" onPress={confirmWipe} />
        <Button label="Sign out" icon="log-out-outline" kind="soft" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.pandan, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.calamansi },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  stat: { width: '48%', padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.pandan },
  section: { marginTop: 32, marginBottom: 14 },
  error: { color: colors.sili, fontWeight: '700', fontSize: 14 },
});
