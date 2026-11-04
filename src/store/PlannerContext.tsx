import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bus } from '../events';
import type { Meal, MealPreview, Plan, SlotKey } from '../types';

const STORAGE_KEY = '@mealwise/v1';

interface State {
  plan: Plan;
  favorites: MealPreview[];
  /** Grocery items ticked off, keyed "weekStartISO|ingredient". */
  checked: Record<string, true>;
  ready: boolean;
}

type Persisted = Pick<State, 'plan' | 'favorites' | 'checked'>;

type Action =
  | { type: 'hydrate'; payload: Partial<Persisted> }
  | { type: 'setMeal'; date: string; slot: SlotKey; meal: Meal }
  | { type: 'removeMeal'; date: string; slot: SlotKey }
  | { type: 'clearDay'; date: string }
  | { type: 'toggleFavorite'; meal: MealPreview }
  | { type: 'toggleChecked'; key: string }
  | { type: 'clearChecked'; prefix: string };

const initial: State = { plan: {}, favorites: [], checked: {}, ready: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return {
        plan: action.payload.plan ?? {},
        favorites: action.payload.favorites ?? [],
        checked: action.payload.checked ?? {},
        ready: true,
      };
    case 'setMeal':
      return {
        ...state,
        plan: {
          ...state.plan,
          [action.date]: { ...state.plan[action.date], [action.slot]: action.meal },
        },
      };
    case 'removeMeal': {
      const day = { ...state.plan[action.date] };
      delete day[action.slot];
      return { ...state, plan: { ...state.plan, [action.date]: day } };
    }
    case 'clearDay': {
      const plan = { ...state.plan };
      delete plan[action.date];
      return { ...state, plan };
    }
    case 'toggleFavorite': {
      const exists = state.favorites.some((f) => f.id === action.meal.id);
      const favorites = exists
        ? state.favorites.filter((f) => f.id !== action.meal.id)
        : [{ id: action.meal.id, name: action.meal.name, thumb: action.meal.thumb }, ...state.favorites];
      return { ...state, favorites };
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
    default:
      return state;
  }
}

interface PlannerApi {
  plan: Plan;
  favorites: MealPreview[];
  checked: Record<string, true>;
  ready: boolean;
  setMeal: (date: string, slot: SlotKey, meal: Meal, opts?: { silent?: boolean }) => void;
  removeMeal: (date: string, slot: SlotKey) => void;
  clearDay: (date: string) => void;
  toggleFavorite: (meal: MealPreview) => void;
  isFavorite: (id: string) => boolean;
  toggleChecked: (key: string) => void;
  clearChecked: (prefix: string) => void;
}

const Ctx = createContext<PlannerApi | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load saved data once when the app starts.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (alive) dispatch({ type: 'hydrate', payload: raw ? (JSON.parse(raw) as Partial<Persisted>) : {} });
      } catch {
        if (alive) dispatch({ type: 'hydrate', payload: {} });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Save whenever the data changes.
  useEffect(() => {
    if (!state.ready) return;
    const data: Persisted = { plan: state.plan, favorites: state.favorites, checked: state.checked };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [state.ready, state.plan, state.favorites, state.checked]);

  const setMeal = useCallback<PlannerApi['setMeal']>((date, slot, meal, opts) => {
    const replaced = !!stateRef.current.plan[date]?.[slot];
    dispatch({ type: 'setMeal', date, slot, meal });
    if (!opts?.silent) bus.emit('meal:added', { meal, date, slot, replaced });
  }, []);

  const removeMeal = useCallback<PlannerApi['removeMeal']>((date, slot) => {
    const meal = stateRef.current.plan[date]?.[slot];
    if (!meal) return;
    dispatch({ type: 'removeMeal', date, slot });
    bus.emit('meal:removed', { meal, date, slot });
  }, []);

  const clearDay = useCallback((date: string) => dispatch({ type: 'clearDay', date }), []);

  const toggleFavorite = useCallback((meal: MealPreview) => {
    const saved = !stateRef.current.favorites.some((f) => f.id === meal.id);
    dispatch({ type: 'toggleFavorite', meal });
    bus.emit('favorite:toggled', { meal, saved });
  }, []);

  const toggleChecked = useCallback((key: string) => dispatch({ type: 'toggleChecked', key }), []);
  const clearChecked = useCallback((prefix: string) => dispatch({ type: 'clearChecked', prefix }), []);

  const value = useMemo<PlannerApi>(
    () => ({
      plan: state.plan,
      favorites: state.favorites,
      checked: state.checked,
      ready: state.ready,
      setMeal,
      removeMeal,
      clearDay,
      toggleFavorite,
      isFavorite: (id: string) => state.favorites.some((f) => f.id === id),
      toggleChecked,
      clearChecked,
    }),
    [state, setMeal, removeMeal, clearDay, toggleFavorite, toggleChecked, clearChecked]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlanner(): PlannerApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlanner must be used inside <PlannerProvider>');
  return ctx;
}
