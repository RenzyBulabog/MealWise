import type { Meal } from '../types';

const m = (
  id: string,
  name: string,
  category: string,
  ingredients: [string, string][],
  steps: string[]
): Meal => ({
  id: `featured-${id}`,
  name,
  thumb: '',
  category,
  area: 'Filipino',
  instructions: steps.join('\n'),
  ingredients: ingredients.map(([name, measure]) => ({ name, measure })),
  source: 'featured',
});

/** Starter recipes added by MealWise. Admins can edit or delete them. */
export const FEATURED_SEED: Meal[] = [
  m('chicken-adobo', 'Chicken Adobo', 'Chicken', [
    ['Chicken thighs', '1 kg'], ['Soy sauce', '1/2 cup'], ['White vinegar', '1/3 cup'], ['Garlic', '6 cloves'],
    ['Bay leaves', '3'], ['Whole peppercorns', '1 tsp'], ['Water', '1 cup'], ['Sugar', '1 tsp'], ['Cooking oil', '2 tbsp'],
  ], [
    'Mix chicken, soy sauce, vinegar, garlic, bay leaves and peppercorns. Marinate for 30 minutes.',
    'Heat oil in a pot and brown the chicken on both sides. Keep the marinade.',
    'Pour in the marinade and water. Bring to a boil, then simmer for 30 minutes until tender.',
    'Add sugar and simmer uncovered until the sauce thickens. Serve with rice.',
  ]),
  m('sinigang-baboy', 'Sinigang na Baboy', 'Pork', [
    ['Pork ribs', '750 g'], ['Water', '8 cups'], ['Onion', '1'], ['Tomatoes', '2'], ['Sinigang mix', '1 pack'],
    ['Radish', '1'], ['String beans', '1 bunch'], ['Kangkong', '1 bunch'], ['Long green pepper', '2'], ['Fish sauce', '2 tbsp'],
  ], [
    'Boil the pork in water with onion and tomatoes. Skim the foam and simmer for 45 minutes until tender.',
    'Add the radish and cook for 5 minutes.',
    'Stir in the sinigang mix and fish sauce. Add string beans and green pepper and cook for 5 minutes.',
    'Add kangkong, turn off the heat and let it wilt. Serve hot.',
  ]),
  m('arroz-caldo', 'Arroz Caldo', 'Breakfast', [
    ['Glutinous rice', '1 cup'], ['Chicken', '500 g'], ['Ginger', '1/4 cup, sliced'], ['Garlic', '5 cloves'], ['Onion', '1'],
    ['Fish sauce', '3 tbsp'], ['Water', '8 cups'], ['Spring onion', '2 stalks'], ['Calamansi', '4'], ['Eggs', '2, boiled'],
  ], [
    'Saute garlic, onion and ginger until fragrant. Add the chicken and fish sauce and cook for 5 minutes.',
    'Add the rice and stir for 2 minutes. Pour in the water.',
    'Simmer for 30 to 40 minutes, stirring now and then, until thick and creamy.',
    'Top with spring onion and boiled egg. Serve with calamansi.',
  ]),
  m('tortang-talong', 'Tortang Talong', 'Vegetarian', [
    ['Eggplant', '3 long'], ['Eggs', '3'], ['Salt', '1/2 tsp'], ['Black pepper', '1/4 tsp'], ['Cooking oil', '1/4 cup'], ['Banana ketchup', 'to serve'],
  ], [
    'Grill or roast the eggplants until the skin is charred and the flesh is soft. Peel and keep the stem.',
    'Flatten the flesh gently with a fork.',
    'Beat the eggs with salt and pepper. Dip each eggplant in the egg.',
    'Fry in hot oil for 2 to 3 minutes per side until golden. Serve with banana ketchup.',
  ]),
  m('pancit-canton', 'Pancit Canton', 'Pasta', [
    ['Pancit canton noodles', '250 g'], ['Chicken breast', '200 g'], ['Carrot', '1'], ['Cabbage', '2 cups'], ['Snow peas', '1 cup'],
    ['Garlic', '3 cloves'], ['Onion', '1'], ['Soy sauce', '3 tbsp'], ['Oyster sauce', '2 tbsp'], ['Chicken broth', '1 1/2 cups'], ['Calamansi', '4'],
  ], [
    'Saute garlic and onion. Add sliced chicken and cook until done.',
    'Add carrot, then cabbage and snow peas. Cook for 2 minutes.',
    'Pour in the broth, soy sauce and oyster sauce. Bring to a boil.',
    'Add the noodles and toss until the liquid is absorbed. Serve with calamansi.',
  ]),
  m('champorado', 'Champorado', 'Breakfast', [
    ['Glutinous rice', '1 cup'], ['Cocoa powder', '3 tbsp'], ['Sugar', '1/2 cup'], ['Water', '3 cups'], ['Evaporated milk', 'to serve'],
  ], [
    'Boil the rice in water, stirring often, until soft (about 20 minutes).',
    'Stir in cocoa and sugar. Simmer for 10 minutes until thick.',
    'Serve warm with a drizzle of evaporated milk.',
  ]),
  m('ginisang-munggo', 'Ginisang Munggo', 'Pork', [
    ['Mung beans', '1 cup'], ['Pork', '150 g'], ['Garlic', '3 cloves'], ['Onion', '1'], ['Tomato', '1'], ['Fish sauce', '2 tbsp'],
    ['Water', '4 cups'], ['Spinach leaves', '2 cups'],
  ], [
    'Boil the mung beans in water for 30 minutes until soft.',
    'In another pan, saute garlic, onion and tomato. Add the pork and cook until browned.',
    'Add the boiled beans with the liquid and the fish sauce. Simmer for 10 minutes.',
    'Add the spinach and cook for 2 minutes. Serve with rice.',
  ]),
];
