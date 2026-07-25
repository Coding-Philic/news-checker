import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: 8 }}>
          404
        </h1>
        <h2 style={{ fontSize: 'var(--font-2xl)', marginBottom: 8 }}>Page not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
