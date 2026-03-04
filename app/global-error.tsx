'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body
        className="flex min-h-screen items-center justify-center bg-background font-sans antialiased"
        style={{
          backgroundColor: 'oklch(0.145 0 0)',
          color: 'oklch(0.985 0 0)',
          fontFamily:
            'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          {/* Error icon — plain SVG, no external deps */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(0.55 0.2 25)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'oklch(0.985 0 0)' }}
          >
            Qualcosa e&#39; andato storto
          </h1>

          {error.message && (
            <p
              className="max-w-md text-sm"
              style={{ color: 'oklch(0.65 0 0)' }}
            >
              {error.message}
            </p>
          )}

          {error.digest && (
            <p
              className="font-mono text-xs"
              style={{ color: 'oklch(0.45 0 0)' }}
            >
              Codice errore: {error.digest}
            </p>
          )}

          <div className="mt-2 flex gap-4">
            <button
              onClick={reset}
              style={{
                backgroundColor: 'oklch(0.65 0.18 145)',
                color: 'oklch(0.985 0 0)',
                borderRadius: '0.375rem',
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Riprova
            </button>

            <a
              href="/"
              style={{
                border: '1px solid oklch(0.3 0 0)',
                backgroundColor: 'transparent',
                color: 'oklch(0.985 0 0)',
                borderRadius: '0.375rem',
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = 'oklch(0.25 0 0)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              Torna alla home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
