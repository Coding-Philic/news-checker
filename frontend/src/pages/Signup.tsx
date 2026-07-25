import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendToEmail, setSendToEmail] = useState(true);
  const [sendToTelegram, setSendToTelegram] = useState(false);
  const [telegramNumber, setTelegramNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      addToast('error', 'Password must be at least 8 characters');
      return;
    }
    if (!sendToEmail && !sendToTelegram) {
      addToast('error', 'Please select at least one delivery method');
      return;
    }
    if (sendToTelegram && !telegramNumber.trim()) {
      addToast('error', 'Please enter your Telegram phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.signup(email, password, name, {
        emailNotifications: sendToEmail,
        telegramNotifications: sendToTelegram,
      });
      const { user, session } = res.data.data;
      if (session) {
        login(
          { id: user.id, email: user.email },
          session.access_token,
          session.refresh_token,
        );
        addToast('success', 'Account created successfully');
        navigate('/onboarding');
      } else {
        addToast('info', 'Please check your email to verify your account');
        navigate('/login');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string[] } } };
      addToast('error', error.response?.data?.message?.[0] || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start getting personalized news today</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-name">Display Name</label>
            <input
              id="signup-name"
              type="text"
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="input"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* Delivery Method Section */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
          }}>
            <p style={{
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}>
              Where should we send your news?
            </p>

            {/* Email toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--border-default)',
            }}>
              <div>
                <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
                  Email
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {email ? `News will be sent to ${email}` : 'Enter your email above'}
                </div>
              </div>
              <label className="toggle" id="toggle-email">
                <input
                  type="checkbox"
                  checked={sendToEmail}
                  onChange={(e) => setSendToEmail(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Telegram toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
            }}>
              <div>
                <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
                  Telegram
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  Connect your Telegram account after signup
                </div>
              </div>
              <label className="toggle" id="toggle-telegram">
                <input
                  type="checkbox"
                  checked={sendToTelegram}
                  onChange={(e) => setSendToTelegram(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="signup-submit"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
