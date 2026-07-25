import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/user.api';
import { useUIStore } from '../store/ui.store';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export default function Onboarding() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    userApi.getCategories().then((res) => {
      setCategories(res.data.data || []);
    });
  }, []);

  const toggleCategory = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selected.size === 0) {
      addToast('error', 'Please select at least one category');
      return;
    }

    setLoading(true);
    try {
      await userApi.updateInterests(Array.from(selected));
      // Trigger the welcome digest in the background
      userApi.triggerWelcome().catch(console.error);
      
      addToast('success', 'Interests saved. Your first news feed is being generated!');
      navigate('/dashboard');
    } catch {
      addToast('error', 'Failed to save interests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 8 }}>
            What news interests you?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-md)' }}>
            Select the categories you care about. Our AI agents will search and filter
            news specifically for your interests.
          </p>
        </div>

        <div className="interest-grid">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              className={`interest-card ${selected.has(cat.slug) ? 'selected' : ''}`}
              onClick={() => toggleCategory(cat.slug)}
              id={`interest-${cat.slug}`}
            >
              <div className="interest-card-name">{cat.name}</div>
              <div className="interest-card-desc">{cat.description}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleContinue}
            disabled={loading || selected.size === 0}
            id="onboarding-continue"
            style={{ minWidth: 200 }}
          >
            {loading ? 'Saving...' : `Continue with ${selected.size} ${selected.size === 1 ? 'category' : 'categories'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
