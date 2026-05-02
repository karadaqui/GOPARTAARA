import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gopartara_cookie_consent');
    if (!consent) {
      setMounted(true);
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gopartara_cookie_consent', 'accepted');
    setVisible(false);
    setTimeout(() => setMounted(false), 300);
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
        padding: '12px 24px',
        maxHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
      }}
    >
      <p
        style={{
          color: '#d4d4d8',
          fontSize: '13px',
          margin: 0,
          lineHeight: 1.4,
          flex: 1,
          minWidth: 0,
        }}
      >
        We use cookies to improve your experience. By using GOPARTARA, you agree to our{' '}
        <a href="/privacy" style={{ color: '#cc1111', textDecoration: 'underline' }}>
          Privacy Policy
        </a>
        .
      </p>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <a
          href="/cookies"
          style={{
            background: 'transparent',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          Manage Preferences
        </a>
        <button
          onClick={handleAccept}
          style={{
            background: '#cc1111',
            border: 'none',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
