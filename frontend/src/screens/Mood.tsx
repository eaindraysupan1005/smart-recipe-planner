import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Mood as MoodT } from '../api';
import { useApp } from '../state';
import { Back, Loading, TabScreen } from '../components/ui';

/**
 * M1 — the occasion step. Optional: "Skip" generates the way it always did.
 * The chef uses this to choose the kind of dish, not just the ingredients.
 */
export function MoodPicker() {
  const nav = useNavigate();
  const { selected, mood, setMood } = useApp();
  const [moods, setMoods] = useState<MoodT[] | null>(null);

  useEffect(() => {
    api.moods().then((r) => setMoods(r.moods)).catch(() => setMoods([]));
  }, []);

  const go = (id: string | null) => {
    setMood(id);
    nav('/recipes/generate');
  };

  return (
    <TabScreen>
      <div className="pad">
        <div className="topbar">
          <Back to="/pantry" />
          <div className="title">What's the occasion?</div>
        </div>
        <div className="lead">
          Optional. Tell the chef why you're cooking and you'll get a different kind of dish from the same ingredients.
        </div>
        <div className="sub" style={{ marginTop: 6, color: 'var(--ink-45)' }}>
          Cooking with {selected.length} item{selected.length === 1 ? '' : 's'}.
        </div>

        {!moods ? (
          <Loading />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {moods.map((m) => {
              const on = mood === m.id;
              return (
                <button
                  key={m.id}
                  className={`card pad16 mood-card${on ? ' on' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', padding: '14px 16px' }}
                  aria-pressed={on}
                  onClick={() => setMood(on ? null : m.id)}
                >
                  <span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden>{m.emoji}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{m.label}</span>
                    <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-55)', marginTop: 2 }}>{m.blurb}</span>
                  </span>
                  <span className={`check${on ? ' on' : ''}`} style={{ borderRadius: 99 }}>{on ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grow" />
      <div className="footer">
        <button className="btn" onClick={() => go(mood)}>
          {mood ? 'Cook for this occasion' : 'Find me a recipe'}
        </button>
        <button className="muted-link" onClick={() => go(null)}>Skip — just use my ingredients</button>
      </div>
    </TabScreen>
  );
}
