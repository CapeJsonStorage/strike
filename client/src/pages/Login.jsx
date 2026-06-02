import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const error = new URLSearchParams(window.location.search).get('error');

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            STRIKE
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            CAPE Production
          </div>
        </div>

        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
            Sign in with your <strong style={{ color: 'var(--text-primary)' }}>@capecreative.co</strong> account to continue.
          </p>

          {error === 'unauthorized' && (
            <div className="alert alert-error" style={{ marginBottom: 20, fontSize: 13 }}>
              Access restricted to @capecreative.co accounts.
            </div>
          )}

          <a
            href="/auth/google"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: '#fff',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'box-shadow 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'}
          >
            <GoogleIcon />
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
