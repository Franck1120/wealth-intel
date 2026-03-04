import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-8xl font-bold tracking-tighter text-primary">404</p>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pagina non trovata
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            La pagina che stai cercando non esiste o e&#39; stata spostata.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Torna alla dashboard
        </Link>
      </div>
    </div>
  );
}
