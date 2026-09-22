import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Recipe } from '../api';
import { useApp } from '../state';
import { Loading, TabScreen } from '../components/ui';

/** J7 — AI suggestions: keep the ones you want, delete the rest. */
export function Recipes() {
  const nav = useNavigate();
  const { showToast } = useApp();
  const [list, setList] = useState<Recipe[] | null>(null);

  const load = useCallback(() => api.recipes('generated').then((r) => setList(r.recipes)), []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (r: Recipe) => {
    await api.saveRecipe(r.id);
    showToast(`${r.name} saved`);
    nav('/saved');
  };
  const remove = async (r: Recipe) => {
    await api.deleteRecipe(r.id);
    showToast('Suggestion deleted');
    load();
  };

  return (
    <TabScreen>
      <div className="pad">
        <h1 className="h1">Recipes</h1>
        <div className="sub" style={{ marginTop: 4, lineHeight: 1.5, fontSize: 13.5 }}>
          Fresh from the AI, based on what you picked. Keep the ones you want — delete the rest.
        </div>

        {!list ? (
          <Loading />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 18 }}>
            {list.map((r) => (
              <div key={r.id} className="card pad16">
                <div onClick={() => nav(`/recipes/${r.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{r.name}</div>
                  <div className="sub" style={{ marginTop: 5 }}>
                    {[`${r.minutes} min`, ...r.generation.filters.map((f) => f.toLowerCase()), `uses ${r.ingredients.length} of your picks`].join(' · ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
                  <button className="btn" style={{ height: 42, borderRadius: 11, fontSize: 13.5 }} onClick={() => save(r)}>Add to Favorite</button>
                  <button className="btn-outline danger" style={{ width: 'auto', height: 42, borderRadius: 11, padding: '0 16px', fontSize: 13.5, borderWidth: 1 }} onClick={() => remove(r)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <div className="empty" style={{ padding: '28px 22px' }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Nothing here yet</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-60)', marginTop: 7 }}>
                  Pick ingredients in your pantry to generate a recipe. Suggestions you save move to Saved.
                </div>
              </div>
            )}
          </div>
        )}
        <button className="btn-outline dashed" style={{ marginTop: 14, height: 50 }} onClick={() => nav('/pantry')}>
          Generate from other ingredients
        </button>
        <div className="fine" style={{ marginTop: 14, color: 'var(--ink-55)' }}>
          Suggestions stay here until you save or delete them. Saving one moves it to Saved, where it stays.
        </div>
      </div>
      <div className="grow" />
    </TabScreen>
  );
}
