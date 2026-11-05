export type SlotKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const SLOT_ORDER: SlotKey[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface Ingredient {
  name: string;
  measure: string;
}

/** Lightweight meal used in lists (search results). */
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
  /** api = TheMealDB, custom = made by the user, featured = made by an admin */
  source?: 'api' | 'custom' | 'featured';
  /** Calories entered by the user (optional). */
  calories?: number;
}

export const isFullMeal = (m: MealPreview): m is Meal => Array.isArray((m as Meal).ingredients);

export type DayPlan = Partial<Record<SlotKey, Meal>>;
/** Keyed by ISO date: "2026-11-04" */
export type Plan = Record<string, DayPlan>;

export interface Target {
  date: string;
  slot: SlotKey;
}

// ---------- Accounts ----------
export type Role = 'user' | 'admin';

export interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
  salt: string;
  hash: string;
  disabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// ---------- Per-user data ----------
export type Diet = 'none' | 'vegetarian' | 'vegan' | 'pescatarian';

export interface Profile {
  diet: Diet;
  exclusions: string[];
  calorieGoal: number | null;
  onboarded: boolean;
}

export const DEFAULT_PROFILE: Profile = { diet: 'none', exclusions: [], calorieGoal: null, onboarded: false };

export interface PantryItem {
  id: string;
  name: string;
}

export interface ManualItem {
  id: string;
  name: string;
  /** ISO date of the Monday of the week this item belongs to */
  week: string;
}

export interface MealNote {
  rating: number;
  note: string;
}

export interface UserData {
  profile: Profile;
  plan: Plan;
  favorites: MealPreview[];
  checked: Record<string, true>;
  pantry: PantryItem[];
  manual: ManualItem[];
  custom: Meal[];
  notes: Record<string, MealNote>;
  /** "date|slot" -> true when the meal was cooked/eaten */
  cooked: Record<string, true>;
}

export const EMPTY_USER_DATA: UserData = {
  profile: DEFAULT_PROFILE,
  plan: {},
  favorites: [],
  checked: {},
  pantry: [],
  manual: [],
  custom: [],
  notes: {},
  cooked: {},
};

// ---------- Global (admin-managed) data ----------
export interface Announcement {
  text: string;
  updatedAt: string;
}

export interface GlobalData {
  featured: Meal[];
  announcement: Announcement | null;
}
