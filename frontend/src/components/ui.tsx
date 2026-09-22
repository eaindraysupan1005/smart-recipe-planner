import { useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../state';

// ── Icons (from the design) ────────────────────────────────────────────────

type IconProps = { size?: number; color?: string; weight?: number };

export const CheckIcon = ({ size = 17, color = 'currentColor', weight = 2.4 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const PencilIcon = ({ size = 15, color = '#1B1A17' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const TrashIcon = ({ size = 15, color = '#C8422B' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5M14 11v5" />
  </svg>
);

export const RefreshIcon = ({ size = 16, color = '#1B1A17' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v5h-5" />
  </svg>
);

// ── Tabs ───────────────────────────────────────────────────────────────────

const TABS = [
  {
    to: '/pantry',
    label: 'Pantry',
    icon: (
      <>
        <path d="M6 8h12a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1Z" />
        <path d="M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />
        <path d="M9 13h6" />
      </>
    ),
  },
  {
    to: '/recipes',
    label: 'Recipes',
    icon: (
      <>
        <path d="M12 3.5c1.6 0 2.6 1 2.6 2.3 1.7-.4 3.4.7 3.4 2.5 0 .6-.2 1.1-.5 1.5 1.2.5 1.8 1.6 1.5 2.8-.3 1.2-1.5 2-2.8 1.8" />
        <path d="M12 3.5c-1.6 0-2.6 1-2.6 2.3-1.7-.4-3.4.7-3.4 2.5 0 .6.2 1.1.5 1.5-1.2.5-1.8 1.6-1.5 2.8.3 1.2 1.5 2 2.8 1.8" />
        <path d="M8 14.5h8l-.8 5.2a1 1 0 0 1-1 .8H9.8a1 1 0 0 1-1-.8Z" />
      </>
    ),
  },
  { to: '/saved', label: 'Saved', icon: <path d="M6.5 4h11a1 1 0 0 1 1 1v15l-6.5-4.2L5.5 20V5a1 1 0 0 1 1-1Z" /> },
  {
    to: '/list',
    label: 'List',
    icon: (
      <>
        <path d="m3.5 7 1.6 1.6L8 5.7" />
        <path d="m3.5 16.5 1.6 1.6 2.9-2.9" />
        <path d="M11 7.5h9.5" />
        <path d="M11 17h9.5" />
      </>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
  },
];

export function Tabs() {
  return (
    <nav className="tabs" aria-label="Main">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `tab${isActive ? ' active' : ''}`} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <>
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.1 : 1.6} strokeLinecap="round" strokeLinejoin="round">
                {t.icon}
              </svg>
              {t.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** A screen that sits above the tab bar. */
export function TabScreen({ children }: { children: ReactNode }) {
  return (
    <div className="screen">
      {children}
      <Tabs />
    </div>
  );
}

// ── Small pieces ───────────────────────────────────────────────────────────

export function Back({ to, dark }: { to?: string; dark?: boolean }) {
  const nav = useNavigate();
  return (
    <button className="back" aria-label="Back" style={dark ? { color: '#fff' } : undefined} onClick={() => (to ? nav(to) : nav(-1))}>
      ←
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle${on ? ' on' : ''}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export function Tick({ on }: { on: boolean }) {
  return <span className={`check${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>;
}

export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        {children}
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="center">
      <div className="spinner" />
    </div>
  );
}

export function Toast() {
  const { toast } = useApp();
  return toast ? (
    <div className="toast" role="status">
      {toast}
    </div>
  ) : null;
}

export function UnitSelect({ value, onChange, units }: { value: string; onChange: (u: string) => void; units: string[] }) {
  const all = units.includes(value) || !value ? units : [value, ...units];
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Unit">
      {all.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  );
}

export const UNITS = ['pieces', 'g', 'kg', 'ml', 'L', 'bag', 'tub', 'bunch', 'btl', 'can', 'pack', 'bulb', 'jar'];
