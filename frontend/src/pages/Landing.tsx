import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-secondary)',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Argus
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <p className="landing-tagline">AI-Powered News Aggregation</p>
        <h1 className="landing-title">
          Your News.<br />Personalized. Delivered.
        </h1>
        <p className="landing-description">
          8 sources. 10 categories. One dashboard. Our AI agents search Google News,
          Reddit, Wikipedia, Hacker News, and more to bring you only the news that
          matters to you. Every morning at 8 AM, delivered to Telegram and email.
        </p>
        <div className="landing-actions">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <h3 className="feature-title">8 Free Sources</h3>
          <p className="feature-desc">
            Google News, Wikipedia, Reddit, NewsData.io, Hacker News, DEV.to,
            DuckDuckGo, and curated RSS feeds from BBC, Reuters, Ars Technica, and more.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/>
            </svg>
          </div>
          <h3 className="feature-title">AI-Powered Filtering</h3>
          <p className="feature-desc">
            Each news item is analyzed by AI for relevance to your interests. Spam,
            clickbait, and duplicates are removed. Summaries are rewritten in clear,
            simple language.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>
            </svg>
          </div>
          <h3 className="feature-title">Telegram + Email Delivery</h3>
          <p className="feature-desc">
            Get your personalized news digest delivered to Telegram and email every
            morning. Or hit the search button anytime for instant results.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 className="feature-title">Per-User Personalization</h3>
          <p className="feature-desc">
            Each user gets their own isolated feed. Choose your categories: Technology,
            Geopolitics, Business, Science, Health, Sports, and more.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3 className="feature-title">Daily 8 AM Schedule</h3>
          <p className="feature-desc">
            Automated daily runs at 8 AM. Agents wake up, search all sources, filter,
            deduplicate, and deliver. You get fresh news before your morning starts.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 className="feature-title">Secure by Design</h3>
          <p className="feature-desc">
            JWT authentication, encrypted data, rate limiting, CORS protection, and
            Row Level Security. Your data stays yours.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px',
        borderTop: '1px solid var(--border-default)',
        color: 'var(--text-tertiary)',
        fontSize: '13px',
      }}>
        Argus -- AI-Powered Multi-Agent News Aggregation
      </footer>
    </div>
  );
}
