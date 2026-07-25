import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

interface Profile {
  id?: string;
  displayName: string;
  timezone: string;
  telegramChatId: string;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  scheduleTime: string;
  interests: string[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      userApi.getProfile(),
      userApi.getCategories(),
    ]).then(([profileRes, catsRes]) => {
      const p = profileRes.data.data;
      setProfile(p);
      setSelectedInterests(new Set(p.interests || []));
      setCategories(catsRes.data.data || []);
    });
  }, []);

  const handleProfileSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await userApi.updateProfile({
        displayName: profile.displayName,
        timezone: profile.timezone,
        telegramChatId: profile.telegramChatId,
        emailNotifications: profile.emailNotifications,
        telegramNotifications: profile.telegramNotifications,
        scheduleTime: profile.scheduleTime,
      });
      await userApi.updateInterests(Array.from(selectedInterests));
      addToast('success', 'Settings saved');
    } catch {
      addToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (slug: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!profile) {
    return (
      <div className="loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Argus</div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-link" onClick={() => navigate('/dashboard')} id="nav-back-dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            Back to Dashboard
          </div>
          <div style={{ flex: 1 }} />
          <div className="sidebar-link" onClick={handleLogout} id="settings-logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Log Out
          </div>
        </nav>
      </aside>

      <div className="main-content">
        <header className="header">
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>Settings</h2>
          <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving} id="save-settings">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </header>

        <div className="page-content">
          {/* Profile Section */}
          <div className="settings-section">
            <h3 className="settings-title">Profile</h3>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="settings-name">Display Name</label>
                <input
                  id="settings-name"
                  className="input"
                  value={profile.displayName || ''}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="settings-timezone">Timezone</label>
                <input
                  id="settings-timezone"
                  className="input"
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="settings-section">
            <h3 className="settings-title">Notifications</h3>
            <div className="card">
              <div className="settings-row">
                <div>
                  <div className="settings-label">Email Notifications</div>
                  <div className="settings-desc">Receive daily news digest via email</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={profile.emailNotifications}
                    onChange={(e) =>
                      setProfile({ ...profile, emailNotifications: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-label">Telegram Notifications</div>
                  <div className="settings-desc">Receive news via Telegram bot</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={profile.telegramNotifications}
                    onChange={(e) =>
                      setProfile({ ...profile, telegramNotifications: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="settings-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label" htmlFor="settings-schedule">Daily Delivery Time</label>
                  <input
                    id="settings-schedule"
                    type="time"
                    className="input"
                    value={profile.scheduleTime || '08:00'}
                    onChange={(e) => setProfile({ ...profile, scheduleTime: e.target.value })}
                  />
                  <div className="settings-desc" style={{ marginTop: '8px' }}>
                    Choose when your daily digest should be generated and sent.
                  </div>
                </div>
              </div>

              {profile.telegramNotifications && (
                <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <div className="settings-desc">
                    To receive Telegram notifications, you must connect your account to our bot.
                  </div>
                  {profile.telegramChatId ? (
                    <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 500 }}>
                      ✓ Telegram Connected
                    </div>
                  ) : (
                    <a
                      href={`https://t.me/CodingPhilicBot?start=${profile.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                      Connect Telegram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interests Section */}
          <div className="settings-section">
            <h3 className="settings-title">News Interests</h3>
            <div className="interest-grid">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className={`interest-card ${selectedInterests.has(cat.slug) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(cat.slug)}
                  id={`settings-interest-${cat.slug}`}
                >
                  <div className="interest-card-name">{cat.name}</div>
                  <div className="interest-card-desc">{cat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
