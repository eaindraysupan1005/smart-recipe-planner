import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, fmtDay, fmtQty, type Recipe } from '../api';
import { useApp } from '../state';
import { Back, Loading, TabScreen } from '../components/ui';

/** R2 — saved recipes, searchable by name or ingredient. */
export function Saved() {
  const nav = useNavigate();
  const [list, setList] = useState<Recipe[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.recipes('saved').then((r) => setList(r.recipes));
  }, []);

  const query = q.trim().toLowerCase();
  const shown = (list ?? []).filter(
    (r) => !query || r.name.toLowerCase().includes(query) || r.ingredients.some((i) => i.name.toLowerCase().includes(query)),
  );

  return (
    <TabScreen>
      <div className="pad">
        <h1 className="h1">Saved recipes</h1>
        <div className="sub" style={{ marginTop: 4, fontSize: 13.5 }}>Tap one to cook it again — we check your pantry first.</div>
        <label className="search" style={{ marginTop: 16 }}>
          <span aria-hidden>🔍</span>
          <input placeholder="Search by recipe or ingredient" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>

        {!list ? (
          <Loading />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
            {shown.map((r) => {
              const need = r.check.need.length;
              return (
                <button key={r.id} className="card pad16" style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%' }} onClick={() => nav(`/saved/${r.id}`)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{r.name}</div>
                    <div className="sub" style={{ marginTop: 5 }}>
                      {r.minutes} min · saved {fmtDay(r.savedAt!)}
                      {r.lastCookedAt ? ` · cooked ${fmtDay(r.lastCookedAt)}` : ''}
                    </div>
                    <span className={`pill ${need ? 'red' : 'green'}`} style={{ display: 'inline-block', marginTop: 9, fontSize: 12, fontWeight: 700, padding: '5px 10px' }}>
                      {need ? `Missing ${need} ingredient${need > 1 ? 's' : ''}` : 'You have everything'}
                    </span>
                  </div>
                  <span className="chevron" style={{ fontSize: 20 }}>›</span>
                </button>
              );
            })}
            {list.length === 0 && (
              <div className="empty">
                <div style={{ fontSize: 17, fontWeight: 700 }}>No saved recipes yet</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-60)', marginTop: 7 }}>Save a suggestion you like and it will live here.</div>
              </div>
            )}
            {list.length > 0 && shown.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 20 }}>No saved recipe matches “{q}”.</div>}
          </div>
        )}
      </div>
      <div className="grow" />
    </TabScreen>
  );
}

/** R3 — cook again: local pantry check, missing items to the list. */
export function SavedCheck() {
  const { id } = useParams();
  const nav = useNavigate();
  const { showToast } = useApp();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .recipe(id!)
      .then((r) => setRecipe(r.recipe))
      .catch(() => nav('/saved', { replace: true }));
  }, [id, nav]);

  if (!recipe) return <TabScreen><Loading /></TabScreen>;
  const { have, need } = recipe.check;
  const total = have.length + need.length;

  const addMissing = async () => {
    setBusy(true);
    try {
      await api.missingToGrocery(recipe.id);
      showToast(`${need.length} item${need.length > 1 ? 's' : ''} added to your list`);
      nav('/list');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await api.deleteRecipe(recipe.id);
    showToast('Recipe removed from Saved');
    nav('/saved');
  };

  return (
    <TabScreen>
      <div className="pad">
        <div className="topbar">
          <Back to="/saved" />
          <div className="title" style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{recipe.name}</div>
        </div>

        <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: need.length ? 'var(--yellow-soft)' : 'var(--green-soft)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.2 }}>You have {have.length} of {total} ingredients</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(27,26,23,0.65)', marginTop: 5 }}>
            {need.length
              ? `${need.length} thing${need.length > 1 ? 's are' : ' is'} missing. Send ${need.length > 1 ? 'them' : 'it'} to your shopping list and cook this when you are back.`
              : 'Everything this recipe needs is in your pantry right now.'}
          </div>
        </div>

        {have.length > 0 && (
          <>
            <div className="section"><span>Already in your pantry</span></div>
            <div className="card">
              {have.map((i) => (
                <div key={i.name} className="row">
                  <div className="dot ok">✓</div>
                  <div className="main name">{i.name}</div>
                  <div className="end">{i.stock}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {need.length > 0 && (
          <>
            <div className="section" style={{ color: 'var(--red)' }}><span>You need to buy</span></div>
            <div className="card" style={{ borderColor: 'rgba(200,66,43,0.25)' }}>
              {need.map((i) => (
                <div key={i.name} className="row">
                  <div className="dot warn">!</div>
                  <div className="main name" style={{ fontWeight: 600 }}>{i.name}</div>
                  <div className="end">{fmtQty(i.qty, i.unit)}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="fine" style={{ marginTop: 12, color: 'var(--ink-55)' }}>
          Checked against your pantry just now. Nothing was sent to the AI service — this is a local comparison.
        </div>
        <button className="muted-link" style={{ color: 'var(--red)', fontSize: 13 }} onClick={remove}>Remove from Saved</button>
      </div>

      <div className="grow" />
      <div className="footer">
        {need.length ? (
          <>
            <button className="btn" onClick={addMissing} disabled={busy}>
              Add {need.length} missing item{need.length > 1 ? 's' : ''} to list
            </button>
            <button className="muted-link" style={{ marginTop: 12 }} onClick={() => nav(`/recipes/${recipe.id}`)}>View the recipe</button>
          </>
        ) : (
          <button className="btn" onClick={() => nav(`/recipes/${recipe.id}`)}>Open the recipe</button>
        )}
      </div>
    </TabScreen>
  );
}
