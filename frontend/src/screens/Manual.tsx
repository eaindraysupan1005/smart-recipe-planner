import { useNavigate } from 'react-router-dom';
import { manualSeen } from '../state';

const STEPS = [
  { title: 'Scan your receipt', body: 'Photograph a grocery receipt. The AI reads the item lines and pulls out each food item and quantity.' },
  { title: 'Check what it found', body: 'Confirm the names and quantities. The scan date is saved on every item.' },
  { title: 'Get a recipe', body: 'What2Cook suggests a meal using only what you already have in the pantry.' },
  { title: 'Cook, then shop', body: 'Mark it cooked and the pantry updates itself. Missing ingredients go to a shopping list with your stock already subtracted.' },
];

/** M0 — first-run guide, reopenable from Profile. */
export function Manual({ fromProfile = false }: { fromProfile?: boolean }) {
  const nav = useNavigate();
  const done = () => {
    manualSeen.set();
    nav(fromProfile ? '/profile' : '/signup');
  };
  return (
    <div className="screen">
      <div className="pad-all">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 12 }}>W2</div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>How What2Cook works</div>
          <button className="link" style={{ textDecoration: 'none', color: 'var(--ink-45)', fontWeight: 600 }} onClick={done}>
            {fromProfile ? 'Close' : 'Skip'}
          </button>
        </div>

        <h1 className="h1" style={{ marginTop: 26 }}>Four steps, from receipt to dinner</h1>
        <div className="lead">Read this once. You can reopen it any time from Profile.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s.title} className="card pad16" style={{ display: 'flex', gap: 13, padding: '15px 16px' }}>
              <div className="num" style={{ flex: '0 0 28px', width: 28, height: 28, borderRadius: 9, background: 'var(--yellow-soft)', fontSize: 13 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-60)', marginTop: 3 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="note sand" style={{ marginTop: 18 }}>
          Recipes are suggestions from an AI model, not food-safety advice. Check anything that looks or smells off before you cook it.
        </div>

        <div className="grow" />
        <button className="btn" style={{ marginTop: 22 }} onClick={done}>
          {fromProfile ? 'Done' : 'Got it — continue'}
        </button>
      </div>
    </div>
  );
}
