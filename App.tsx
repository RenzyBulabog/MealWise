import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TabBar, { type TabKey } from './src/components/TabBar';
import Toast from './src/components/Toast';
import DiscoverScreen from './src/screens/DiscoverScreen';
import GroceryScreen from './src/screens/GroceryScreen';
import MealDetailModal from './src/screens/MealDetailModal';
import PlannerScreen from './src/screens/PlannerScreen';
import SavedScreen from './src/screens/SavedScreen';
import { PlannerProvider, usePlanner } from './src/store/PlannerContext';
import { colors } from './src/theme';
import type { MealPreview, Target } from './src/types';
import { toISO } from './src/utils/dates';

function Shell() {
  const { ready } = usePlanner();
  const [tab, setTab] = useState<TabKey>('plan');
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [target, setTarget] = useState<Target | null>(null);
  const [detail, setDetail] = useState<MealPreview | null>(null);
  const todayRef = useRef(toISO(new Date()));

  // Event: the app returns to the foreground. If a new day started, jump to it.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const now = toISO(new Date());
      if (now !== todayRef.current) {
        todayRef.current = now;
        setSelectedDate(now);
      }
    });
    return () => sub.remove();
  }, []);

  const pickFor = (t: Target) => {
    setTarget(t);
    setTab('discover');
  };

  const handleAdded = () => {
    if (!target) return;
    setSelectedDate(target.date);
    setTarget(null);
    setTab('plan');
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.pandan} />
      </View>
    );
  }

  // All tabs stay mounted so search results and scroll positions are kept.
  const pane = (key: TabKey) => [styles.pane, tab !== key && styles.hidden];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />

      <View style={pane('plan')}>
        <PlannerScreen
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPickFor={pickFor}
          onOpenMeal={setDetail}
        />
      </View>
      <View style={pane('discover')}>
        <DiscoverScreen target={target} onClearTarget={() => setTarget(null)} onOpenMeal={setDetail} />
      </View>
      <View style={pane('groceries')}>
        <GroceryScreen selectedDate={selectedDate} onSelectDate={setSelectedDate} onGoPlan={() => setTab('plan')} />
      </View>
      <View style={pane('saved')}>
        <SavedScreen onOpenMeal={setDetail} onGoDiscover={() => setTab('discover')} />
      </View>

      <Toast />
      <TabBar tab={tab} onChange={setTab} />

      <MealDetailModal
        preview={detail}
        target={target}
        onClose={() => setDetail(null)}
        onAdded={handleAdded}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlannerProvider>
        <Shell />
      </PlannerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pane: { flex: 1 },
  hidden: { display: 'none' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
