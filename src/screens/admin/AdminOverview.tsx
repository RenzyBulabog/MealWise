import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, TextField } from '../../components/ui';
import { bus } from '../../events';
import { useAuth, type Stats } from '../../store/AuthContext';
import { colors, radius, type } from '../../theme';

export default function AdminOverview() {
  const { account, accounts, global, loadStats, setAnnouncement, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [notice, setNotice] = useState(global.announcement?.text ?? '');

  const refresh = useCallback(() => {
    loadStats().then(setStats).catch(() => {});
  }, [loadStats]);

  // Reload the numbers when accounts or featured recipes change.
  useEffect(() => {
    refresh();
  }, [refresh, accounts, global.featured.length]);

  const tiles = stats
    ? [
        { label: 'Users', value: stats.users },
        { label: 'Admins', value: stats.admins },
        { label: 'Disabled', value: stats.disabled },
        { label: 'Meals planned', value: stats.planned },
        { label: 'Meals cooked', value: stats.cooked },
        { label: 'User recipes', value: stats.custom },
        { label: 'Saved meals', value: stats.favorites },
        { label: 'MealWise picks', value: stats.featured },
      ]
    : [];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={type.title}>Admin</Text>
          <Text style={type.small}>Signed in as {account?.email}</Text>
        </View>
        <Button label="Sign out" icon="log-out-outline" kind="soft" small onPress={logout} />
      </View>

      <Text style={[type.h2, styles.section]}>Overview</Text>
      {!stats ? (
        <ActivityIndicator color={colors.pandan} />
      ) : (
        <View style={styles.tiles}>
          {tiles.map((t) => (
            <View key={t.label} style={styles.tile}>
              <Text style={styles.tileValue}>{t.value}</Text>
              <Text style={type.small}>{t.label}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[type.h2, styles.section]}>Most planned meals</Text>
      <Card>
        {stats && stats.top.length > 0 ? (
          stats.top.map((m, i) => (
            <View key={m.name} style={styles.topRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Text style={styles.topName} numberOfLines={1}>{m.name}</Text>
              <Text style={type.small}>{m.count}×</Text>
            </View>
          ))
        ) : (
          <Text style={type.small}>No meals planned yet.</Text>
        )}
      </Card>

      <Text style={[type.h2, styles.section]}>Announcement</Text>
      <Card>
        <Text style={type.small}>Shown at the top of every user's Today tab.</Text>
        <TextField value={notice} onChangeText={setNotice} multiline autoCapitalize="sentences" placeholder="e.g. New Filipino recipes were added this week." />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label="Post"
            icon="megaphone-outline"
            disabled={!notice.trim()}
            onPress={() => {
              setAnnouncement(notice);
              bus.emit('toast', { message: 'Announcement posted', tone: 'success' });
            }}
            style={{ flex: 1 }}
          />
          <Button
            label="Remove"
            kind="danger"
            disabled={!global.announcement}
            onPress={() => {
              setAnnouncement(null);
              setNotice('');
              bus.emit('toast', { message: 'Announcement removed', tone: 'info' });
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 130 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  section: { marginTop: 28, marginBottom: 12 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  tileValue: { fontSize: 28, fontWeight: '800', color: colors.pandan },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 24, fontSize: 16, fontWeight: '800', color: colors.calamansi },
  topName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
});
