import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../state';
import { Tick } from '../components/ui';

/** J1 — sign-up with Terms acceptance record (dummy auth: any password). */
export function Signup() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'login' ? 'login' : 'signup';
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = mode === 'signup' ? await api.signup(email, password, accept) : await api.login(email, password);
      signIn(res.token, res.user);
      nav(res.isNew ? '/onboarding/diet' : '/pantry', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setError('');
    setParams(mode === 'signup' ? { mode: 'login' } : {});
  };

  return (
    <form className="screen" onSubmit={submit}>
      <div className="pad-all" style={{ paddingTop: 56 }}>
        <div className="logo" style={{ width: 56, height: 56, fontSize: 20 }}>W2</div>
        <div className="display" style={{ marginTop: 22 }}>What2Cook</div>
        <div className="lead">Cook what you already have. Waste less of it.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
          <label className="field" style={{ gap: 6 }}>
            <span className="label">Email</span>
            <input className="input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field" style={{ gap: 6 }}>
            <span className="label">Password</span>
            <input className="input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
        </div>

        {mode === 'signup' && (
          <>
            <button type="button" className="tickbox" style={{ marginTop: 26, padding: 14, borderRadius: 14, background: 'var(--yellow-soft)', width: '100%' }} onClick={() => setAccept((a) => !a)} aria-pressed={accept}>
              <Tick on={accept} />
              <span>
                I accept the <u>Terms</u> and the <u>AI &amp; Food Safety Disclaimer</u>.
              </span>
            </button>
            <div className="fine" style={{ marginTop: 10, fontSize: 11.5 }}>
              Your acceptance is stored with your account id, the time, and the document version — you can retrieve it any time.
            </div>
          </>
        )}

        {error && <div className="error">{error}</div>}

        <div className="grow" />
        <button className="btn" type="submit" style={{ marginTop: 28 }} disabled={busy || (mode === 'signup' && !accept)}>
          {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-55)', marginTop: 16 }}>
          {mode === 'signup' ? 'Already have an account? ' : 'New to What2Cook? '}
          <button type="button" className="link" style={{ textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }} onClick={switchMode}>
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </button>
        </div>
        <Link to="/welcome" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink-45)', marginTop: 12 }}>
          How What2Cook works
        </Link>
        <div className="fine" style={{ textAlign: 'center', marginTop: 10 }}>Demo build: any email and password work.</div>
      </div>
    </form>
  );
}
