import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsApi } from '../api/news.api';
import { userApi } from '../api/user.api';
import { useNewsStore } from '../store/news.store';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Dashboard() {
  const {
    items, total, page, limit, isLoading, activeCategory, searchTriggered,
    setItems, setPage, setLoading, setActiveCategory, setSearchTriggered,
  } = useNewsStore();
  const logout = useAuthStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    userApi.getCategories().then((res) => setCategories(res.data.data || []));
    userApi.getInterests().then((res) => setUserInterests(res.data.data || []));
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await newsApi.getFeed({
        page,
        limit,
        category: activeCategory || undefined,
      });
      const data = res.data.data;
      setItems(data.items || [], data.total || 0);
    } catch {
      addToast('error', 'Failed to load news feed');
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, limit, setItems, setLoading, addToast]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleTriggerSearch = async () => {
    setSearchTriggered(true);
    try {
      await newsApi.triggerSearch();
      addToast('success', 'News search started. New items will appear shortly.');
      setTimeout(() => {
        fetchFeed();
        setSearchTriggered(false);
      }, 15000);
    } catch {
      addToast('error', 'Failed to trigger search');
      setSearchTriggered(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalPages = Math.ceil(total / limit);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const sourceBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Google News': 'badge-primary',
      'Wikipedia': 'badge-neutral',
      'Reddit': 'badge-warning',
      'NewsData.io': 'badge-success',
      'Hacker News': 'badge-warning',
      'DEV.to': 'badge-neutral',
      'DuckDuckGo': 'badge-primary',
      'RSS Feeds': 'badge-neutral',
    };
    return colors[platform] || 'badge-neutral';
  };

  const handleSpeak = (e: React.MouseEvent, title: string, summary: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(`${title}. ${summary}`);
    
    // Make the voice slower
    utterance.rate = 0.85; 

    // Attempt to find a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (voice) => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Victoria') || 
        voice.name.includes('Zira') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Moira')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">Argus</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Categories</div>

          <div
            className={`sidebar-link ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
            id="nav-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            All News
          </div>

          {categories
            .filter((c) => userInterests.includes(c.slug))
            .map((cat) => (
              <div
                key={cat.slug}
                className={`sidebar-link ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.slug)}
                id={`nav-${cat.slug}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
                {cat.name}
              </div>
            ))}

          <div style={{ flex: 1 }} />

          <div className="sidebar-section-title">Account</div>

          <div
            className="sidebar-link"
            onClick={() => navigate('/settings')}
            id="nav-settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Settings
          </div>

          <div className="sidebar-link" onClick={handleLogout} id="nav-logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log Out
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="btn btn-ghost"
              onClick={toggleSidebar}
              style={{ display: 'none' }}
              id="mobile-menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>
              {activeCategory
                ? categories.find((c) => c.slug === activeCategory)?.name || 'News'
                : 'All News'}
            </h2>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTriggerSearch}
            disabled={searchTriggered}
            id="trigger-search"
          >
            {searchTriggered ? (
              <>
                <div className="loader-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Searching...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Search Now
              </>
            )}
          </button>
        </header>

        <div className="page-content">
          {isLoading ? (
            <div className="loader">
              <div className="loader-spinner" />
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
              </div>
              <h3 className="empty-state-title">No news yet</h3>
              <p className="empty-state-desc">
                Hit the "Search Now" button to fetch the latest news from all sources,
                or wait for the daily 8 AM digest.
              </p>
            </div>
          ) : (
            <>
              <div className="news-grid">
                {items.map((item, idx) => (
                  <a
                    key={item.id || idx}
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      className="news-card"
                      style={{ opacity: item.is_read ? 0.6 : 1 }}
                    >
                      <div className="news-card-header">
                        <h3 className="news-card-title">{item.title}</h3>
                        {item.relevance_score > 0 && (
                          <span className="badge badge-primary" style={{ flexShrink: 0 }}>
                            {item.relevance_score}/10
                          </span>
                        )}
                      </div>
                      <p className="news-card-summary">{item.summary}</p>
                      <div className="news-card-meta">
                        <span className={`badge ${sourceBadgeColor(item.source_platform)}`}>
                          {item.source_platform}
                        </span>
                        {item.source_name && (
                          <span className="news-card-source">{item.source_name}</span>
                        )}
                        {item.categories?.name && (
                          <span className="badge badge-neutral">{item.categories.name}</span>
                        )}
                        <span className="news-card-time">
                          {formatTime(item.published_at || item.fetched_at)}
                        </span>
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => handleSpeak(e, item.title, item.summary)}
                          style={{ marginLeft: 'auto', padding: 4 }}
                          title="Read aloud"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                        </button>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 32,
                }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
