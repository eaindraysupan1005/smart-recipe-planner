import type { DatasetRecipe } from './dataset-types.js';

/**
 * A small built-in dataset so the app works before anyone runs
 * `npm run import:recipes`. The real dataset replaces this at runtime.
 */
export const SAMPLE_RECIPES: DatasetRecipe[] = [
  {
    id: 'sample-1', name: 'Spinach & Egg Skillet', minutes: 15, servings: 2,
    ingredients: [{ name: 'Spinach', qty: 200, unit: 'g' }, { name: 'Eggs', qty: 3, unit: '' }, { name: 'Olive oil', qty: 1, unit: 'tbsp' }],
    keys: ['spinach', 'eggs', 'olive oil'], tags: ['quick', 'easy', 'one-pan', 'breakfast'],
    steps: ['Heat the oil in a wide pan over medium heat.', 'Wilt the spinach down, about 3 minutes.', 'Crack in the eggs, cover and cook until the whites set.', 'Season with salt and pepper and serve.'],
    vegetarian: true, glutenFree: true, moods: ['quick', 'light'],
  },
  {
    id: 'sample-2', name: 'Garlic Fried Rice', minutes: 20, servings: 2,
    ingredients: [{ name: 'Rice', qty: 400, unit: 'g' }, { name: 'Garlic', qty: 4, unit: 'cloves' }, { name: 'Eggs', qty: 2, unit: '' }, { name: 'Soy sauce', qty: 2, unit: 'tbsp' }],
    keys: ['rice', 'garlic', 'eggs', 'soy sauce'], tags: ['quick', 'weeknight', 'one-pan'],
    steps: ['Fry the garlic in oil until golden.', 'Add cold cooked rice and toss over high heat.', 'Push aside, scramble the eggs, then fold through.', 'Finish with soy sauce off the heat.'],
    vegetarian: true, glutenFree: false, moods: ['quick', 'comfort', 'family'],
  },
  {
    id: 'sample-3', name: 'Chicken & Garlic Rice Bowl', minutes: 35, servings: 4,
    ingredients: [{ name: 'Chicken thighs', qty: 500, unit: 'g' }, { name: 'Rice', qty: 400, unit: 'g' }, { name: 'Garlic', qty: 4, unit: 'cloves' }, { name: 'Ginger', qty: 1, unit: 'pieces' }],
    keys: ['chicken thighs', 'rice', 'garlic', 'ginger'], tags: ['family', 'dinner', 'main-dish'],
    steps: ['Cook the rice with a pinch of salt.', 'Brown the chicken skin-side down for 6 minutes.', 'Add garlic and ginger, cook 2 minutes more.', 'Slice and serve over the rice with the pan juices.'],
    vegetarian: false, glutenFree: true, moods: ['family', 'comfort'],
  },
  {
    id: 'sample-4', name: 'Crispy Chicken Wings with Chilli Dip', minutes: 45, servings: 4,
    ingredients: [{ name: 'Chicken', qty: 1, unit: 'kg' }, { name: 'Chillies', qty: 3, unit: '' }, { name: 'Garlic', qty: 2, unit: 'cloves' }, { name: 'Soy sauce', qty: 60, unit: 'ml' }],
    keys: ['chicken', 'chillies', 'garlic', 'soy sauce'], tags: ['party', 'appetizer', 'finger-food', 'sharing'],
    steps: ['Heat the oven to 220°C.', 'Toss the wings in oil and salt on a tray.', 'Roast 35 minutes until crisp, turning once.', 'Blend chillies, garlic and soy sauce for the dip.'],
    vegetarian: false, glutenFree: false, moods: ['drinks', 'friends'],
  },
  {
    id: 'sample-5', name: 'Lentil & Vegetable Soup', minutes: 50, servings: 4,
    ingredients: [{ name: 'Lentils', qty: 200, unit: 'g' }, { name: 'Carrots', qty: 2, unit: '' }, { name: 'Onions', qty: 1, unit: '' }, { name: 'Garlic', qty: 3, unit: 'cloves' }],
    keys: ['lentils', 'carrots', 'onions', 'garlic'], tags: ['soup', 'comfort-food', 'vegetarian', 'hearty'],
    steps: ['Soften the onion and carrot in oil for 6 minutes.', 'Add garlic, lentils and 1 litre of water or stock.', 'Simmer 35 minutes until the lentils collapse.', 'Season well and blend half if you like it thicker.'],
    vegetarian: true, glutenFree: true, moods: ['comfort', 'family'],
  },
  {
    id: 'sample-6', name: 'Tomato & Basil Pasta', minutes: 25, servings: 2,
    ingredients: [{ name: 'Pasta', qty: 250, unit: 'g' }, { name: 'Tomatoes', qty: 4, unit: '' }, { name: 'Garlic', qty: 2, unit: 'cloves' }, { name: 'Basil', qty: 1, unit: 'bunch' }],
    keys: ['pasta', 'tomatoes', 'garlic', 'basil'], tags: ['quick', 'vegetarian', 'weeknight', 'pasta'],
    steps: ['Boil the pasta until al dente.', 'Soften the garlic in olive oil.', 'Add chopped tomatoes and simmer 8 minutes.', 'Toss with the pasta and tear over the basil.'],
    vegetarian: true, glutenFree: false, moods: ['quick', 'light', 'family'],
  },
  {
    id: 'sample-7', name: 'Seared Salmon with Lemon Butter', minutes: 25, servings: 2,
    ingredients: [{ name: 'Salmon', qty: 2, unit: 'pieces' }, { name: 'Butter', qty: 50, unit: 'g' }, { name: 'Lemons', qty: 1, unit: '' }, { name: 'Parsley', qty: 1, unit: 'bunch' }],
    keys: ['salmon', 'butter', 'lemons', 'parsley'], tags: ['romantic', 'elegant', 'date-night', 'seafood'],
    steps: ['Pat the salmon dry and season both sides.', 'Sear skin-side down for 4 minutes.', 'Flip, add butter and lemon juice, baste for 2 minutes.', 'Rest briefly and finish with parsley.'],
    vegetarian: false, glutenFree: true, moods: ['romantic', 'light'],
  },
  {
    id: 'sample-8', name: 'Loaded Potato Wedges', minutes: 40, servings: 4,
    ingredients: [{ name: 'Potatoes', qty: 1, unit: 'kg' }, { name: 'Cheese', qty: 150, unit: 'g' }, { name: 'Spring onion', qty: 1, unit: 'bunch' }],
    keys: ['potatoes', 'cheese', 'spring onion'], tags: ['snack', 'party', 'sharing', 'finger-food'],
    steps: ['Cut the potatoes into wedges and toss with oil and salt.', 'Roast at 200°C for 30 minutes until golden.', 'Scatter over the cheese and return for 5 minutes.', 'Finish with sliced spring onion.'],
    vegetarian: true, glutenFree: true, moods: ['drinks', 'friends'],
  },
  {
    id: 'sample-9', name: 'Yoghurt & Banana Overnight Oats', minutes: 10, servings: 2,
    ingredients: [{ name: 'Rolled oats', qty: 120, unit: 'g' }, { name: 'Yoghurt', qty: 200, unit: 'g' }, { name: 'Bananas', qty: 1, unit: '' }, { name: 'Milk', qty: 150, unit: 'ml' }],
    keys: ['rolled oats', 'yoghurt', 'bananas', 'milk'], tags: ['breakfast', 'healthy', 'easy', 'no-cook'],
    steps: ['Stir the oats, yoghurt and milk together in a jar.', 'Slice in the banana and add a pinch of salt.', 'Refrigerate overnight, or at least 4 hours.', 'Loosen with a splash of milk before eating.'],
    vegetarian: true, glutenFree: false, moods: ['quick', 'light'],
  },
  {
    id: 'sample-10', name: 'Chicken Noodle Stir-fry', minutes: 25, servings: 3,
    ingredients: [{ name: 'Chicken breast', qty: 400, unit: 'g' }, { name: 'Noodles', qty: 250, unit: 'g' }, { name: 'Cabbage', qty: 200, unit: 'g' }, { name: 'Soy sauce', qty: 3, unit: 'tbsp' }],
    keys: ['chicken breast', 'noodles', 'cabbage', 'soy sauce'], tags: ['quick', 'weeknight', 'family', 'stir-fry'],
    steps: ['Soak or boil the noodles, then drain.', 'Stir-fry the sliced chicken over high heat for 4 minutes.', 'Add the cabbage and toss for 2 minutes.', 'Fold through the noodles and soy sauce.'],
    vegetarian: false, glutenFree: false, moods: ['quick', 'family', 'comfort'],
  },
];
