import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newsApi } from '../api/news.api';

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    newsApi.getArticle(id)
      .then((res) => {
        if (res.data.error) {
          setError(res.data.error);
        } else {
          setArticle(res.data.data);
        }
      })
      .catch((err) => {
        setError('Failed to load article');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>{error || 'Article not found'}</h2>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const publishDate = article.published_at || article.fetched_at;
  const formattedDate = new Date(publishDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="app-shell">
      <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
        <button
          className="btn"
          onClick={() => navigate(-1)}
          style={{ marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface-light)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <article className="card" style={{ padding: '40px' }}>
          {article.categories && (
            <div className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-block' }}>
              {article.categories.name}
            </div>
          )}
          
          <h1 style={{ fontSize: '2.5rem', marginBottom: 16, lineHeight: 1.2 }}>
            {article.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.9rem' }}>
            <span>{formattedDate}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {article.source_platform === 'google-news' && '📰 Google News'}
              {article.source_platform === 'wikipedia' && '📚 Wikipedia'}
              {article.source_platform === 'reddit' && '🔥 Reddit'}
              {article.source_platform === 'newsdata' && '🗞️ NewsData'}
              {article.source_platform === 'hackernews' && '💻 HackerNews'}
              {article.source_platform === 'devto' && '👩‍💻 Dev.to'}
              {article.source_platform === 'duckduckgo' && '🦆 DuckDuckGo'}
              {article.source_platform === 'rss-feeds' && '📡 RSS'}
              {article.source_name && ` (${article.source_name})`}
            </span>
          </div>

          <div 
            style={{ 
              fontSize: '1.15rem', 
              lineHeight: 1.8, 
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {article.summary}
          </div>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              This is an AI-generated summary. To read the full, original article, click the button below.
            </p>
            <a 
              href={article.source_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Read Original Article
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
