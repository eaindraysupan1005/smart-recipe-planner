import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, fmtDay, fmtQty, type PantryItem } from '../api';
import { useApp, useAuth } from '../state';
import { CheckIcon, Loading, PencilIcon, Sheet, TabScreen, Tick, TrashIcon, UNITS, UnitSelect } from '../components/ui';

/** A3 (empty) / J4 (list) — pick what you want to use, then cook. */
export function Pantry() {
  const nav = useNavigate();
  const { selected, setSelected, justCooked, setJustCooked, showToast } = useApp();
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[] | null>(null);
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [askConsent, setAskConsent] = useState(false);

  const load = useCallback(async () => {
    const r = await api.pantry();
    setItems(r.items);
    // Drop picks for items that no longer exist.
    setSelected((sel) => sel.filter((id) => r.items.some((i) => i.id === id)));
  }, [setSelected]);

  useEffect(() => {
    load();
  }, [load]);

  if (!items) return <TabScreen><Loading /></TabScreen>;

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const remove = async (item: PantryItem) => {
    await api.deleteItem(item.id);
    showToast(`${item.name} removed`);
    load();
  };

  const cook = () => {
    if (!selected.length) return;
    if (!user?.aiConsent) setAskConsent(true);
    else nav('/recipes/generate');
  };

  if (!items.length) {
    return (
      <TabScreen>
        <div className="pad" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14 }}>
          <h1 className="h1" style={{ flex: 1 }}>My Pantry</h1>
          <ScanButton />
        </div>
        {justCooked && <CookedBanner onClose={() => setJustCooked(false)} />}
        <div className="center" style={{ padding: '0 32px 40px' }}>
          <div className="empty" style={{ width: '100%', padding: '34px 22px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--yellow-soft)', margin: '0 auto' }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 16 }}>Nothing in your pantry yet</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-60)', marginTop: 8 }}>
              Scan a grocery receipt and the AI pulls out the item lines for you. Check them once and they are in.
            </div>
            <button className="btn sm" style={{ marginTop: 20 }} onClick={() => nav('/scan')}>Scan a receipt</button>
            <button className="btn-outline" style={{ marginTop: 10 }} onClick={() => nav('/pantry/add')}>Add an item by hand</button>
          </div>
        </div>
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <div className="pad" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">My Pantry</h1>
          <div className="sub" style={{ marginTop: 2, color: 'var(--ink-45)' }}>{items.length} items · newest scan first</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" aria-label="Add item by hand" onClick={() => nav('/pantry/add')}>+</button>
          <ScanButton />
        </div>
      </div>

      {justCooked && <CookedBanner onClose={() => setJustCooked(false)} />}

      <div style={{ padding: '0 22px 12px' }}>
        <div className="section" style={{ marginTop: 14 }}>
          <span>Pick what you want to use</span>
          {selected.length > 0 && (
            <button className="link" style={{ fontSize: 12.5, textTransform: 'none', letterSpacing: 0 }} onClick={() => setSelected([])}>
              Clear
            </button>
          )}
        </div>
        <div className="card">
          {items.map((p) => {
            const on = selected.includes(p.id);
            return (
              <div key={p.id} className={`row clickable${on ? ' selected' : ''}`} onClick={() => toggle(p.id)} role="checkbox" aria-checked={on}>
                <Tick on={on} />
                <div className="main">
                  <div className="name">{p.name}</div>
                  <div className="meta" style={{ color: 'var(--ink-45)' }}>
                    {fmtQty(p.qty, p.unit)} · {p.source === 'scan' ? 'scanned' : 'added'} {fmtDay(p.scannedAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="row-icon" title="Edit" aria-label={`Edit ${p.name}`} onClick={(e) => { e.stopPropagation(); setEditing(p); }}>
                    <PencilIcon />
                  </button>
                  <button className="row-icon danger" title="Delete" aria-label={`Delete ${p.name}`} onClick={(e) => { e.stopPropagation(); remove(p); }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grow" />
      <div className="footer">
        <button className="btn" disabled={!selected.length} onClick={cook}>
          {selected.length ? `Cook with ${selected.length} selected` : 'Pick an item to start'}
        </button>
      </div>

      {editing && (
        <EditItemSheet
          item={editing}
          onClose={() => setEditing(null)}
          onDone={(msg) => {
            setEditing(null);
            showToast(msg);
            load();
          }}
        />
      )}
      {askConsent && (
        <ConsentSheet
          count={selected.length}
          onClose={() => setAskConsent(false)}
          onGranted={() => {
            setAskConsent(false);
            nav('/recipes/generate');
          }}
        />
      )}
    </TabScreen>
  );
}

function ScanButton() {
  const nav = useNavigate();
  return (
    <button className="chip-btn" onClick={() => nav('/scan')}>
      <span style={{ fontSize: 15 }}>⛶</span>Scan
    </button>
  );
}

function CookedBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="note green" style={{ margin: '0 22px 4px' }}>
      <CheckIcon color="#2F7A55" />
      <div style={{ flex: 1, lineHeight: 1.45 }}>Marked as cooked. Pantry amounts updated.</div>
      <button aria-label="Dismiss" onClick={onClose} style={{ background: 'none', border: 0, fontSize: 16, color: 'rgba(47,122,85,0.7)', padding: '0 2px' }}>×</button>
    </div>
  );
}

/** E1 — rename, requantify or delete. The added date never changes. */
function EditItemSheet({ item, onClose, onDone }: { item: PantryItem; onClose: () => void; onDone: (msg: string) => void }) {
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(String(item.qty));
  const [unit, setUnit] = useState(item.unit);
  const [error, setError] = useState('');

  const save = async () => {
    try {
      await api.updateItem(item.id, { name, qty: Number(qty), unit });
      onDone('Item updated');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save.');
    }
  };
  const del = async () => {
    await api.deleteItem(item.id);
    onDone(`${item.name} removed`);
  };

  return (
    <Sheet onClose={onClose}>
      <h2 className="h2">Edit pantry item</h2>
      <div className="sub" style={{ marginTop: 5, lineHeight: 1.5 }}>Added {fmtDay(item.scannedAt)}. The date stays as it was.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <label className="field">
          <span className="label">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="field">
          <span className="label">Quantity</span>
          <div className="qty-row">
            <input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity" />
            <UnitSelect value={unit} onChange={setUnit} units={UNITS} />
          </div>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn" style={{ marginTop: 22 }} onClick={save}>Save changes</button>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button className="btn-outline" style={{ fontWeight: 600 }} onClick={onClose}>Cancel</button>
        <button className="btn-outline danger" onClick={del}>
          <TrashIcon />
          Delete item
        </button>
      </div>
    </Sheet>
  );
}

/** J5 — consent gate before the first send to the AI service (PDPA). */
function ConsentSheet({ count, onClose, onGranted }: { count: number; onClose: () => void; onGranted: () => void }) {
  const { refresh } = useAuth();
  const [terms, setTerms] = useState(false);
  const [send, setSend] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      await api.setConsent('ai', true);
      await refresh();
      onGranted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <h2 className="h2" style={{ fontSize: 22 }}>Before we generate a recipe</h2>
      <div className="lead" style={{ fontSize: 14 }}>Here is exactly what leaves your phone.</div>

      <div className="card pad16" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6 }}>WE SEND TO OUR AI SERVICE</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 11, fontSize: 14.5 }}>
          <div><span style={{ color: 'var(--green)', fontWeight: 800, marginRight: 10 }}>✓</span>The {count} ingredients you picked</div>
          <div><span style={{ color: 'var(--green)', fontWeight: 800, marginRight: 10 }}>✓</span>Quantities and units</div>
          <div><span style={{ color: 'var(--green)', fontWeight: 800, marginRight: 10 }}>✓</span>Your dietary filters</div>
        </div>
        <div style={{ height: 1, background: 'rgba(27,26,23,0.08)', margin: '16px 0' }} />
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6 }}>WE NEVER SEND</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 11, fontSize: 14.5, color: 'rgba(27,26,23,0.75)' }}>
          <div><span style={{ color: 'var(--red)', fontWeight: 800, marginRight: 10 }}>✕</span>Your name or email</div>
          <div><span style={{ color: 'var(--red)', fontWeight: 800, marginRight: 10 }}>✕</span>Your address or household</div>
        </div>
      </div>

      <button className="tickbox" style={{ marginTop: 18 }} onClick={() => setTerms((v) => !v)} aria-pressed={terms}>
        <Tick on={terms} />
        <span>I agree to the Terms and the AI &amp; Food Safety Disclaimer.</span>
      </button>
      <button className="tickbox" style={{ marginTop: 13 }} onClick={() => setSend((v) => !v)} aria-pressed={send}>
        <Tick on={send} />
        <span>I consent to the data above being sent. I can withdraw this later in Settings.</span>
      </button>

      <button className="btn" style={{ marginTop: 22 }} disabled={!terms || !send || busy} onClick={go}>
        {busy ? 'One moment…' : 'Continue'}
      </button>
      <button className="muted-link" onClick={onClose}>Not now</button>
    </Sheet>
  );
}
