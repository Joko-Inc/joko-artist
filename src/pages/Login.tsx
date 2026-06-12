import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setToken } from '../auth';
import './Login.css';

type LoginView = 'sign-in' | 'forgot';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [view, setView] = useState<LoginView>('sign-in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Login failed');
        return;
      }
      const { token } = await res.json();
      setToken(token);
      onLogin();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    setDevResetUrl(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not send reset email.');
        return;
      }
      if (data.resetUrl) setDevResetUrl(data.resetUrl);
      setInfo(data.message ?? 'If an account exists for that email, a reset link has been sent.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-brand">JOKO</h1>
        <p className="login-subtitle">
          {view === 'sign-in' ? 'Sign in to your artist account' : 'Reset your password'}
        </p>

        {view === 'sign-in' ? (
          <form className="login-form" onSubmit={handleSignIn}>
            <div className="login-field">
              <label htmlFor="login-username">Username or email</label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <p className="login-forgot">
              <button
                type="button"
                className="login-link-btn"
                onClick={() => {
                  setView('forgot');
                  setError(null);
                  setInfo(null);
                  setForgotEmail(username.includes('@') ? username : '');
                }}
              >
                Forgot password?
              </button>
            </p>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleForgotPassword}>
            <p className="login-hint">
              Enter the email on your verified artist account. We&apos;ll send you a reset link.
            </p>

            <div className="login-field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-success">{info}</p>}
            {devResetUrl && (
              <p className="login-dev-link">
                Dev mode: <a href={devResetUrl}>click here to reset</a> (SMTP not configured)
              </p>
            )}

            <button type="submit" className="login-btn" disabled={busy}>
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              className="login-btn login-btn--secondary"
              onClick={() => {
                setView('sign-in');
                setError(null);
                setInfo(null);
                setDevResetUrl(null);
              }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        <p className="login-footer">
          New artist? <Link to="/onboarding">Start onboarding</Link>
        </p>
      </div>
    </div>
  );
}
