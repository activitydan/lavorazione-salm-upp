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

- [Regole delle concessioni e delle operazioni cimiteriali](issues/01-regole-concessioni-e-operazioni.md): a Ragusa le concessioni decorrono dal contratto (tombe di famiglia 99 anni, loculi 60, ossari e nicchie 30, rinnovo 10), campo comune a turno di 10 anni; regole di subentro, rinuncia, decadenza e revoca; esumazioni straordinarie solo da ottobre ad aprile. [Documento](https://github.com/activitydan/lavorazione-salm-upp/blob/research/regole-concessioni-e-operazioni/docs/research/regole-concessioni-e-operazioni.md).
- [Inventario delle pagine e proposte di semplificazione](issues/04-inventario-delle-pagine.md): nove doppioni, sette frasi descrittive da togliere, cornice delle pagine diversa dalla home, cinque elenchi troppo lunghi. Dettaglio in [inventario-pagine.md](inventario-pagine.md).
- [Ruoli e versioni dell'app](issues/05-ruoli-e-versioni.md): Cittadino (pagina pubblica per telefono, solo ricerca), Operatore (tutto tranne operatori e Impostazioni), Amministratore (tutto); ingresso "Entra come" senza password; sul telefono solo campo e consultazione, gestione e statistiche solo dal computer.
- [Come funziona il servizio di illuminazione votiva](issues/02-illuminazione-votiva.md): a Ragusa la gestisce il Comune (allaccio 39 €, canone 24 € l'anno, bollettino postale); l'utenza è per postazione e defunto, chi la chiede non è per forza il concessionario; morosità con sollecito, diffida e distacco. [Documento](https://github.com/activitydan/lavorazione-salm-upp/blob/research/illuminazione-votiva/docs/research/illuminazione-votiva.md).
- [Cosa offrono i concorrenti e cosa fa DAT](issues/03-concorrenti-e-servizi-dat.md): Deda Next ha già pagoPA e portale per le imprese funebri; nessun concorrente gestisce i morosi; DAT è l'unico con recapito fisico e messi, ma non con la notifica digitale; avviso pagoPA e stati documentati. [Documento](https://github.com/activitydan/lavorazione-salm-upp/blob/research/concorrenti-e-servizi-dat/docs/research/concorrenti-e-servizi-dat.md).
- [Struttura del menu](issues/06-struttura-del-menu.md): lista unica Dashboard, Ricerca, Censimento, Manutenzioni, Concessioni, Illuminazione votiva, Pratiche e operazioni, Scadenze e pagamenti, Impostazioni (solo Amministratore); spariscono Anagrafe, Esportazioni e Report; sul telefono Mappa, Ricerca, Nuovo rilievo, Manutenzioni, Verifiche. [Prototipo](https://github.com/activitydan/lavorazione-salm-upp/tree/prototipo/struttura-del-menu).
- [Modello della concessione](issues/07-modello-della-concessione.md): contratto a sé collegato a una o più schede; concessionario persona o ente (sempre indicato), con rappresentante se sono più; scadenza dalla decorrenza con durate configurabili per tipo; stati attiva, in scadenza, in decadenza, chiusa con motivo; azioni nuova, rinnovo, subentro, rinuncia, decadenza; aventi diritto per le tombe di famiglia.
- [Modello di pratiche e operazioni](issues/09-modello-pratiche-e-operazioni.md): la pratica è il fascicolo di una sola operazione (inumazione, tumulazione, esumazione, estumulazione, traslazione) su un solo defunto, su richiesta o d'ufficio; stati aperta, programmata, eseguita, annullata; unico documento l'attestazione di pagamento, tariffa per tipo; eseguita aggiorna le schede; agenda unica con operatori assegnati e registro delle operazioni; le esumazioni dovute entrano nello scadenzario unico; campanella degli alert personale in tutta l'app; la voce diventa "Operazioni cimiteriali" e nasce "Amministrazione" (operatori, agenzie funebri, durate, turno, tariffe), solo per l'Amministratore; portale per le agenzie rimandato.
- [Regole degli spazi su una pagina campione](issues/12-regole-degli-spazi.md): tutte le pagine tranne la home a tutta larghezza, con 20 px sopra, 38 ai lati e 24 sotto (16 ai lati sul telefono); solo il titolo, con le linguette sotto; 16 px tra i riquadri e dentro i riquadri, anche in finestre e pannello laterale; righe delle tabelle con 10 px sopra e sotto; riquadri affiancati alti uguali; altre distanze solo 4, 8, 12, 16, 24; la home resta com'è. La semplificazione pagina per pagina è divisa in cinque ticket (15–19). [Prototipo](https://github.com/activitydan/lavorazione-salm-upp/tree/prototipo/regole-degli-spazi).

## Not yet specified

- Collegamenti con i sistemi esterni previsti (ANPR, protocollo, contabilità): se serve mostrarli. Il menu non ha una voce apposta, quindi starebbero in Amministrazione o nelle Impostazioni; si vede nel ticket [Semplificazione di Impostazioni e Amministrazione](issues/18-semplificazione-impostazioni.md).
- Divisione finale in fasi e contenuto di ogni fase: quando i modelli sono decisi.

## Out of scope

- Server, account veri con password e dati reali (arriveranno con il backend, dopo questa mappa).
- Collegamenti reali: pagoPA, ANPR, protocollo, contabilità (Halley, Maggioli), conservazione a norma, recupero crediti, invio reale tramite DAT.
- Restyling: colori e caratteri nuovi.
- Totem all'ingresso e app pubblica separata.
- Portale per le agenzie funebri (come quello di Deda Next): non entra in questa versione; nella risposta al cliente è un passo successivo. Nella demo l'agenzia è solo un campo della pratica (vedi "Modello di pratiche e operazioni").
- Modifiche alla demo consegnata al cliente.
