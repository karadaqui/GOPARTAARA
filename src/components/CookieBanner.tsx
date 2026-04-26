import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gopartara_cookie_consent');
    if (!consent) {
      setMounted(true);
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gopartara_cookie_consent', 'accepted');
    setVisible(false);
    setTimeout(() => setMounted(false), 350);
  };

  const handleReject = () => {
    localStorage.setItem('gopartara_cookie_consent', 'rejected');
    setVisible(false);
    setTimeout(() => setMounted(false), 350);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#111111',
        borderTop: '1px solid #1f1f1f',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s ease',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ maxWidth: '700px' }}>
        <p style={{
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          margin: '0 0 4px 0',
        }}>
          🍪 We use cookies
        </p>
        <p style={{
          color: '#71717a',
          fontSize: '13px',
          margin: 0,
          lineHeight: 1.6,
        }}>
          We use essential cookies to make our site work. We'd also like
          to set optional analytics cookies to help us improve it. See our{' '}
          <a
            href="/privacy"
            style={{ color: '#cc1111', textDecoration: 'underline' }}
          >
            Cookie Policy
          </a>
          {' '}for details.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        flexShrink: 0,
      }}>
        <button
          onClick={handleReject}
          style={{
            background: 'transparent',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.borderColor = '#3f3f46';
            (e.target as HTMLButtonElement).style.color = 'white';
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.borderColor = '#27272a';
            (e.target as HTMLButtonElement).style.color = '#a1a1aa';
          }}
        >
          Reject Non-Essential
        </button>
        <button
          onClick={handleAccept}
          style={{
            background: '#cc1111',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.background = '#e01111';
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.background = '#cc1111';
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
