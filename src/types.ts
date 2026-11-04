export type SlotKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const SLOT_ORDER: SlotKey[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface Ingredient {
  name: string;
  measure: string;
}

/** Lightweight meal used in lists (search results, favorites). */
export interface MealPreview {
  id: string;
  name: string;
  thumb: string;
}

/** Full meal with recipe details. */
export interface Meal extends MealPreview {
  category: string;
  area: string;
  instructions: string;
  ingredients: Ingredient[];
  youtube?: string;
}

export type DayPlan = Partial<Record<SlotKey, Meal>>;

/** Keyed by ISO date: "2026-11-04" */
export type Plan = Record<string, DayPlan>;

/** A day + slot the user is currently choosing a meal for. */
export interface Target {
  date: string;
  slot: SlotKey;
}
