import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar, { type TabDef } from '../components/TabBar';
import DiscoverScreen from './DiscoverScreen';
import GroceryScreen from './GroceryScreen';
import MealDetailModal from './MealDetailModal';
import OnboardingScreen from './OnboardingScreen';
import PlannerScreen from './PlannerScreen';
import ProfileScreen from './ProfileScreen';
import TodayScreen from './TodayScreen';
import { usePlanner } from '../store/PlannerContext';
import { colors } from '../theme';
import type { MealPreview, Target } from '../types';
import { toISO } from '../utils/dates';

type Tab = 'today' | 'plan' | 'discover' | 'groceries' | 'me';

const TABS: TabDef<Tab>[] = [
  { key: 'today', label: 'Today', icon: 'sunny-outline', active: 'sunny' },
  { key: 'plan', label: 'Plan', icon: 'calendar-outline', active: 'calendar' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline', active: 'compass' },
  { key: 'groceries', label: 'Groceries', icon: 'basket-outline', active: 'basket' },
  { key: 'me', label: 'Me', icon: 'person-outline', active: 'person' },
];

export default function UserShell() {
  const { ready, profile } = usePlanner();
  const [tab, setTab] = useState<Tab>('today');
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [target, setTarget] = useState<Target | null>(null);
  const [detail, setDetail] = useState<MealPreview | null>(null);
  const [ingredient, setIngredient] = useState<{ name: string; n: number } | null>(null);
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

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.pandan} />
      </View>
    );
  }

  if (!profile.onboarded) return <OnboardingScreen />;

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

  // All tabs stay mounted so search results and scroll positions are kept.
  const pane = (key: Tab) => [styles.pane, tab !== key && styles.hidden];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={pane('today')}>
        <TodayScreen onPickFor={pickFor} onOpenMeal={setDetail} onGoPlan={() => setTab('plan')} />
      </View>
      <View style={pane('plan')}>
        <PlannerScreen selectedDate={selectedDate} onSelectDate={setSelectedDate} onPickFor={pickFor} onOpenMeal={setDetail} />
      </View>
      <View style={pane('discover')}>
        <DiscoverScreen
          target={target}
          ingredient={ingredient}
          onClearTarget={() => setTarget(null)}
          onClearIngredient={() => setIngredient(null)}
          onOpenMeal={setDetail}
        />
      </View>
      <View style={pane('groceries')}>
        <GroceryScreen
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onGoPlan={() => setTab('plan')}
          onFindRecipes={(name) => {
            setIngredient({ name, n: Date.now() });
            setTab('discover');
          }}
        />
      </View>
      <View style={pane('me')}>
        <ProfileScreen />
      </View>

      <TabBar tabs={TABS} tab={tab} onChange={setTab} />

      <MealDetailModal preview={detail} target={target} onClose={() => setDetail(null)} onAdded={handleAdded} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pane: { flex: 1 },
  hidden: { display: 'none' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
