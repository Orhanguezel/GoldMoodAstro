'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            fontFamily: 'var(--font-sans), system-ui, sans-serif',
            background: 'var(--gm-bg)',
            color: 'var(--gm-text)',
          }}
        >
          <div style={{ maxWidth: 640, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-display), Cinzel, serif' }}>
              Beklenmedik bir hata oluştu.
            </h1>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6, opacity: 0.8 }}>
              An error occurred. Please refresh the page.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '1rem 2rem',
                borderRadius: 9999,
                border: 'none',
                background: 'var(--gm-gold)',
                color: 'var(--gm-bg)',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              YENİDEN DENE / RETRY
            </button>
            {process.env.NODE_ENV === 'development' ? (
              <pre
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  overflowX: 'auto',
                  textAlign: 'left',
                  background: 'var(--gm-surface)',
                  color: 'var(--gm-error)',
                  borderRadius: 12,
                  fontSize: '0.8rem'
                }}
              >
                {error.message}
                {error.digest ? `\nDigest: ${error.digest}` : ''}
              </pre>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
