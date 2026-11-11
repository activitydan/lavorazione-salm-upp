# Mappa: CimiTera

Label: wayfinder:map

## Destination

Un piano approvato da Dan per la versione CimiTera della demo, diviso in fasi da costruire una per sessione. Insieme al piano, una risposta pronta per il cliente con tre elenchi: cosa facciamo subito, cosa mostriamo come simulazione, cosa richiede accordi esterni.

## Notes

- **Dominio**: gestione cimiteriale per i Comuni. Cliente: DAT | HYA Group (datnotifiche.it). Il prodotto si chiama CimiTera (prima SALM-APP). I due PDF del rebranding sono in `Desktop\MEMORIA AI`.
- **Stato dell'app**: demo con dati finti salvati nel browser, senza server. Resta così.
- **Skill**: grilling e domain-modeling per ogni ticket; prototype per menu e layout; research per le ricerche. Il vocabolario è in [GLOSSARY.md](../../GLOSSARY.md). Le ricerche finiscono in `docs/research/` su rami `research/<nome>`, mai uniti a `main`.
- **Solo decisioni**: nella mappa non si scrive codice del prodotto. Quando non restano ticket si passa a to-spec.
- **Già deciso nella stesura (2026-11-11)**:
  - Rebranding: solo nome e logo. Colori e caratteri dell'app restano quelli attuali. "REST IN GPS" sparisce ovunque. Nel menu laterale restano logo e "CimiTera"; "Una soluzione DAT | HYA Group" va nella schermata di caricamento e in fondo ai PDF.
  - Layout: niente restyling. Si toglie il superfluo, si uniscono i doppioni, si riequilibrano gli spazi. Lo standard degli spazi è la home (frame Figma 104:36), con 16 px tra i riquadri. Esempio di superfluo secondo Dan: la voce "Mappa" nel menu, perché la mappa si apre già dalla Dashboard. Il layout si può ottimizzare al massimo.
  - Un'unica app con più versioni: una semplificata per telefono, una per computer, e 2 o 3 tipi di account secondo il ruolo.
  - Dalla lista del cliente. Dentro e funzionanti con dati finti: concessioni complete, illuminazione votiva completa, pratiche e operazioni con agenda e scadenzario. Dentro ma simulati: pagamenti pagoPA e morosi, avvisi di scadenza inviati da DAT.
  - Il documento Word del cliente non è disponibile: pratiche e operazioni si basano sulle norme e sui concorrenti.
  - Ordine di costruzione: 1) nome e logo CimiTera, 2) semplificazione dei layout e nuovo menu, 3) concessioni, 4) illuminazione votiva, 5) pratiche e operazioni, 6) pagamenti e avvisi simulati.
  - La fase 1 (nome e logo) non ha decisioni aperte.
- **Preferenze di Dan**: risposte sintetiche; niente 3D; la demo consegnata (`demo-salm-app`) non si tocca; ogni modifica va in commit e push su `origin`.

## Decisions so far

<!-- una riga per ticket chiuso: nome del ticket con link, poi il succo della risposta -->

- [Inventario delle pagine e proposte di semplificazione](issues/04-inventario-delle-pagine.md): nove doppioni, sette frasi descrittive da togliere, cornice delle pagine diversa dalla home, cinque elenchi troppo lunghi. Dettaglio in [inventario-pagine.md](inventario-pagine.md).
- [Ruoli e versioni dell'app](issues/05-ruoli-e-versioni.md): Cittadino (pagina pubblica per telefono, solo ricerca), Operatore (tutto tranne operatori e Impostazioni), Amministratore (tutto); ingresso "Entra come" senza password; sul telefono solo campo e consultazione, gestione e statistiche solo dal computer.
- [Come funziona il servizio di illuminazione votiva](issues/02-illuminazione-votiva.md): a Ragusa la gestisce il Comune (allaccio 39 €, canone 24 € l'anno, bollettino postale); l'utenza è per postazione e defunto, chi la chiede non è per forza il concessionario; morosità con sollecito, diffida e distacco. [Documento](https://github.com/activitydan/lavorazione-salm-upp/blob/research/illuminazione-votiva/docs/research/illuminazione-votiva.md).
- [Cosa offrono i concorrenti e cosa fa DAT](issues/03-concorrenti-e-servizi-dat.md): Deda Next ha già pagoPA e portale per le imprese funebri; nessun concorrente gestisce i morosi; DAT è l'unico con recapito fisico e messi, ma non con la notifica digitale; avviso pagoPA e stati documentati. [Documento](https://github.com/activitydan/lavorazione-salm-upp/blob/research/concorrenti-e-servizi-dat/docs/research/concorrenti-e-servizi-dat.md).

## Not yet specified

- Portale per le agenzie funebri: se entra in questa versione e in che forma. Dipende dai ruoli e dal modello delle pratiche. Riferimento: il portale di Deda Next (scelta della sepoltura in mappa, avviso pagoPA, prenotazione, autorizzazione del Comune).
- Semplificazione pagina per pagina: cosa togliere e unire in ogni pagina. Sulla lapide non c'è un QR: rivedere "Etichette QR" e la pagina pubblica del QR. Diventa ticket dopo l'inventario, il menu e le regole degli spazi. Le Impostazioni vanno riviste più delle altre, nell'aspetto e nel contenuto (indicazione di Dan).
- Voce "Collegamenti" con i sistemi esterni previsti (ANPR, protocollo, contabilità): se serve e dove sta. Si vede dopo il menu.
- Divisione finale in fasi e contenuto di ogni fase: quando i modelli sono decisi.

## Out of scope

- Server, account veri con password e dati reali (arriveranno con il backend, dopo questa mappa).
- Collegamenti reali: pagoPA, ANPR, protocollo, contabilità (Halley, Maggioli), conservazione a norma, recupero crediti, invio reale tramite DAT.
- Restyling: colori e caratteri nuovi.
- Totem all'ingresso e app pubblica separata.
- Modifiche alla demo consegnata al cliente.
