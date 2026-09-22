export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  aiConsent: boolean;
  aiConsentAt: string | null;
  dietConsent: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
}

export interface PantryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  scannedAt: string;
  source: 'scan' | 'manual';
}

export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  minutes: number;
  tags: string[];
  ingredients: Ingredient[];
  staples: string[];
  steps: string[];
  excluded: { name: string; reason: string }[];
  status: 'generated' | 'saved';
  pickedItemIds: string[];
  generation: { model: string; filters: string[]; createdAt: string; durationMs: number; variant: number; regeneratedFrom?: string };
  savedAt?: string;
  lastCookedAt?: string;
  check: { have: (Ingredient & { stock: string })[]; need: Ingredient[] };
}

export interface ScannedLine extends Ingredient {
  raw: string;
  /** false when the line didn't match a known food — worth a second look. */
  confident: boolean;
  alreadyHave: boolean;
}

export interface Diet {
  vegetarian: boolean;
  glutenFree: boolean;
  lowCarb: boolean;
  allergies: string[];
}

export interface ConsentRecord {
  id: string;
  kind: string;
  action: 'granted' | 'withdrawn';
  version: string;
  detail?: string;
  at: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  checked: boolean;
  fromRecipe?: string;
}

export interface Deduction {
  pantryItemId: string | null;
  name: string;
  unit: string;
  before: number;
  use: number;
  after: number;
  tracked: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const TOKEN_KEY = 'w2c.token';

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable — session lasts for this tab only */
    }
  },
};

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

async function request<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', "Can't reach What2Cook right now. Check your connection.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    // A 5xx with no API error body means the dev proxy couldn't reach the API.
    if (res.status >= 500 && !data?.error) {
      throw new ApiError(res.status, 'network', "Can't reach What2Cook right now. Try again in a moment.");
    }
    throw new ApiError(res.status, data?.error?.code ?? 'error', data?.error?.message ?? 'Something went wrong.');
  }
  return data as T;
}

type AuthResult = { token: string; user: User; isNew: boolean };

export const api = {
  signup: (email: string, password: string, acceptTerms: boolean) =>
    request<AuthResult>('POST', '/auth/signup', { email, password, acceptTerms }),
  login: (email: string, password: string) => request<AuthResult>('POST', '/auth/login', { email, password }),
  logout: () => request<void>('POST', '/auth/logout'),
  me: () => request<{ user: User }>('GET', '/auth/me'),
  updateMe: (name: string) => request<{ user: User }>('PATCH', '/auth/me', { name }),

  getDiet: () => request<{ diet: Diet; allergyOptions: string[] }>('GET', '/profile/diet'),
  saveDiet: (diet: Diet) => request<{ diet: Diet }>('PUT', '/profile/diet', diet),
  consents: () => request<{ aiConsent: boolean; dietConsent: boolean; records: ConsentRecord[] }>('GET', '/profile/consents'),
  setConsent: (kind: 'ai' | 'diet', granted: boolean) =>
    request<{ aiConsent: boolean; dietConsent: boolean }>('POST', `/profile/consents/${kind}`, { granted }),
  exportData: () => request<unknown>('GET', '/profile/export'),
  deleteAccount: () => request<void>('DELETE', '/profile/account'),

  pantry: () => request<{ items: PantryItem[]; units: string[] }>('GET', '/pantry'),
  addItem: (item: Ingredient) => request<{ item: PantryItem }>('POST', '/pantry', item),
  addItems: (items: Ingredient[], scannedAt: string) =>
    request<{ items: PantryItem[] }>('POST', '/pantry/bulk', { items, scannedAt }),
  updateItem: (id: string, patch: Partial<Ingredient>) => request<{ item: PantryItem }>('PATCH', `/pantry/${id}`, patch),
  deleteItem: (id: string) => request<void>('DELETE', `/pantry/${id}`),
  /** Sends only item text lines read on the phone — never the photo. */
  scan: (lines: string[]) => request<{ scannedAt: string; items: ScannedLine[] }>('POST', '/scan', { lines }),

  recipes: (status: 'generated' | 'saved') => request<{ recipes: Recipe[] }>('GET', `/recipes?status=${status}`),
  recipe: (id: string) => request<{ recipe: Recipe }>('GET', `/recipes/${id}`),
  generate: (itemIds: string[], simulateFailure = false) =>
    request<{ recipe: Recipe }>('POST', '/recipes/generate', { itemIds }, simulateFailure ? { 'x-simulate-ai-failure': '1' } : {}),
  regenerate: (id: string) => request<{ recipe: Recipe }>('POST', `/recipes/${id}/regenerate`),
  saveRecipe: (id: string) => request<{ recipe: Recipe }>('POST', `/recipes/${id}/save`),
  deleteRecipe: (id: string) => request<void>('DELETE', `/recipes/${id}`),
  cookPreview: (id: string) => request<{ deductions: Deduction[]; staples: string[] }>('GET', `/recipes/${id}/cook-preview`),
  cook: (id: string, leftovers: Record<string, number>) =>
    request<{ pantry: PantryItem[] }>('POST', `/recipes/${id}/cook`, { leftovers }),
  missingToGrocery: (id: string) => request<{ added: number; total: number }>('POST', `/recipes/${id}/missing-to-grocery`),

  grocery: () => request<{ items: GroceryItem[]; sources: string[] }>('GET', '/grocery'),
  addGrocery: (name: string, qty: number, unit: string) =>
    request<{ items: GroceryItem[]; sources: string[]; inPantry: boolean }>('POST', '/grocery', { name, qty, unit }),
  toggleGrocery: (id: string, checked: boolean) =>
    request<{ items: GroceryItem[]; sources: string[] }>('PATCH', `/grocery/${id}`, { checked }),
  deleteGrocery: (id: string) => request<{ items: GroceryItem[]; sources: string[] }>('DELETE', `/grocery/${id}`),
  clearChecked: () => request<{ items: GroceryItem[]; sources: string[] }>('DELETE', '/grocery/checked'),
};

// ── Formatting helpers ─────────────────────────────────────────────────────

export const fmtQty = (qty: number, unit: string) => `${Math.round(qty * 100) / 100}${unit ? ' ' + unit : ''}`;

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
};
