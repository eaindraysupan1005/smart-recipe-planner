import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtDateTime, type ConsentRecord, type Diet } from '../api';
import { useApp, useAuth } from '../state';
import { Back, Loading, Sheet, TabScreen, Toggle } from '../components/ui';

function dietSummary(d: Diet | null): string {
  if (!d) return '…';
  const parts = [d.vegetarian && 'Vegetarian', d.glutenFree && 'Gluten-free', d.lowCarb && 'Low-carb', ...d.allergies.map((a) => `no ${a.toLowerCase()}`)].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Nothing switched on';
}

/** P1 — account and settings. */
export function Profile() {
  const nav = useNavigate();
  const { user, signOut, setUser } = useAuth();
  const { showToast } = useApp();
  const [counts, setCounts] = useState({ pantry: 0, saved: 0 });
  const [diet, setDiet] = useState<Diet | null>(null);
  const [editName, setEditName] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    Promise.all([api.pantry(), api.recipes('saved'), api.getDiet()]).then(([p, s, d]) => {
      setCounts({ pantry: p.items.length, saved: s.recipes.length });
      setDiet(d.diet);
    });
  }, []);

  if (!user) return null;

  const download = async () => {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'what2cook-my-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Your data was downloaded');
  };

  const saveName = async () => {
    if (!editName?.trim()) return;
    const { user: u } = await api.updateMe(editName);
    setUser(u);
    setEditName(null);
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    await signOut();
    nav('/signup', { replace: true });
  };

  return (
    <TabScreen>
      <div className="pad">
        <h1 className="h1">Profile</h1>

        <div className="card pad16" style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, borderRadius: 18 }}>
          <div style={{ flex: '0 0 52px', width: 52, height: 52, borderRadius: 99, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{user.name}</div>
            <div className="sub" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
          <button className="btn-outline" style={{ width: 'auto', height: 'auto', padding: '7px 12px', borderRadius: 10, fontSize: 12.5, borderWidth: 1 }} onClick={() => setEditName(user.name)}>
            Edit
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="card pad16" style={{ flex: 1, textAlign: 'left', padding: 14 }} onClick={() => nav('/pantry')}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{counts.pantry}</div>
            <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>pantry items</div>
          </button>
          <button className="card pad16" style={{ flex: 1, textAlign: 'left', padding: 14 }} onClick={() => nav('/saved')}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{counts.saved}</div>
            <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>saved recipes</div>
          </button>
        </div>

        <div className="section"><span>Preferences</span></div>
        <div className="card">
          <NavRow title="Dietary profile" sub={dietSummary(diet)} onClick={() => nav('/profile/diet')} />
          <NavRow title="Privacy & AI consent" sub="What we send, and how to stop it" onClick={() => nav('/profile/privacy')} />
          <NavRow title="How What2Cook works" sub="Reopen the four-step guide" onClick={() => nav('/profile/manual')} />
        </div>

        <div className="section"><span>Account</span></div>
        <div className="card">
          <NavRow title="Download my data" onClick={download} />
          <button className="row clickable" style={{ padding: '15px 16px' }} onClick={async () => { await signOut(); nav('/signup'); }}>
            <div className="main" style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--red)' }}>Sign out</div>
          </button>
          <button className="row clickable" style={{ padding: '15px 16px' }} onClick={() => setConfirmDelete(true)}>
            <div className="main">
              <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--red)' }}>Delete account</div>
              <div className="meta">Removes your pantry, recipes, list and dietary profile</div>
            </div>
          </button>
        </div>
        <div className="fine" style={{ marginTop: 14 }}>
          What2Cook 1.0{user.termsAcceptedAt ? ` · Terms accepted ${fmtDateTime(user.termsAcceptedAt)} (${user.termsVersion})` : ''}
        </div>
      </div>
      <div className="grow" />

      {editName !== null && (
        <Sheet onClose={() => setEditName(null)}>
          <h2 className="h2">Edit name</h2>
          <label className="field" style={{ marginTop: 18 }}>
            <span className="label">Name</span>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
          </label>
          <button className="btn" style={{ marginTop: 22 }} onClick={saveName} disabled={!editName.trim()}>Save</button>
          <button className="muted-link" onClick={() => setEditName(null)}>Cancel</button>
        </Sheet>
      )}
      {confirmDelete && (
        <Sheet onClose={() => setConfirmDelete(false)}>
          <h2 className="h2" style={{ fontSize: 21 }}>Delete your account?</h2>
          <div className="lead" style={{ fontSize: 14 }}>
            Your pantry, saved recipes, shopping list and dietary profile are deleted for good. By law we keep the access log (account id, IP, time) for at least 90 days, and your consent records — never your food or health data.
          </div>
          <button className="btn dark" style={{ marginTop: 22, height: 54 }} onClick={deleteAccount}>Delete account</button>
          <button className="muted-link" onClick={() => setConfirmDelete(false)}>Keep my account</button>
        </Sheet>
      )}
    </TabScreen>
  );
}

function NavRow({ title, sub, onClick }: { title: string; sub?: string; onClick: () => void }) {
  return (
    <button className="row clickable" style={{ padding: '15px 16px' }} onClick={onClick}>
      <div className="main">
        <div style={{ fontSize: 15.5, fontWeight: 600 }}>{title}</div>
        {sub && <div className="meta">{sub}</div>}
      </div>
      <span className="chevron">›</span>
    </button>
  );
}

const RECORD_LABEL: Record<string, string> = {
  terms: 'Terms of Service',
  disclaimer: 'AI & Food Safety Disclaimer',
  ai_consent: 'Pantry data sent to AI service',
  diet_consent: 'Dietary filters opt-in',
  diet_filter: 'Dietary filter',
};

/** P2 — consent switches and the retrievable consent records (P3 on withdraw). */
export function Privacy() {
  const { refresh } = useAuth();
  const { showToast } = useApp();
  const [state, setState] = useState<{ aiConsent: boolean; dietConsent: boolean; records: ConsentRecord[] } | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const load = () => api.consents().then(setState);
  useEffect(() => {
    load();
  }, []);

  if (!state) return <TabScreen><Loading /></TabScreen>;

  const setConsent = async (kind: 'ai' | 'diet', granted: boolean) => {
    await api.setConsent(kind, granted);
    await Promise.all([load(), refresh()]);
    showToast(granted ? 'Consent granted and recorded' : 'Consent withdrawn and recorded');
  };

  const aiRecord = state.records.find((r) => r.kind === 'ai_consent');

  return (
    <TabScreen>
      <div className="pad">
        <div className="topbar">
          <Back to="/profile" />
          <div className="title" style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>Privacy &amp; AI consent</div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <div className="row" style={{ padding: '15px 16px' }}>
            <div className="main">
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>Send my pantry to the AI</div>
              <div className="meta" style={{ lineHeight: 1.45 }}>
                Required to generate recipes.{' '}
                {aiRecord ? `${aiRecord.action === 'granted' ? 'Granted' : 'Withdrawn'} ${fmtDateTime(aiRecord.at)}.` : 'Not granted yet.'}
              </div>
            </div>
            <Toggle label="Send my pantry to the AI" on={state.aiConsent} onChange={(v) => (v ? setConsent('ai', true) : setConfirmWithdraw(true))} />
          </div>
          <div className="row" style={{ padding: '15px 16px' }}>
            <div className="main">
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>Use my dietary filters</div>
              <div className="meta" style={{ lineHeight: 1.45 }}>
                Health-related, so it is its own opt-in. {state.dietConsent ? '' : 'While off, recipes ignore your allergies.'}
              </div>
            </div>
            <Toggle label="Use my dietary filters" on={state.dietConsent} onChange={(v) => setConsent('diet', v)} />
          </div>
        </div>

        <div className="section"><span>Your consent records</span></div>
        <div className="card">
          {state.records.map((rec) => (
            <div key={rec.id} className="row">
              <div className="main">
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                  {rec.kind === 'diet_filter' ? rec.detail : RECORD_LABEL[rec.kind]} {rec.action === 'withdrawn' ? '— withdrawn' : ''}
                </div>
                <div className="meta" style={{ fontSize: 12 }}>{fmtDateTime(rec.at)}</div>
              </div>
              <div className="end" style={{ fontSize: 11.5, fontWeight: 700 }}>{rec.version}</div>
            </div>
          ))}
        </div>
        <div className="fine" style={{ marginTop: 12, color: 'rgba(27,26,23,0.5)' }}>
          Each record keeps your account id, the moment you agreed and the document version. Withdrawing consent stops future sends; it does not delete recipes you already saved.
        </div>
      </div>
      <div className="grow" />

      {confirmWithdraw && (
        <Sheet onClose={() => setConfirmWithdraw(false)}>
          <h2 className="h2" style={{ fontSize: 21 }}>Turn off AI recipe generation?</h2>
          <div className="lead" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Nothing from your pantry will be sent again. You keep your pantry, your shopping list and every recipe you have saved — you just cannot generate new ones until you turn this back on.
          </div>
          <button
            className="btn dark"
            style={{ marginTop: 22, height: 54, fontSize: 16 }}
            onClick={async () => {
              setConfirmWithdraw(false);
              await setConsent('ai', false);
            }}
          >
            Withdraw consent
          </button>
          <button className="muted-link" onClick={() => setConfirmWithdraw(false)}>Keep it on</button>
        </Sheet>
      )}
    </TabScreen>
  );
}
