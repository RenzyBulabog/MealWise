import type { Ingredient, Meal, MealPreview } from '../types';

// Free public recipe API: https://www.themealdb.com/api.php
const BASE = 'https://www.themealdb.com/api/json/v1/1';

type Raw = Record<string, string | null>;

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${BASE}/${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error('The recipe service is having trouble. Try again in a moment.');
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('The request took too long. Check your connection and try again.');
    }
    if (e instanceof TypeError) {
      throw new Error('Could not reach the recipe service. Check your connection and try again.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const toPreview = (r: Raw): MealPreview => ({
  id: String(r.idMeal),
  name: r.strMeal ?? 'Untitled meal',
  thumb: r.strMealThumb ?? '',
});

const toMeal = (r: Raw): Meal => {
  const ingredients: Ingredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = (r[`strIngredient${i}`] ?? '').trim();
    if (name) ingredients.push({ name, measure: (r[`strMeasure${i}`] ?? '').trim() });
  }
  return {
    ...toPreview(r),
    category: r.strCategory ?? 'Meal',
    area: r.strArea ?? '',
    instructions: (r.strInstructions ?? '').trim(),
    ingredients,
    youtube: r.strYoutube || undefined,
    source: 'api',
  };
};

const cache = new Map<string, Meal>();
const remember = (m: Meal) => {
  cache.set(m.id, m);
  return m;
};

/** Search meals by name. */
export async function searchMeals(query: string): Promise<MealPreview[]> {
  const data = await getJson<{ meals: Raw[] | null }>(`search.php?s=${encodeURIComponent(query)}`);
  return (data.meals ?? []).map((r) => remember(toMeal(r)));
}

/** Meals in a category (previews only). */
export async function filterByCategory(category: string): Promise<MealPreview[]> {
  const data = await getJson<{ meals: Raw[] | null }>(`filter.php?c=${encodeURIComponent(category)}`);
  return (data.meals ?? []).map(toPreview);
}

export async function listCategories(): Promise<string[]> {
  const data = await getJson<{ categories: { strCategory: string }[] }>('categories.php');
  return Array.from(new Set(data.categories.map((c) => c.strCategory)));
}

export async function lookupMeal(id: string): Promise<Meal> {
  const hit = cache.get(id);
  if (hit) return hit;
  const data = await getJson<{ meals: Raw[] | null }>(`lookup.php?i=${encodeURIComponent(id)}`);
  const raw = data.meals?.[0];
  if (!raw) throw new Error('That recipe could not be found.');
  return remember(toMeal(raw));
}

export async function randomMeal(): Promise<Meal> {
  const data = await getJson<{ meals: Raw[] | null }>('random.php');
  const raw = data.meals?.[0];
  if (!raw) throw new Error('Could not pick a random meal. Try again.');
  return remember(toMeal(raw));
}

export async function listAreas(): Promise<string[]> {
  const data = await getJson<{ meals: { strArea: string }[] | null }>('list.php?a=list');
  return Array.from(new Set((data.meals ?? []).map((m) => m.strArea).filter((a) => a && a !== 'Unknown')));
}

/** Meals from one cuisine, e.g. "Filipino" (previews only). */
export async function filterByArea(area: string): Promise<MealPreview[]> {
  const data = await getJson<{ meals: Raw[] | null }>(`filter.php?a=${encodeURIComponent(area)}`);
  return (data.meals ?? []).map(toPreview);
}

/** Meals that use one main ingredient (previews only). */
export async function filterByIngredient(ingredient: string): Promise<MealPreview[]> {
  const name = ingredient.trim().toLowerCase().replace(/\s+/g, '_');
  const data = await getJson<{ meals: Raw[] | null }>(`filter.php?i=${encodeURIComponent(name)}`);
  return (data.meals ?? []).map(toPreview);
}
