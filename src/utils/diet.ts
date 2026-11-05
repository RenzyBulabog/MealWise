import type { Meal, Profile } from '../types';

const MEAT = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'veal', 'turkey', 'duck', 'goat', 'venison', 'bacon', 'ham',
  'sausage', 'chorizo', 'salami', 'pepperoni', 'steak', 'mince', 'ribs', 'oxtail', 'liver', 'lard', 'gelatin',
];
const FISH = [
  'fish', 'salmon', 'tuna', 'cod', 'haddock', 'mackerel', 'sardine', 'anchovy', 'anchovies', 'prawn', 'shrimp',
  'crab', 'lobster', 'squid', 'oyster', 'mussel', 'clam', 'bagoong',
];
const ANIMAL = ['egg', 'milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'honey', 'ghee', 'mayonnaise', 'whey'];

// Ingredients that contain an animal word but are plant-based.
const SAFE = /(coconut|almond|soy|oat|rice) (milk|cream)|peanut butter|cocoa butter|butternut|eggplant|nutmeg/g;

/**
 * Lists ingredients in a meal that clash with the user's diet or exclusions.
 * This is a keyword check to help the user, not medical or allergy advice.
 */
export function conflicts(meal: Meal, profile: Profile): string[] {
  const words = profile.exclusions.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (profile.diet === 'vegetarian' || profile.diet === 'vegan') words.push(...MEAT, ...FISH);
  if (profile.diet === 'pescatarian') words.push(...MEAT);
  if (profile.diet === 'vegan') words.push(...ANIMAL);
  if (words.length === 0) return [];

  const patterns = words.map((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`));
  const hits = new Set<string>();
  meal.ingredients.forEach((ing) => {
    const n = ing.name.toLowerCase().replace(SAFE, '');
    if (patterns.some((p) => p.test(n))) hits.add(ing.name);
  });
  return Array.from(hits);
}
