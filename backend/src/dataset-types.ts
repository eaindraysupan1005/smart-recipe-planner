import type { Ingredient } from './types.js';

/** A recipe from the imported dataset (read-only reference data). */
export interface DatasetRecipe {
  id: string;
  name: string;
  minutes: number;
  /** Parsed where possible: {name, qty, unit}. qty 0 means "unspecified". */
  ingredients: Ingredient[];
  /** Canonical food names used for pantry matching (lowercase). */
  keys: string[];
  steps: string[];
  tags: string[];
  servings: number;
  /** Diet flags derived at import time. */
  vegetarian: boolean;
  glutenFree: boolean;
  /** Mood ids this recipe scored well for at import time. */
  moods: string[];
  source?: string;
}

export interface DatasetStats {
  count: number;
  importedAt: string;
  source: string;
  moods: Record<string, number>;
}

export interface RecipeDataset {
  stats: DatasetStats;
  recipes: DatasetRecipe[];
}
