import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Wealth Intel',
  description: 'Informativa sulla privacy di Wealth Intel',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Informativa sulla Privacy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ultimo aggiornamento: 4 marzo 2026
          </p>
        </div>

        {/* Titolare del trattamento */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            1. Titolare del Trattamento
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Il titolare del trattamento dei dati personali e' il titolare del
            servizio Wealth Intel. Per qualsiasi richiesta relativa ai tuoi dati
            personali, puoi contattarci tramite le impostazioni del tuo account.
          </p>
        </section>

        {/* Dati raccolti */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            2. Dati Raccolti
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Raccogliamo e trattiamo le seguenti categorie di dati personali:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Dati di identificazione:</strong>{' '}
              indirizzo email fornito in fase di registrazione
            </li>
            <li>
              <strong className="text-foreground">Dati di portafoglio:</strong>{' '}
              composizione del portafoglio, asset detenuti, quantita' e prezzi
              medi di acquisto
            </li>
            <li>
              <strong className="text-foreground">Transazioni:</strong>{' '}
              storico delle operazioni di acquisto, vendita, dividendi, staking
              e commissioni
            </li>
            <li>
              <strong className="text-foreground">Decisioni di investimento:</strong>{' '}
              annotazioni nel Decision Journal, ragionamenti, esiti e note
            </li>
            <li>
              <strong className="text-foreground">Stati emotivi:</strong>{' '}
              emozioni registrate nel journal (calma, entusiasmo, paura, FOMO,
              fiducia)
            </li>
            <li>
              <strong className="text-foreground">Preferenze utente:</strong>{' '}
              valuta base, aliquota fiscale, preferenze di notifica
            </li>
            <li>
              <strong className="text-foreground">Dati di utilizzo:</strong>{' '}
              alert configurati, watchlist, opportunita' tracciate
            </li>
          </ul>
        </section>

        {/* Base giuridica */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            3. Base Giuridica del Trattamento
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Il trattamento dei tuoi dati personali si basa sulle seguenti basi
            giuridiche:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Consenso (Art. 6(1)(a) GDPR):</strong>{' '}
              fornito al momento della registrazione e confermato tramite
              accettazione della presente informativa
            </li>
            <li>
              <strong className="text-foreground">
                Legittimo interesse (Art. 6(1)(f) GDPR):
              </strong>{' '}
              per il funzionamento del servizio, la sicurezza dell&apos;account e il
              miglioramento dell&apos;esperienza utente
            </li>
          </ul>
        </section>

        {/* Finalita' */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            4. Finalita' del Trattamento
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            I tuoi dati personali vengono trattati per le seguenti finalita':
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>Gestione e visualizzazione del portafoglio investimenti</li>
            <li>Calcolo di metriche, score quantitativi e analisi di performance</li>
            <li>Invio di notifiche e alert personalizzati su condizioni di mercato</li>
            <li>Generazione e invio di report settimanali via email</li>
            <li>Analisi del decision journal per supportare le tue decisioni</li>
            <li>Autenticazione e gestione della sessione utente</li>
          </ul>
        </section>

        {/* Terze parti */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            5. Condivisione con Terze Parti
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Per fornire il servizio, ci avvaliamo dei seguenti fornitori terzi:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Supabase</strong> (database e
              autenticazione) — i tuoi dati vengono archiviati in modo sicuro su
              infrastruttura Supabase
            </li>
            <li>
              <strong className="text-foreground">Brevo (Sendinblue)</strong>{' '}
              (email transazionali) — utilizzato per inviare alert e report
              settimanali al tuo indirizzo email
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> (hosting) —
              l&apos;applicazione e' ospitata su infrastruttura Vercel
            </li>
            <li>
              <strong className="text-foreground">
                CoinGecko, Yahoo Finance, FRED, DeFi Llama, ECB
              </strong>{' '}
              (dati di mercato) — utilizziamo queste API per ottenere dati di
              mercato pubblici. Nessun dato personale viene condiviso con questi
              servizi
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Non vendiamo, affittiamo o condividiamo i tuoi dati personali con
            terze parti per finalita' di marketing.
          </p>
        </section>

        {/* Durata conservazione */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            6. Durata della Conservazione
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            I tuoi dati personali vengono conservati per tutta la durata del tuo
            account attivo. In caso di cancellazione dell&apos;account, tutti i tuoi
            dati verranno eliminati permanentemente entro 30 giorni dalla
            richiesta di cancellazione. I dati di mercato aggregati e anonimi
            (prezzi, indicatori macro) non costituiscono dati personali e
            possono essere conservati a tempo indeterminato.
          </p>
        </section>

        {/* Diritti dell'utente */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            7. I Tuoi Diritti
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            In conformita' con il GDPR, hai i seguenti diritti:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Diritto di accesso:</strong>{' '}
              puoi richiedere una copia di tutti i dati personali in nostro
              possesso
            </li>
            <li>
              <strong className="text-foreground">Diritto di rettifica:</strong>{' '}
              puoi richiedere la correzione di dati inesatti o incompleti
            </li>
            <li>
              <strong className="text-foreground">
                Diritto alla cancellazione:
              </strong>{' '}
              puoi eliminare il tuo account e tutti i dati associati in
              qualsiasi momento dalle impostazioni
            </li>
            <li>
              <strong className="text-foreground">
                Diritto alla portabilita':
              </strong>{' '}
              puoi richiedere i tuoi dati in un formato strutturato, di uso
              comune e leggibile da dispositivo automatico
            </li>
            <li>
              <strong className="text-foreground">
                Diritto di opposizione:
              </strong>{' '}
              puoi opporti al trattamento dei tuoi dati in qualsiasi momento
            </li>
            <li>
              <strong className="text-foreground">
                Diritto di reclamo:
              </strong>{' '}
              hai il diritto di presentare un reclamo presso il Garante per la
              Protezione dei Dati Personali (www.garanteprivacy.it)
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Per esercitare i tuoi diritti, accedi alle{' '}
            <Link href="/settings" className="text-primary underline">
              Impostazioni
            </Link>{' '}
            del tuo account o contattaci tramite i canali indicati.
          </p>
        </section>

        {/* Cookie */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            8. Cookie
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Wealth Intel utilizza esclusivamente cookie tecnici essenziali
            necessari per il funzionamento del servizio. In particolare,
            utilizziamo i cookie di sessione di Supabase per gestire
            l&apos;autenticazione e mantenere la sessione utente attiva. Non
            utilizziamo cookie di profilazione, cookie di terze parti per
            finalita' pubblicitarie o strumenti di tracciamento analytics.
          </p>
        </section>

        {/* Sicurezza */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            9. Sicurezza dei Dati
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Adottiamo misure tecniche e organizzative appropriate per
            proteggere i tuoi dati personali, incluse la crittografia dei
            dati in transito (HTTPS/TLS), l&apos;accesso al database protetto da
            Row Level Security (RLS), l&apos;autenticazione tramite magic link
            (senza password) e la separazione dei ruoli di accesso ai dati.
          </p>
        </section>

        {/* Modifiche */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            10. Modifiche alla Privacy Policy
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ci riserviamo il diritto di modificare la presente informativa in
            qualsiasi momento. Le modifiche significative verranno comunicate
            via email. La data dell&apos;ultimo aggiornamento e' indicata in cima
            a questa pagina.
          </p>
        </section>

        {/* Contatto */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            11. Contatti
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Per qualsiasi domanda relativa al trattamento dei tuoi dati
            personali, puoi gestire il tuo account e le preferenze di
            notifica direttamente dalle{' '}
            <Link href="/settings" className="text-primary underline">
              Impostazioni
            </Link>{' '}
            dell&apos;app.
          </p>
        </section>

        {/* Torna al login */}
        <div className="border-t border-border pt-6">
          <Link
            href="/login"
            className="text-sm text-primary underline hover:opacity-80 transition-opacity"
          >
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}
