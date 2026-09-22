import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, ApiError, fmtQty, type Deduction, type Recipe } from '../api';
import { useApp } from '../state';
import { Back, CheckIcon, Loading, RefreshIcon, Sheet, TabScreen } from '../components/ui';

/** Sends the picked items to the AI service and routes to the result. */
export function Generate() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { selected, showToast } = useApp();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!selected.length) {
      nav('/pantry', { replace: true });
      return;
    }
    api
      .generate(selected, params.get('fail') === '1')
      .then(({ recipe }) => nav(`/recipes/${recipe.id}`, { replace: true }))
      .catch((e) => {
        if (e instanceof ApiError && (e.code === 'ai_unavailable' || e.code === 'network')) nav('/recipes/unavailable', { replace: true });
        else if (e instanceof ApiError && e.code === 'consent_required') {
          showToast(e.message);
          nav('/pantry', { replace: true });
        } else setError(e instanceof ApiError ? e.message : 'Something went wrong.');
      });
  }, [nav, params, selected, showToast]);

  return (
    <TabScreen>
      <div className="center">
        {error ? (
          <>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--red-soft)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 19 }}>!</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>We couldn't make a recipe from that</div>
            <div className="lead" style={{ marginTop: 0 }}>{error}</div>
            <button className="btn sm" onClick={() => nav('/pantry')}>Back to pantry</button>
          </>
        ) : (
          <>
            <div className="spinner" />
            <div style={{ fontSize: 18, fontWeight: 700 }}>Cooking up a recipe…</div>
            <div className="sub">Using only the {selected.length} items you picked, plus basic staples.</div>
          </>
        )}
      </div>
    </TabScreen>
  );
}

/** J6 — recipe result, with Regenerate and Mark as cooked (C1). */
export function RecipeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { showToast } = useApp();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [missing, setMissing] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    setRecipe(null);
    api
      .recipe(id!)
      .then((r) => setRecipe(r.recipe))
      .catch(() => setMissing(true));
  }, [id]);

  if (missing) {
    return (
      <TabScreen>
        <div className="center">
          <div style={{ fontSize: 18, fontWeight: 700 }}>This recipe is gone</div>
          <div className="sub">It may have been deleted.</div>
          <button className="btn sm" onClick={() => nav('/recipes')}>See recipes</button>
        </div>
      </TabScreen>
    );
  }
  if (!recipe) return <TabScreen><Loading /></TabScreen>;

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const { recipe: next } = await api.regenerate(recipe.id);
      nav(`/recipes/${next.id}`, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ai_unavailable') nav('/recipes/unavailable');
      else showToast(e instanceof ApiError ? e.message : 'Could not regenerate.');
    } finally {
      setRegenerating(false);
    }
  };

  const save = async () => {
    const { recipe: saved } = await api.saveRecipe(recipe.id);
    setRecipe({ ...recipe, ...saved });
    showToast('Saved to your recipes');
  };

  const secs = (recipe.generation.durationMs / 1000).toFixed(1);
  const genLabel = recipe.generation.regeneratedFrom ? `Regenerated in ${secs}s` : `Generated in ${secs}s`;

  return (
    <TabScreen>
      <div className="pad topbar">
        <Back to={recipe.status === 'saved' ? '/saved' : '/recipes'} />
        <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-55)' }}>{genLabel}</div>
        {recipe.status === 'saved' ? (
          <span className="pill green">Saved ✓</span>
        ) : (
          <button className="link" onClick={save}>Save</button>
        )}
      </div>
      <div style={{ padding: '14px 22px 0' }}>
        <h1 className="h1" style={{ fontSize: 28, letterSpacing: -0.7 }}>{recipe.name}</h1>
        <div className="pills" style={{ marginTop: 12 }}>
          <span className="pill">⏱ {recipe.minutes} min</span>
          {recipe.tags.map((t) => (
            <span key={t} className="pill green">{t}</span>
          ))}
        </div>

        {recipe.excluded.length > 0 && (
          <div className="note" style={{ marginTop: 16 }}>
            Left out to respect your filters: {recipe.excluded.map((x) => `${x.name} (${x.reason})`).join(', ')}.
          </div>
        )}

        <div className="section"><span>Made from what you picked</span></div>
        <div className="card">
          {recipe.ingredients.map((u) => (
            <div key={u.name} className="row">
              <div className="main name">
                {u.name}
                <span style={{ color: 'var(--ink-55)', fontWeight: 400 }}> · {fmtQty(u.qty, u.unit)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="sub" style={{ marginTop: 10 }}>Staples used: {recipe.staples.join(' · ')}</div>

        <div className="section"><span>Method</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {recipe.steps.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div className="num">{i + 1}</div>
              <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.55 }}>{t}</div>
            </div>
          ))}
        </div>

        <div className="note sand" style={{ marginTop: 22, fontSize: 12 }}>
          This recipe is stored with its model version ({recipe.generation.model}), the pantry snapshot and the filters used, so it can be reproduced exactly. Check food safety yourself before cooking.
        </div>
        <button className="muted-link" style={{ fontSize: 13, color: 'var(--ink-45)', textDecoration: 'underline' }} onClick={() => nav('/recipes/unavailable')}>
          Recipe didn't come back?
        </button>
      </div>

      <div className="grow" />
      <div className="footer" style={{ display: 'flex', gap: 10 }}>
        <button className="btn-outline" style={{ width: 'auto', height: 56, padding: '0 20px', borderRadius: 16, background: '#fff', fontSize: 16 }} onClick={regenerate} disabled={regenerating}>
          <RefreshIcon />
          {regenerating ? 'Working…' : 'Regenerate'}
        </button>
        <button className="btn" style={{ flex: 1, fontSize: 16 }} onClick={() => setCooking(true)}>
          <CheckIcon />
          Mark as cooked
        </button>
      </div>

      {cooking && <CookSheet recipe={recipe} onClose={() => setCooking(false)} />}
    </TabScreen>
  );
}

/** C1 — confirm the deduction and what is left over; kept to one tap by default. */
function CookSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const nav = useNavigate();
  const { setJustCooked, setSelected } = useApp();
  const [rows, setRows] = useState<Deduction[] | null>(null);
  const [left, setLeft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.cookPreview(recipe.id).then((r) => {
      setRows(r.deductions);
      setLeft(Object.fromEntries(r.deductions.filter((d) => d.tracked).map((d) => [d.pantryItemId!, String(d.after)])));
    });
  }, [recipe.id]);

  const confirm = async () => {
    setBusy(true);
    try {
      const leftovers = Object.fromEntries(Object.entries(left).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v as number)));
      await api.cook(recipe.id, leftovers);
      setSelected([]);
      setJustCooked(true);
      nav('/pantry');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <h2 className="h2" style={{ fontSize: 21 }}>Mark as cooked?</h2>
      <div className="lead" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
        These amounts come off your pantry. Change what's left if it's different — 0 removes the item.
      </div>
      {!rows ? (
        <Loading />
      ) : (
        <div className="card" style={{ marginTop: 18 }}>
          {rows.map((d) => {
            const val = d.tracked ? left[d.pantryItemId!] ?? '' : '';
            const gone = d.tracked && Number(val) <= 0;
            return (
              <div key={d.name} className="row" style={{ gap: 10 }}>
                <div className="main" style={{ fontSize: 15, fontWeight: 500 }}>{d.name}</div>
                {d.tracked ? (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--ink-55)' }}>{fmtQty(d.before, d.unit)}</div>
                    <div style={{ fontSize: 13, color: 'rgba(27,26,23,0.35)' }}>→</div>
                    <input
                      className="inline-num"
                      inputMode="decimal"
                      aria-label={`${d.name} left over`}
                      value={val}
                      onChange={(e) => setLeft({ ...left, [d.pantryItemId!]: e.target.value })}
                      style={{ color: gone ? 'var(--red)' : 'var(--ink)' }}
                    />
                    <div style={{ fontSize: 12.5, width: 50, fontWeight: 700, color: gone ? 'var(--red)' : 'var(--ink-55)' }}>{gone ? 'used up' : d.unit}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--ink-45)' }}>not in pantry</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="sub" style={{ marginTop: 10, fontSize: 12.5 }}>Staples ({recipe.staples.join(', ')}) are not tracked.</div>
      <button className="btn" style={{ marginTop: 20 }} onClick={confirm} disabled={!rows || busy}>
        <CheckIcon />
        {busy ? 'Updating pantry…' : 'Mark as cooked'}
      </button>
      <button className="muted-link" onClick={onClose}>Not yet</button>
    </Sheet>
  );
}

/** A1 — plain-language notice, never a raw error (NFR7). */
export function Unavailable() {
  const nav = useNavigate();
  const { selected } = useApp();
  return (
    <TabScreen>
      <div className="pad">
        <Back to="/pantry" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px 40px' }}>
        <div className="card" style={{ borderRadius: 20, padding: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: 'var(--red)' }}>!</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16, lineHeight: 1.25 }}>We couldn't reach the recipe service</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-60)', marginTop: 10 }}>
            Nothing about your pantry was sent, and nothing was lost. This usually clears within a few minutes.
          </div>
          <button className="btn sm" style={{ marginTop: 20 }} onClick={() => nav(selected.length ? '/recipes/generate' : '/pantry')}>
            Try again
          </button>
          <button className="btn-outline" style={{ marginTop: 10, height: 50, fontWeight: 600, fontSize: 15 }} onClick={() => nav('/saved')}>
            Open a saved recipe
          </button>
        </div>
      </div>
    </TabScreen>
  );
}
