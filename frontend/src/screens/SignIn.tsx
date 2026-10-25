import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../state';
import { Tick } from '../components/ui';

/** Mirrors the backend rule: length first, then the obvious traps. */
function strengthOf(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  if (pw.length < 8) return { score: 0, label: 'Too short — 8 characters minimum' };
  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 14) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  return { score, label: ['Weak', 'Fair', 'Good', 'Strong', 'Very strong'][score] };
}

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.2-3.8 6.6-9.5 6.6-16.2Z" />
    <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1Z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.6 2.1-8.8 2.1-6.3 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48Z" />
  </svg>
);

/** J1 — sign in or create an account, with Google as an alternative. */
export function SignIn() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'signup' ? 'signup' : 'signin';
  const { signIn } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState(params.get('error') ?? '');
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    api.providers().then((p) => setGoogleReady(p.google)).catch(() => setGoogleReady(false));
  }, []);

  const strength = useMemo(() => strengthOf(password), [password]);
  const canSubmit = email.trim() && password && (mode === 'signin' || (accept && strength.score >= 0 && password.length >= 8));

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
    setParams(mode === 'signup' ? {} : { mode: 'signup' });
  };

  return (
    <form className="screen" onSubmit={submit}>
      <div className="pad-all" style={{ paddingTop: 52 }}>
        <div className="logo" style={{ width: 56, height: 56, fontSize: 20 }}>W2</div>
        <div className="display" style={{ marginTop: 20 }}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</div>
        <div className="lead">
          {mode === 'signup' ? 'Cook what you already have. Waste less of it.' : 'Sign in to get back to your pantry.'}
        </div>

        {googleReady && (
          <>
            <a className="btn-google" href={`/api/auth/google?returnTo=${encodeURIComponent('/pantry')}`}>
              <GoogleMark />
              Continue with Google
            </a>
            <div className="divider"><span>or with email</span></div>
          </>
        )}

        {/* The Google block already provides the gap when it is shown. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: googleReady ? 0 : 28 }}>
          <label className="field" style={{ gap: 6 }}>
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field" style={{ gap: 6 }}>
            <span className="label">Password</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ paddingRight: 64 }}
                type={show ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="reveal" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
            {mode === 'signup' && password.length > 0 && (
              <div className="strength" aria-live="polite">
                <div className="bars">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={i < strength.score ? `on s${strength.score}` : ''} />
                  ))}
                </div>
                <span className="sub" style={{ fontSize: 12 }}>{strength.label}</span>
              </div>
            )}
          </label>
        </div>

        {mode === 'signup' && (
          <>
            <button
              type="button"
              className="tickbox"
              style={{ marginTop: 22, padding: 14, borderRadius: 14, background: 'var(--yellow-soft)', width: '100%' }}
              onClick={() => setAccept((a) => !a)}
              aria-pressed={accept}
            >
              <Tick on={accept} />
              <span>
                I accept the <u>Terms</u> and the <u>AI &amp; Food Safety Disclaimer</u>.
              </span>
            </button>
            <div className="fine" style={{ marginTop: 10, fontSize: 11.5 }}>
              Your acceptance is stored with your account id, the time and the document version — you can retrieve it any time.
            </div>
          </>
        )}

        {error && <div className="error">{error}</div>}

        <div className="grow" />
        <button className="btn" type="submit" style={{ marginTop: 24 }} disabled={busy || !canSubmit}>
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
      </div>
    </form>
  );
}

/** Where Google sends the browser back. Swaps the one-time code for a session. */
export function AuthCallback() {
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('c');
    if (!code) {
      nav('/signin', { replace: true });
      return;
    }
    api
      .exchange(code)
      .then((res) => {
        signIn(res.token, res.user);
        const returnTo = params.get('returnTo');
        nav(res.isNew ? '/onboarding/diet' : returnTo || '/pantry', { replace: true });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'That sign-in did not complete.'));
    // once, on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen">
      <div className="center">
        {error ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Sign-in didn't complete</div>
            <div className="lead" style={{ marginTop: 0 }}>{error}</div>
            <button className="btn sm" onClick={() => nav('/signin', { replace: true })}>Back to sign in</button>
          </>
        ) : (
          <>
            <div className="spinner" />
            <div style={{ fontSize: 17, fontWeight: 700 }}>Signing you in…</div>
          </>
        )}
      </div>
    </div>
  );
}
