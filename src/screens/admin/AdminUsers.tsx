import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import { Button, TextField } from '../../components/ui';
import { bus } from '../../events';
import { useAuth } from '../../store/AuthContext';
import { colors, radius, type } from '../../theme';
import type { Account } from '../../types';

const dateText = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : 'never');

export default function AdminUsers() {
  const { account, accounts, setDisabled, setRole, resetPassword, deleteUser } = useAuth();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const list = accounts
    .filter((a) => !q || a.name.toLowerCase().includes(q) || a.email.includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const doReset = (a: Account) =>
    Alert.alert(`Reset password for ${a.name}?`, 'A temporary password will be created. Share it with the user.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          const temp = await resetPassword(a.id);
          Alert.alert('Temporary password', `${temp}\n\nTell ${a.name} to sign in and change it in Me.`);
        },
      },
    ]);

  const doDelete = (a: Account) =>
    Alert.alert(`Delete ${a.name}?`, 'The account and all of its planner data will be removed. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteUser(a.id);
          bus.emit('toast', { message: `Deleted ${a.name}`, tone: 'info' });
        },
      },
    ]);

  return (
    <FlatList
      data={list}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        <View style={{ gap: 14, marginBottom: 16 }}>
          <Text style={type.title}>Users</Text>
          <TextField value={search} onChangeText={setSearch} placeholder="Search by name or email" />
        </View>
      }
      ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" message="Try a different name or email." />}
      renderItem={({ item: a }) => {
        const me = a.id === account?.id;
        return (
          <View style={styles.card}>
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.name}{me ? ' (you)' : ''}</Text>
                <Text style={type.small}>{a.email}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: a.role === 'admin' ? colors.ubeSoft : colors.pandanSoft }]}>
                <Text style={styles.pillText}>{a.role}</Text>
              </View>
              {a.disabled && (
                <View style={[styles.pill, { backgroundColor: colors.siliSoft }]}>
                  <Text style={[styles.pillText, { color: colors.sili }]}>disabled</Text>
                </View>
              )}
            </View>
            <Text style={type.small}>Joined {dateText(a.createdAt)} · Last sign-in {dateText(a.lastLoginAt)}</Text>
            {!me && (
              <View style={styles.actions}>
                <Button label={a.disabled ? 'Enable' : 'Disable'} kind="soft" small onPress={() => setDisabled(a.id, !a.disabled)} />
                <Button label={a.role === 'admin' ? 'Make user' : 'Make admin'} kind="soft" small onPress={() => setRole(a.id, a.role === 'admin' ? 'user' : 'admin')} />
                <Button label="Reset password" kind="soft" small onPress={() => doReset(a)} />
                <Button label="Delete" kind="danger" small onPress={() => doDelete(a)} />
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  card: { padding: 14, gap: 8, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '800', color: colors.ink },
  pill: { paddingHorizontal: 10, height: 26, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.pandanDeep },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
