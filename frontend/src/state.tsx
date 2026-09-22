import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError, setUnauthorizedHandler, tokenStore, type ScannedLine, type User } from './api';

// ── Auth (dummy: any email + password) ─────────────────────────────────────

interface AuthCtx {
  user: User | null;
  ready: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

const Auth = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return;
    const { user } = await api.me();
    setUser(user);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.set(null);
      setUser(null);
    });
    // Retry while the API is unreachable (e.g. restarting); a 401 signs out
    // via the unauthorized handler, so the token is never dropped on a blip.
    const restore = async (attempt = 0): Promise<void> => {
      try {
        await refresh();
      } catch (e) {
        if (e instanceof ApiError && e.code === 'network' && attempt < 8) {
          await new Promise((r) => setTimeout(r, 750));
          return restore(attempt + 1);
        }
      }
    };
    restore().finally(() => setReady(true));
  }, [refresh]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      setUser,
      refresh,
      signIn: (token, u) => {
        tokenStore.set(token);
        setUser(u);
      },
      signOut: async () => {
        await api.logout().catch(() => {});
        tokenStore.set(null);
        setUser(null);
      },
    }),
    [user, ready, refresh],
  );
  return <Auth.Provider value={value}>{children}</Auth.Provider>;
}

export const useAuth = () => useContext(Auth)!;

// ── App session state: picked items, scan draft, cooked banner, toasts ─────

export interface ScanDraft {
  scannedAt: string;
  textLines: number;
  removed: number;
  items: ScannedLine[];
}

interface AppCtx {
  selected: string[];
  setSelected: (ids: string[] | ((prev: string[]) => string[])) => void;
  scanImage: string | null;
  setScanImage: (img: string | null) => void;
  scanDraft: ScanDraft | null;
  setScanDraft: (d: ScanDraft | null | ((prev: ScanDraft | null) => ScanDraft | null)) => void;
  justCooked: boolean;
  setJustCooked: (v: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const App = createContext<AppCtx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanDraft, setScanDraft] = useState<ScanDraft | null>(null);
  const [justCooked, setJustCooked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo(
    () => ({ selected, setSelected, scanImage, setScanImage, scanDraft, setScanDraft, justCooked, setJustCooked, toast, showToast }),
    [selected, scanImage, scanDraft, justCooked, toast, showToast],
  );
  return <App.Provider value={value}>{children}</App.Provider>;
}

export const useApp = () => useContext(App)!;

// ── First-run manual flag (per-browser convenience only) ───────────────────

const MANUAL_KEY = 'w2c.manualSeen';
export const manualSeen = {
  get: () => {
    try {
      return localStorage.getItem(MANUAL_KEY) === '1';
    } catch {
      return false;
    }
  },
  set: () => {
    try {
      localStorage.setItem(MANUAL_KEY, '1');
    } catch {
      /* ignore */
    }
  },
};
