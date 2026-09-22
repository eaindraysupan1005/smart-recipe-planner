import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useApp } from '../state';
import { Back, UNITS, UnitSelect } from '../components/ui';

const COMMON = [
  'Tomatoes', 'Tomato paste', 'Cherry tomatoes', 'Onions', 'Garlic', 'Ginger', 'Potatoes', 'Carrots', 'Spinach',
  'Eggs', 'Milk', 'Butter', 'Cheese', 'Yoghurt', 'Rice', 'Pasta', 'Bread', 'Chicken breast', 'Chicken thighs',
  'Minced beef', 'Tofu', 'Mushrooms', 'Bell peppers', 'Lemons', 'Limes', 'Bananas', 'Apples', 'Coriander',
  'Spring onion', 'Coconut milk', 'Soy sauce', 'Fish sauce', 'Olive oil', 'Rolled oats', 'Cucumber',
];

/** S5 — add an item without a receipt; dated today. */
export function AddItem() {
  const nav = useNavigate();
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('pieces');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const q = name.trim().toLowerCase();
  const suggestions = q ? COMMON.filter((c) => c.toLowerCase().includes(q) && c.toLowerCase() !== q).slice(0, 4) : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.addItem({ name, qty: Number(qty), unit });
      showToast(`${name.trim()} added to pantry`);
      nav('/pantry');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="screen" onSubmit={submit}>
      <div className="pad-all">
        <div className="topbar">
          <Back to="/pantry" />
          <div className="title" style={{ fontSize: 20 }}>Add item by hand</div>
        </div>
        <div className="lead" style={{ fontSize: 13.5 }}>For anything without a receipt — a market buy, a gift, something already in the cupboard.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          <label className="field">
            <span className="label">Item</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomatoes" autoFocus required />
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 5 }}>
                {suggestions.map((s) => (
                  <button type="button" key={s} className="chip small" onClick={() => setName(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </label>
          <div className="field">
            <span className="label">Quantity</span>
            <div className="qty-row">
              <input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity" />
              <UnitSelect value={unit} onChange={setUnit} units={UNITS} />
            </div>
          </div>
        </div>

        <div className="note" style={{ marginTop: 20 }}>Items you add by hand are dated today, the same way scanned items are dated from their receipt.</div>
        {error && <div className="error">{error}</div>}

        <div className="grow" />
        <button className="btn" type="submit" disabled={busy || !name.trim()}>{busy ? 'Adding…' : 'Add to pantry'}</button>
        <button type="button" className="muted-link" onClick={() => nav('/scan')}>Scan a receipt instead</button>
      </div>
    </form>
  );
}
