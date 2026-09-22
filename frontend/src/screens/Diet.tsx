import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, type Diet as DietT } from '../api';
import { useApp, useAuth } from '../state';
import { Back, Loading, Toggle } from '../components/ui';

const FILTERS: { key: 'vegetarian' | 'glutenFree' | 'lowCarb'; label: string }[] = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'glutenFree', label: 'Gluten-free' },
  { key: 'lowCarb', label: 'Low-carb' },
];

/** J2 — dietary profile. Nothing on by default; each switch is its own opt-in. */
export function Diet({ fromProfile = false }: { fromProfile?: boolean }) {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const { showToast } = useApp();
  const [diet, setDiet] = useState<DietT | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const exit = fromProfile ? '/profile' : '/pantry';

  useEffect(() => {
    api.getDiet().then((r) => {
      setDiet(r.diet);
      setOptions(r.allergyOptions);
    });
  }, []);

  if (!diet) return <Loading />;

  const toggleAllergy = (a: string) =>
    setDiet({ ...diet, allergies: diet.allergies.includes(a) ? diet.allergies.filter((x) => x !== a) : [...diet.allergies, a] });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.saveDiet(diet);
      await refresh();
      showToast('Dietary profile saved');
      nav(exit);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <div className="pad-all">
        <Back to={exit} />
        <h1 className="h1" style={{ marginTop: 14 }}>Your dietary profile</h1>
        <div className="lead">Optional. Nothing is switched on until you switch it on.</div>

        <div className="card" style={{ marginTop: 22 }}>
          {FILTERS.map((f) => (
            <div key={f.key} className="row" style={{ padding: '15px 16px' }}>
              <div className="main" style={{ fontSize: 15.5, fontWeight: diet[f.key] ? 600 : 500 }}>{f.label}</div>
              <Toggle label={f.label} on={diet[f.key]} onChange={(v) => setDiet({ ...diet, [f.key]: v })} />
            </div>
          ))}
        </div>

        <div className="label" style={{ marginTop: 26 }}>Allergies</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
          {options.map((a) => {
            const on = diet.allergies.includes(a);
            return (
              <button key={a} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleAllergy(a)}>
                {a}
                {on ? ' ✓' : ''}
              </button>
            );
          })}
        </div>

        <div className="note" style={{ marginTop: 26 }}>
          These filters can reveal health information, so each one you switch on is saved as its own explicit opt-in — and you can withdraw it here later.
        </div>

        {error && <div className="error">{error}</div>}
        <div className="grow" />
        <button className="btn" style={{ marginTop: 26 }} onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save profile'}
        </button>
        <button className="muted-link" onClick={() => nav(exit)}>
          {fromProfile ? 'Cancel' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
