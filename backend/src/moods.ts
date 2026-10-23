/**
 * Occasions ("moods") the chef cooks for. The user picks at most one, and it
 * is optional — skipping it keeps the old behaviour.
 *
 * `hint` is what we tell the AI chef; `tags` are the dataset tags that score
 * well for this occasion when the AI is unavailable (local fallback).
 */
export interface Mood {
  id: string;
  label: string;
  blurb: string;
  emoji: string;
  hint: string;
  tags: string[];
  /** Rough number of people being fed — used to scale portions. */
  serves: number;
  maxMinutes?: number;
}

export const MOODS: Mood[] = [
  {
    id: 'quick',
    label: 'Just me, quickly',
    blurb: 'One plate, minimum effort and washing up',
    emoji: '⚡',
    hint: 'Cooking alone on a weeknight. Wants one plate, few pans, under 25 minutes, no fussy technique.',
    tags: ['quick', 'easy', 'one-pan', 'weeknight', 'solo'],
    serves: 1,
    maxMinutes: 25,
  },
  {
    id: 'friends',
    label: 'Friends coming over',
    blurb: 'Something to share, cooked in one big batch',
    emoji: '🎉',
    hint: 'Feeding a group of friends at home. Wants a generous sharing dish that scales up, is forgiving if it sits a few minutes, and can be eaten casually.',
    tags: ['party', 'sharing', 'crowd', 'potluck', 'buffet', 'family-style'],
    serves: 6,
  },
  {
    id: 'drinks',
    label: 'Drinks & snacks',
    blurb: 'Salty, crispy things to eat standing up',
    emoji: '🍻',
    hint: 'Drinking with friends. Wants savoury, salty or crispy snacks eaten with the hands, in small portions, nothing that needs a knife and fork.',
    tags: ['appetizer', 'snack', 'finger-food', 'fried', 'savory', 'bar'],
    serves: 4,
    maxMinutes: 40,
  },
  {
    id: 'romantic',
    label: 'Romantic dinner',
    blurb: 'Dinner for two that looks like an effort',
    emoji: '🕯️',
    hint: 'Cooking dinner for two to impress someone. Wants an elegant plated dish, balanced, a little special, worth 45 minutes of effort.',
    tags: ['romantic', 'date-night', 'elegant', 'dinner-party', 'for-two'],
    serves: 2,
  },
  {
    id: 'comfort',
    label: 'Comfort food',
    blurb: 'Warm, filling, familiar',
    emoji: '🍜',
    hint: 'Wants comfort food: warm, hearty, filling and familiar. Soups, stews, noodles, rice bowls, bakes.',
    tags: ['comfort-food', 'stew', 'soup', 'hearty', 'casserole', 'winter'],
    serves: 3,
  },
  {
    id: 'light',
    label: 'Light & healthy',
    blurb: 'Fresh, vegetable-forward, not heavy',
    emoji: '🥗',
    hint: 'Wants something light and healthy: vegetable-forward, fresh, not fried, not heavy.',
    tags: ['healthy', 'low-fat', 'salad', 'vegetables', 'light', 'clean'],
    serves: 2,
    maxMinutes: 35,
  },
  {
    id: 'family',
    label: 'Family meal',
    blurb: 'A proper dinner that feeds everyone',
    emoji: '🍲',
    hint: 'Cooking dinner for a family including children. Wants a crowd-pleasing main, mild spice, generous portions, nothing exotic.',
    tags: ['family', 'kid-friendly', 'dinner', 'main-dish', 'weeknight'],
    serves: 4,
  },
];

export const findMood = (id: string | undefined | null): Mood | undefined =>
  id ? MOODS.find((m) => m.id === id) : undefined;
