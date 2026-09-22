import { useEffect, useState, type FormEvent } from 'react';
import { api, fmtQty, type GroceryItem } from '../api';
import { useApp } from '../state';
import { Loading, TabScreen, Tick, TrashIcon } from '../components/ui';

type ListState = { items: GroceryItem[]; sources: string[] };

/** J9 — shopping list: only what is actually missing from the pantry. */
export function Grocery() {
  const { showToast } = useApp();
  const [data, setData] = useState<ListState | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    api.grocery().then(setData);
  }, []);

  if (!data) return <TabScreen><Loading /></TabScreen>;
  const open = data.items.filter((i) => !i.checked).length;
  const done = data.items.length - open;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const r = await api.addGrocery(n, 1, '');
    setData(r);
    setName('');
    if (r.inPantry) showToast(`Heads up — ${n} is already in your pantry`);
  };

  const sourceLine = data.sources.length
    ? `Missing ingredients from ${data.sources.join(', ')}. Anything already in your pantry was left off.`
    : 'Add missing ingredients from a saved recipe, or type anything you need below.';

  return (
    <TabScreen>
      <div className="pad">
        <h1 className="h1" style={{ fontSize: 22, letterSpacing: -0.5 }}>Shopping list</h1>
        <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: 'var(--yellow-soft)' }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
            {open} item{open === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(27,26,23,0.65)', marginTop: 6 }}>{sourceLine}</div>
        </div>

        <form onSubmit={add} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input className="input" style={{ height: 48, fontSize: 15 }} placeholder="Add an item…" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="chip-btn" style={{ height: 48 }} type="submit" disabled={!name.trim()}>Add</button>
        </form>

        {data.items.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            {data.items.map((g) => (
              <div key={g.id} className="row clickable" style={{ padding: '14px 16px' }} onClick={async () => setData(await api.toggleGrocery(g.id, !g.checked))} role="checkbox" aria-checked={g.checked}>
                <Tick on={g.checked} />
                <div className="main">
                  <div className="name" style={{ textDecoration: g.checked ? 'line-through' : 'none', color: g.checked ? 'var(--ink-45)' : 'var(--ink)' }}>{g.name}</div>
                  {g.fromRecipe && <div className="meta" style={{ color: 'var(--ink-45)' }}>for {g.fromRecipe}</div>}
                </div>
                {g.unit && <div className="end" style={{ color: 'var(--ink-55)' }}>{fmtQty(g.qty, g.unit)}</div>}
                <button className="row-icon danger" aria-label={`Remove ${g.name}`} onClick={async (e) => { e.stopPropagation(); setData(await api.deleteGrocery(g.id)); }}>
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {done > 0 && (
          <button className="btn-outline" style={{ marginTop: 12 }} onClick={async () => setData(await api.clearChecked())}>
            Clear {done} bought item{done === 1 ? '' : 's'}
          </button>
        )}
        <div className="fine" style={{ marginTop: 14, color: 'var(--ink-55)' }}>Bought something? Tick it here, then scan the receipt so your pantry stays accurate.</div>
      </div>
      <div className="grow" />
    </TabScreen>
  );
}
