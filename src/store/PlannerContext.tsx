import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bus } from '../events';
import {
  DEFAULT_PROFILE,
  EMPTY_USER_DATA,
  type ManualItem,
  type Meal,
  type MealNote,
  type MealPreview,
  type PantryItem,
  type Plan,
  type Profile,
  type SlotKey,
  type UserData,
  SLOT_ORDER,
} from '../types';
import { addDays, formatDay, parseISO, toISO } from '../utils/dates';
import { uid } from '../utils/id';

const userKey = (id: string) => `@mealwise/user/${id}`;

type State = UserData & { ready: boolean };

type Action =
  | { type: 'reset' }
  | { type: 'hydrate'; payload: Partial<UserData> }
  | { type: 'setMeal'; date: string; slot: SlotKey; meal: Meal }
  | { type: 'removeMeal'; date: string; slot: SlotKey }
  | { type: 'clearDay'; date: string }
  | { type: 'copyDay'; from: string; to: string }
  | { type: 'copyWeek'; weekStart: string }
  | { type: 'toggleFavorite'; meal: MealPreview }
  | { type: 'toggleChecked'; key: string }
  | { type: 'clearChecked'; prefix: string }
  | { type: 'addPantry'; item: PantryItem }
  | { type: 'removePantry'; id: string }
  | { type: 'addManual'; item: ManualItem }
  | { type: 'removeManual'; id: string }
  | { type: 'saveCustom'; meal: Meal }
  | { type: 'deleteCustom'; id: string }
  | { type: 'setNote'; mealId: string; note: MealNote }
  | { type: 'toggleCooked'; key: string }
  | { type: 'setCalories'; date: string; slot: SlotKey; calories?: number }
  | { type: 'setProfile'; profile: Profile }
  | { type: 'wipe' };

const INITIAL: State = { ...EMPTY_USER_DATA, ready: false };

/** Copies a week into the next one, only into slots that are still empty. */
function copyWeekPlan(plan: Plan, weekStart: string): { plan: Plan; count: number } {
  const next: Plan = { ...plan };
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const from = toISO(addDays(parseISO(weekStart), i));
    const to = toISO(addDays(parseISO(weekStart), i + 7));
    const src = plan[from];
    if (!src) continue;
    const dest = { ...(next[to] ?? {}) };
    SLOT_ORDER.forEach((slot) => {
      if (src[slot] && !dest[slot]) {
        dest[slot] = src[slot];
        count += 1;
      }
    });
    next[to] = dest;
  }
  return { plan: next, count };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return INITIAL;
    case 'hydrate':
      return {
        ...EMPTY_USER_DATA,
        ...action.payload,
        profile: { ...DEFAULT_PROFILE, ...(action.payload.profile ?? {}) },
        ready: true,
      };
    case 'setMeal':
      return {
        ...state,
        plan: { ...state.plan, [action.date]: { ...state.plan[action.date], [action.slot]: action.meal } },
      };
    case 'removeMeal': {
      const day = { ...state.plan[action.date] };
      delete day[action.slot];
      const cooked = { ...state.cooked };
      delete cooked[`${action.date}|${action.slot}`];
      return { ...state, plan: { ...state.plan, [action.date]: day }, cooked };
    }
    case 'clearDay': {
      const plan = { ...state.plan };
      delete plan[action.date];
      const cooked = { ...state.cooked };
      SLOT_ORDER.forEach((s) => delete cooked[`${action.date}|${s}`]);
      return { ...state, plan, cooked };
    }
    case 'copyDay': {
      const src = state.plan[action.from];
      if (!src) return state;
      return { ...state, plan: { ...state.plan, [action.to]: { ...src } } };
    }
    case 'copyWeek':
      return { ...state, plan: copyWeekPlan(state.plan, action.weekStart).plan };
    case 'toggleFavorite': {
      const exists = state.favorites.some((f) => f.id === action.meal.id);
      return {
        ...state,
        favorites: exists ? state.favorites.filter((f) => f.id !== action.meal.id) : [action.meal, ...state.favorites],
      };
    }
    case 'toggleChecked': {
      const checked = { ...state.checked };
      if (checked[action.key]) delete checked[action.key];
      else checked[action.key] = true;
      return { ...state, checked };
    }
    case 'clearChecked': {
      const checked: Record<string, true> = {};
      Object.keys(state.checked).forEach((k) => {
        if (!k.startsWith(action.prefix)) checked[k] = true;
      });
      return { ...state, checked };
    }
    case 'addPantry':
      return { ...state, pantry: [...state.pantry, action.item] };
    case 'removePantry':
      return { ...state, pantry: state.pantry.filter((p) => p.id !== action.id) };
    case 'addManual':
      return { ...state, manual: [...state.manual, action.item] };
    case 'removeManual':
      return { ...state, manual: state.manual.filter((m) => m.id !== action.id) };
    case 'saveCustom': {
      const exists = state.custom.some((c) => c.id === action.meal.id);
      return {
        ...state,
        custom: exists ? state.custom.map((c) => (c.id === action.meal.id ? action.meal : c)) : [action.meal, ...state.custom],
      };
    }
    case 'deleteCustom':
      return {
        ...state,
        custom: state.custom.filter((c) => c.id !== action.id),
        favorites: state.favorites.filter((f) => f.id !== action.id),
      };
    case 'setNote':
      return { ...state, notes: { ...state.notes, [action.mealId]: action.note } };
    case 'toggleCooked': {
      const cooked = { ...state.cooked };
      if (cooked[action.key]) delete cooked[action.key];
      else cooked[action.key] = true;
      return { ...state, cooked };
    }
    case 'setCalories': {
      const meal = state.plan[action.date]?.[action.slot];
      if (!meal) return state;
      const updated: Meal = { ...meal };
      if (action.calories && action.calories > 0) updated.calories = action.calories;
      else delete updated.calories;
      return { ...state, plan: { ...state.plan, [action.date]: { ...state.plan[action.date], [action.slot]: updated } } };
    }
    case 'setProfile':
      return { ...state, profile: action.profile };
    case 'wipe':
      return { ...EMPTY_USER_DATA, profile: state.profile, ready: true };
    default:
      return state;
  }
}

interface PlannerApi extends UserData {
  ready: boolean;
  setMeal: (date: string, slot: SlotKey, meal: Meal, opts?: { silent?: boolean }) => void;
  removeMeal: (date: string, slot: SlotKey) => void;
  clearDay: (date: string) => void;
  copyDay: (from: string, to: string) => void;
  copyWeek: (weekStart: string) => void;
  toggleFavorite: (meal: MealPreview) => void;
  isFavorite: (id: string) => boolean;
  toggleChecked: (key: string) => void;
  clearChecked: (prefix: string) => void;
  addPantry: (name: string) => boolean;
  removePantry: (id: string) => void;
  addManual: (name: string, week: string) => void;
  removeManual: (id: string) => void;
  saveCustom: (meal: Meal) => void;
  deleteCustom: (id: string) => void;
  setNote: (mealId: string, note: MealNote) => void;
  toggleCooked: (date: string, slot: SlotKey) => void;
  setCalories: (date: string, slot: SlotKey, calories?: number) => void;
  setProfile: (profile: Profile) => void;
  wipeData: () => void;
}

const Ctx = createContext<PlannerApi | null>(null);

export function PlannerProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load this user's saved data.
  useEffect(() => {
    let alive = true;
    dispatch({ type: 'reset' });
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(userKey(userId));
        if (alive) dispatch({ type: 'hydrate', payload: raw ? (JSON.parse(raw) as Partial<UserData>) : {} });
      } catch {
        if (alive) dispatch({ type: 'hydrate', payload: {} });
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  // Save whenever the data changes.
  useEffect(() => {
    if (!state.ready) return;
    const data: UserData = {
      profile: state.profile,
      plan: state.plan,
      favorites: state.favorites,
      checked: state.checked,
      pantry: state.pantry,
      manual: state.manual,
      custom: state.custom,
      notes: state.notes,
      cooked: state.cooked,
    };
    AsyncStorage.setItem(userKey(userId), JSON.stringify(data)).catch(() => {});
  }, [state, userId]);

  const setMeal = useCallback<PlannerApi['setMeal']>((date, slot, meal, opts) => {
    const replaced = !!stateRef.current.plan[date]?.[slot];
    dispatch({ type: 'setMeal', date, slot, meal });
    if (!opts?.silent) bus.emit('meal:added', { meal, date, slot, replaced });
  }, []);

  const removeMeal = useCallback<PlannerApi['removeMeal']>((date, slot) => {
    const meal = stateRef.current.plan[date]?.[slot];
    if (!meal) return;
    dispatch({ type: 'removeMeal', date, slot });
    bus.emit('meal:removed', {
      meal,
      date,
      slot,
      undo: () => dispatch({ type: 'setMeal', date, slot, meal }),
    });
  }, []);

  const clearDay = useCallback((date: string) => dispatch({ type: 'clearDay', date }), []);

  const copyDay = useCallback((from: string, to: string) => {
    const src = stateRef.current.plan[from];
    if (!src || Object.keys(src).length === 0) {
      bus.emit('toast', { message: `${formatDay(from)} has no meals to copy.`, tone: 'info' });
      return;
    }
    dispatch({ type: 'copyDay', from, to });
    bus.emit('toast', { message: `Copied ${formatDay(from)} to ${formatDay(to)}`, tone: 'success' });
  }, []);

  const copyWeek = useCallback((weekStart: string) => {
    const { count } = copyWeekPlan(stateRef.current.plan, weekStart);
    if (count === 0) {
      bus.emit('toast', { message: 'Nothing to copy. Next week already has those meals, or this week is empty.', tone: 'info' });
      return;
    }
    dispatch({ type: 'copyWeek', weekStart });
    bus.emit('toast', { message: `Copied ${count} ${count === 1 ? 'meal' : 'meals'} to next week`, tone: 'success' });
  }, []);

  const toggleFavorite = useCallback((meal: MealPreview) => {
    const saved = !stateRef.current.favorites.some((f) => f.id === meal.id);
    dispatch({ type: 'toggleFavorite', meal });
    bus.emit('favorite:toggled', { meal, saved });
  }, []);

  const addPantry = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return false;
    if (stateRef.current.pantry.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
      bus.emit('toast', { message: `${n} is already in your pantry.`, tone: 'info' });
      return false;
    }
    dispatch({ type: 'addPantry', item: { id: uid(), name: n } });
    return true;
  }, []);

  const toggleCooked = useCallback((date: string, slot: SlotKey) => {
    const meal = stateRef.current.plan[date]?.[slot];
    if (!meal) return;
    const key = `${date}|${slot}`;
    const cooked = !stateRef.current.cooked[key];
    dispatch({ type: 'toggleCooked', key });
    bus.emit('meal:cooked', { meal, cooked });
  }, []);

  const value = useMemo<PlannerApi>(
    () => ({
      ...state,
      setMeal,
      removeMeal,
      clearDay,
      copyDay,
      copyWeek,
      toggleFavorite,
      isFavorite: (id: string) => state.favorites.some((f) => f.id === id),
      toggleChecked: (key: string) => dispatch({ type: 'toggleChecked', key }),
      clearChecked: (prefix: string) => dispatch({ type: 'clearChecked', prefix }),
      addPantry,
      removePantry: (id: string) => dispatch({ type: 'removePantry', id }),
      addManual: (name: string, week: string) => {
        const n = name.trim();
        if (n) dispatch({ type: 'addManual', item: { id: uid(), name: n, week } });
      },
      removeManual: (id: string) => dispatch({ type: 'removeManual', id }),
      saveCustom: (meal: Meal) => dispatch({ type: 'saveCustom', meal }),
      deleteCustom: (id: string) => dispatch({ type: 'deleteCustom', id }),
      setNote: (mealId: string, note: MealNote) => dispatch({ type: 'setNote', mealId, note }),
      toggleCooked,
      setCalories: (date: string, slot: SlotKey, calories?: number) =>
        dispatch({ type: 'setCalories', date, slot, calories }),
      setProfile: (profile: Profile) => dispatch({ type: 'setProfile', profile }),
      wipeData: () => dispatch({ type: 'wipe' }),
    }),
    [state, setMeal, removeMeal, clearDay, copyDay, copyWeek, toggleFavorite, addPantry, toggleCooked]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlanner(): PlannerApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlanner must be used inside <PlannerProvider>');
  return ctx;
}
