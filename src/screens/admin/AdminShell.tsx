import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar, { type TabDef } from '../../components/TabBar';
import { colors } from '../../theme';
import AdminOverview from './AdminOverview';
import AdminRecipes from './AdminRecipes';
import AdminUsers from './AdminUsers';

type Tab = 'overview' | 'users' | 'recipes';

const TABS: TabDef<Tab>[] = [
  { key: 'overview', label: 'Overview', icon: 'stats-chart-outline', active: 'stats-chart' },
  { key: 'users', label: 'Users', icon: 'people-outline', active: 'people' },
  { key: 'recipes', label: 'Picks', icon: 'star-outline', active: 'star' },
];

export default function AdminShell() {
  const [tab, setTab] = useState<Tab>('overview');
  const pane = (key: Tab) => [styles.pane, tab !== key && styles.hidden];
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={pane('overview')}>
        <AdminOverview />
      </View>
      <View style={pane('users')}>
        <AdminUsers />
      </View>
      <View style={pane('recipes')}>
        <AdminRecipes />
      </View>
      <TabBar tabs={TABS} tab={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pane: { flex: 1 },
  hidden: { display: 'none' },
});
