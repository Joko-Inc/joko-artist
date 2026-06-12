import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { JokoLogo } from '../components/JokoLogo';
import './Onboarding.css';
import './WalletOnboarding.css';

type Step =
  | 'welcome'
  | 'intro'
  | 'profile'
  | 'wallet-connect'
  | 'wallet-verify'
  | 'wallet-verifying'
  | 'wallet-transition'
  | 'wallet-welcome'
  | 'verify-pending'
  | 'verify-success';

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  location: string;
  phone: string;
  artistStatement: string;
  website: string;
  instagram: string;
  twitter: string;
  musicLinks: string;
  otherLinks: string;
};

const emptyProfile: ProfileData = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  location: '',
  phone: '',
  artistStatement: '',
  website: '',
  instagram: '',
  twitter: '',
  musicLinks: '',
  otherLinks: '',
};

function IconUpload() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
      <path d="M4 20h16" />
    </svg>
  );
}

function IconWalletConnect() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('welcome');
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [aestheticFiles, setAestheticFiles] = useState<File[]>([]);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signMessage, setSignMessage] = useState('');

  const aestheticInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      setStep('verify-success');
    }
  }, [searchParams]);

  useEffect(() => {
    if (step !== 'welcome') return;
    const timer = setTimeout(() => setStep('intro'), 2500);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step === 'wallet-verify') {
      const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
      setSignMessage(name);
    }
  }, [step, profile.firstName, profile.lastName]);

  useEffect(() => {
    if (step === 'wallet-verifying') {
      const timer = setTimeout(() => setStep('wallet-transition'), 2200);
      return () => clearTimeout(timer);
    }
    if (step === 'wallet-transition') {
      const timer = setTimeout(() => setStep('wallet-welcome'), 2200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePic(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handleAestheticChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setAestheticFiles(files);
  };

  const validateProfile = (): string | null => {
    if (!profile.firstName.trim()) return 'First name is required.';
    if (!profile.email.trim()) return 'Email is required.';
    if (!profile.username.trim()) return 'Username is required.';
    if (profile.password.length < 8) return 'Password must be at least 8 characters.';
    if (profile.password !== profile.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleProfileSubmit = async () => {
    const validationError = validateProfile();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(profile).forEach(([key, val]) => {
        if (key !== 'confirmPassword') formData.append(key, val);
      });
      if (profilePic) formData.append('profilePic', profilePic);
      aestheticFiles.forEach((f) => formData.append('aesthetic', f));

      const res = await fetch('/api/auth/onboard', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not create account.');
        return;
      }

      if (data.verifyUrl) setDevVerifyUrl(data.verifyUrl);
      setStep('wallet-connect');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setResendMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not resend email.');
        return;
      }
      if (data.verifyUrl) setDevVerifyUrl(data.verifyUrl);
      setResendMsg(data.emailSent ? 'Verification email sent.' : 'Email logged to server console (SMTP not configured).');
      setTimeout(() => setResendMsg(null), 5000);
    } catch {
      setError('Could not reach the server.');
    }
  };

  const handleWalletSkip = () => setStep('verify-pending');

  const handleWalletConnect = () => {
    setStep('wallet-verify');
  };

  const handleSignMessage = () => setStep('wallet-verifying');

  const handleWalletWelcomeContinue = () => setStep('verify-pending');

  const handleFinish = () => {
    navigate('/login');
  };

  const loginLink = (
    <p className="onboarding-footer">
      Already have an account? <Link to="/login">Sign in</Link>
    </p>
  );

  const usesCenterGlow = step === 'wallet-verify' || step === 'wallet-verifying';

  return (
    <div className="onboarding">
      {!usesCenterGlow && <div className="onboarding-glow" aria-hidden />}

      {step === 'welcome' && (
        <div
          className="onboarding-inner onboarding-inner--splash"
          role="button"
          tabIndex={0}
          onClick={() => setStep('intro')}
          onKeyDown={(e) => e.key === 'Enter' && setStep('intro')}
          style={{ cursor: 'pointer' }}
        >
          <div className="onboarding-splash">
            <JokoLogo className="onboarding-logo onboarding-logo--large" />
          </div>
          <div className="onboarding-footer onboarding-footer--splash" onClick={(e) => e.stopPropagation()}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      )}

      {step === 'intro' && (
        <div className="onboarding-inner">
          <JokoLogo className="onboarding-logo" />
          <div className="onboarding-intro">
            <p className="onboarding-intro-text">
              Thank you for your interest in Joko. At the moment we are only
              onboarding a limited number of artists. Below we&apos;re building a community
              about connecting artists with their super fans.
            </p>
            <button type="button" className="onboarding-btn" onClick={() => setStep('profile')}>
              Next
            </button>
            {loginLink}
          </div>
        </div>
      )}

      {step === 'profile' && (
        <div className="onboarding-inner">
          <JokoLogo className="onboarding-logo" />
          <div className="onboarding-form-wrap">
            <h1 className="onboarding-heading">
              Tell us more about your creative identity.
            </h1>

            <label className="onboarding-avatar" htmlFor="onboarding-avatar">
              {profilePicPreview ? (
                <img src={profilePicPreview} alt="Profile preview" />
              ) : null}
              <input
                id="onboarding-avatar"
                className="onboarding-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>

            <div className="onboarding-fields">
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="First Name"
                  value={profile.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="Last Name"
                  value={profile.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="email"
                  placeholder="Email"
                  value={profile.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="Username"
                  value={profile.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="password"
                  placeholder="Password"
                  value={profile.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={profile.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="Location"
                  value={profile.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={profile.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>

            <h2 className="onboarding-subheading">What&apos;s your aesthetic?</h2>
            <input
              ref={aestheticInputRef}
              className="onboarding-upload-input"
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleAestheticChange}
            />
            <div
              className="onboarding-upload"
              role="button"
              tabIndex={0}
              onClick={() => aestheticInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && aestheticInputRef.current?.click()}
            >
              <IconUpload />
              {aestheticFiles.length > 0
                ? `${aestheticFiles.length} file${aestheticFiles.length > 1 ? 's' : ''} selected`
                : 'Upload your files here'}
            </div>

            <h2 className="onboarding-subheading">
              Where you communicate your musical identity?
            </h2>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <textarea
                  placeholder="Artist Statement"
                  value={profile.artistStatement}
                  onChange={(e) => updateField('artistStatement', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="url"
                  placeholder="Website"
                  value={profile.website}
                  onChange={(e) => updateField('website', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="Instagram handle"
                  value={profile.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="Twitter handle"
                  value={profile.twitter}
                  onChange={(e) => updateField('twitter', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="Music link(s)"
                  value={profile.musicLinks}
                  onChange={(e) => updateField('musicLinks', e.target.value)}
                />
              </div>
              <div className="onboarding-field">
                <input
                  type="text"
                  placeholder="Other link(s)"
                  value={profile.otherLinks}
                  onChange={(e) => updateField('otherLinks', e.target.value)}
                />
              </div>
            </div>

            {error && <p className="onboarding-error">{error}</p>}

            <button
              type="button"
              className="onboarding-btn onboarding-btn--wide"
              disabled={busy}
              onClick={handleProfileSubmit}
            >
              {busy ? 'Creating account…' : 'Next'}
            </button>

            {loginLink}
          </div>
        </div>
      )}

      {step === 'wallet-connect' && (
        <div className="onboarding-inner">
          <JokoLogo className="onboarding-logo" />
          <div className="wallet-onboarding-center">
            <h1 className="onboarding-heading wallet-onboarding-heading">
              Connect your digital wallet
            </h1>
            <button type="button" className="wallet-connect-card" onClick={handleWalletConnect}>
              <span className="wallet-connect-icon">
                <IconWalletConnect />
              </span>
              <span className="wallet-connect-label">Connect your wallet</span>
            </button>
          </div>
          <button type="button" className="wallet-skip-btn wallet-skip-btn--bottom" onClick={handleWalletSkip}>
            Skip for now
          </button>
        </div>
      )}

      {step === 'wallet-verify' && (
        <div className="onboarding-inner onboarding-inner--wallet">
          <div className="onboarding-glow onboarding-glow--center" aria-hidden />
          <JokoLogo className="onboarding-logo" />
          <div className="wallet-verify-stage">
            <h1 className="onboarding-heading wallet-onboarding-heading">
              Verify wallet identity
            </h1>
            <p className="wallet-verify-subtext">
              To proceed, please sign a message to verify ownership of your wallet.
            </p>
            <div className="wallet-message-box">
              <textarea
                className="wallet-message-input"
                value={signMessage}
                onChange={(e) => setSignMessage(e.target.value)}
                placeholder="Sign Message"
                rows={6}
              />
            </div>
            <button type="button" className="wallet-sign-btn" onClick={handleSignMessage}>
              Sign message
            </button>
          </div>
          <button type="button" className="wallet-skip-btn wallet-skip-btn--bottom" onClick={handleWalletSkip}>
            Skip for now
          </button>
        </div>
      )}

      {step === 'wallet-verifying' && (
        <div className="onboarding-inner onboarding-inner--wallet onboarding-inner--splash">
          <div className="onboarding-glow onboarding-glow--center onboarding-glow--intense" aria-hidden />
          <JokoLogo className="onboarding-logo" />
          <div className="wallet-verifying-stage">
            <h1 className="onboarding-heading wallet-onboarding-heading wallet-onboarding-heading--splash">
              Verifying your wallet…
            </h1>
          </div>
        </div>
      )}

      {step === 'wallet-transition' && (
        <div className="onboarding-inner onboarding-inner--splash">
          <div className="wallet-onboarding-splash">
            <h1 className="onboarding-heading wallet-onboarding-heading wallet-onboarding-heading--splash">
              Taking you to your dashboard…
            </h1>
          </div>
        </div>
      )}

      {step === 'wallet-welcome' && (
        <div className="onboarding-inner onboarding-inner--splash">
          <div className="wallet-onboarding-splash">
            <h1 className="onboarding-heading wallet-onboarding-heading wallet-onboarding-heading--splash">
              Welcome to Joko
            </h1>
            <button
              type="button"
              className="onboarding-btn onboarding-btn--fixed"
              onClick={handleWalletWelcomeContinue}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'verify-pending' && (
        <div className="onboarding-inner">
          <JokoLogo className="onboarding-logo" />
          <div className="onboarding-verify">
            <h1 className="onboarding-heading">Verify your email</h1>
            <p className="onboarding-verify-text">
              The link we&apos;ve sent to{' '}
              <span className="onboarding-verify-email">{profile.email}</span>{' '}
              will expire soon. Please check your inbox and follow the instructions.
            </p>
            {devVerifyUrl && (
              <p className="onboarding-dev-link">
                Dev mode: <a href={devVerifyUrl}>click here to verify</a> (SMTP not configured)
              </p>
            )}
            <div className="onboarding-verify-actions">
              <button
                type="button"
                className="onboarding-btn"
                onClick={() => navigate('/login')}
              >
                Sign in
              </button>
              <button
                type="button"
                className="onboarding-btn onboarding-btn--secondary"
                onClick={handleResend}
              >
                Resend email
              </button>
              {resendMsg && <p className="onboarding-resend-msg">{resendMsg}</p>}
              {error && <p className="onboarding-error">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {step === 'verify-success' && (
        <div className="onboarding-inner">
          <JokoLogo className="onboarding-logo" />
          <div className="onboarding-verify">
            <h1 className="onboarding-heading">Verify your email</h1>
            <p className="onboarding-verify-text">Your email has been verified!</p>
            <p className="onboarding-verify-text">
              You can now sign in with your username and password.
            </p>
            <button type="button" className="onboarding-btn onboarding-btn--fixed" onClick={handleFinish}>
              Sign in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
