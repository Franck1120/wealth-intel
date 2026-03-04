import Link from 'next/link';

export const metadata = {
  title: 'Termini di Servizio — Wealth Intel',
  description: 'Termini e condizioni di utilizzo di Wealth Intel',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Termini di Servizio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ultimo aggiornamento: 4 marzo 2026
          </p>
        </div>

        {/* Descrizione del servizio */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            1. Descrizione del Servizio
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Wealth Intel e' una dashboard personale per il tracking e l&apos;analisi
            degli investimenti. Il servizio consente di monitorare portafogli
            multi-asset, visualizzare dati di mercato in tempo reale, ricevere
            alert personalizzati, consultare score quantitativi e generare
            report settimanali sulle performance del portafoglio.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            2. Disclaimer Importante
          </h2>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <p className="text-sm font-semibold leading-relaxed text-yellow-500">
              Wealth Intel NON fornisce consulenza finanziaria. I dati, gli
              score, le analisi e le informazioni presentate sono puramente
              informativi e non costituiscono in alcun modo raccomandazioni di
              investimento, sollecitazione all&apos;acquisto o alla vendita di
              strumenti finanziari, ne' consulenza finanziaria, fiscale o
              legale.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-yellow-500/80">
              Le decisioni di investimento sono di esclusiva responsabilita'
              dell&apos;utente. Prima di effettuare qualsiasi operazione finanziaria,
              si consiglia di consultare un consulente finanziario abilitato.
            </p>
          </div>
        </section>

        {/* Responsabilita' dati */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            3. Fonti dei Dati e Responsabilita'
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            I dati di mercato vengono forniti &quot;cosi' come sono&quot; (as is) da
            fonti terze, tra cui Yahoo Finance, CoinGecko, FRED (Federal
            Reserve Economic Data), DeFi Llama e BCE (Banca Centrale Europea).
            Non garantiamo l&apos;accuratezza, la completezza o la tempestivita'
            dei dati forniti da queste fonti. I prezzi possono subire ritardi
            rispetto ai dati in tempo reale dei mercati.
          </p>
        </section>

        {/* Account */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            4. Account Utente
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>
              Ogni persona puo' registrare un solo account personale
            </li>
            <li>
              L&apos;utente e' responsabile della sicurezza del proprio indirizzo
              email utilizzato per l&apos;autenticazione tramite magic link
            </li>
            <li>
              L&apos;utente si impegna a fornire informazioni veritiere e a
              mantenere aggiornato il proprio indirizzo email
            </li>
            <li>
              In caso di accesso non autorizzato, l&apos;utente deve notificarlo
              immediatamente
            </li>
          </ul>
        </section>

        {/* Uso consentito */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            5. Uso Consentito
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Il servizio e' destinato esclusivamente all&apos;uso personale e non
            commerciale. E&apos; vietato:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>
              Utilizzare il servizio per finalita' commerciali o redistribuire
              i dati a terzi
            </li>
            <li>
              Tentare di accedere ad account o dati di altri utenti
            </li>
            <li>
              Effettuare scraping automatizzato, reverse engineering o
              sovraccaricare i server con richieste eccessive
            </li>
            <li>
              Utilizzare il servizio per attivita' illegali o fraudolente
            </li>
          </ul>
        </section>

        {/* Limitazione di responsabilita' */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            6. Limitazione di Responsabilita'
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Il servizio viene fornito &quot;cosi' com&apos;e'&quot; (as is) senza garanzie di
            alcun tipo, esplicite o implicite. In particolare:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>
              Non garantiamo la disponibilita' continua e ininterrotta del
              servizio
            </li>
            <li>
              Non garantiamo l&apos;accuratezza degli score quantitativi, dei
              calcoli di performance o delle metriche di rischio
            </li>
            <li>
              Non siamo responsabili per eventuali perdite finanziarie
              derivanti dall&apos;utilizzo delle informazioni fornite dal servizio
            </li>
            <li>
              Non siamo responsabili per malfunzionamenti temporanei dovuti a
              manutenzione, aggiornamenti o cause di forza maggiore
            </li>
            <li>
              Non siamo responsabili per ritardi, errori o interruzioni nelle
              API di terze parti che forniscono i dati di mercato
            </li>
          </ul>
        </section>

        {/* Proprieta' intellettuale */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            7. Proprieta' Intellettuale
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tutti i contenuti, il design, il codice e le funzionalita' di
            Wealth Intel sono di proprieta' del titolare del servizio. I dati
            inseriti dall&apos;utente (portafoglio, transazioni, journal) rimangono
            di proprieta' dell&apos;utente, che puo' richiederne l&apos;esportazione o
            la cancellazione in qualsiasi momento.
          </p>
        </section>

        {/* Cancellazione */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            8. Cancellazione dell&apos;Account
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            L&apos;utente puo' cancellare il proprio account in qualsiasi momento
            dalle{' '}
            <Link href="/settings" className="text-primary underline">
              Impostazioni
            </Link>{' '}
            dell&apos;app. La cancellazione comporta l&apos;eliminazione permanente e
            irreversibile di tutti i dati associati all&apos;account, inclusi
            portafogli, transazioni, journal, alert e report.
          </p>
        </section>

        {/* Modifiche ai termini */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            9. Modifiche ai Termini
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ci riserviamo il diritto di modificare i presenti Termini di
            Servizio in qualsiasi momento. Le modifiche significative verranno
            comunicate con ragionevole preavviso via email all&apos;indirizzo
            associato all&apos;account. L&apos;utilizzo continuato del servizio dopo
            la notifica delle modifiche costituisce accettazione dei nuovi
            termini.
          </p>
        </section>

        {/* Legge applicabile */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            10. Legge Applicabile e Foro Competente
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            I presenti Termini di Servizio sono regolati dalla legge italiana.
            Per qualsiasi controversia derivante dall&apos;utilizzo del servizio
            sara' competente il foro del luogo di residenza o domicilio del
            consumatore, ai sensi del Codice del Consumo (D.Lgs. 206/2005).
          </p>
        </section>

        {/* Link alla privacy */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            11. Privacy
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Il trattamento dei dati personali e' disciplinato dalla nostra{' '}
            <Link href="/privacy" className="text-primary underline">
              Informativa sulla Privacy
            </Link>
            , che costituisce parte integrante dei presenti Termini di Servizio.
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
