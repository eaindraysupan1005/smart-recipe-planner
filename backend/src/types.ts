export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/** Dummy auth: we store only an opaque session token, never a password (PDPA). */
export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export type RecordKind =
  | 'terms'
  | 'disclaimer'
  | 'ai_consent'
  | 'diet_consent'
  | 'diet_filter';

/** ETA §9/26/28 — retrievable acceptance / consent / withdrawal record. */
export interface AcceptanceRecord {
  id: string;
  userId: string;
  kind: RecordKind;
  action: 'granted' | 'withdrawn';
  version: string;
  detail?: string;
  at: string;
}

export interface DietProfile {
  userId: string;
  vegetarian: boolean;
  glutenFree: boolean;
  lowCarb: boolean;
  allergies: string[];
  updatedAt: string;
}

export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  qty: number;
  unit: string;
  scannedAt: string;
  source: 'scan' | 'manual';
  raw?: string;
}

export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

export interface GenerationRecord {
  model: string;
  pantrySnapshot: Ingredient[];
  filters: string[];
  createdAt: string;
  durationMs: number;
  variant: number;
  regeneratedFrom?: string;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  minutes: number;
  tags: string[];
  ingredients: Ingredient[];
  staples: string[];
  steps: string[];
  excluded: { name: string; reason: string }[];
  status: 'generated' | 'saved';
  pickedItemIds: string[];
  generation: GenerationRecord;
  savedAt?: string;
  lastCookedAt?: string;
}

/** ETA — reproducible AI-output record, kept apart from the (deletable) suggestion. */
export interface AiRecord {
  id: string;
  userId: string;
  recipeId: string;
  text: string;
  generation: GenerationRecord;
}

export interface GroceryItem {
  id: string;
  userId: string;
  name: string;
  qty: number;
  unit: string;
  checked: boolean;
  fromRecipe?: string;
  addedAt: string;
}

/** CCA §26 — access/traffic log, kept separately from content, ≥90 days. */
export interface AccessLog {
  id: string;
  userId: string;
  ip: string;
  at: string;
  method: string;
  path: string;
  status: number;
}

export interface DB {
  users: User[];
  sessions: Session[];
  records: AcceptanceRecord[];
  diets: DietProfile[];
  pantry: PantryItem[];
  recipes: Recipe[];
  aiRecords: AiRecord[];
  grocery: GroceryItem[];
  accessLogs: AccessLog[];
}
