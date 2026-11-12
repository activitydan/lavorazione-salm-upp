# Divisione in fasi

Type: grilling
Status: resolved
Assignee: Dan
Blocked by: 18

## Question

In quali fasi si costruisce la versione CimiTera, una fase per sessione, e cosa contiene ognuna?

Punto di partenza: l'ordine scritto nelle Notes della mappa (1 nome e logo, 2 semplificazione dei layout e nuovo menu, 3 concessioni, 4 illuminazione votiva, 5 pratiche e operazioni, 6 pagamenti e avvisi simulati). Va rivisto alla luce di tutte le decisioni prese.

Da decidere:

- quante fasi e in che ordine, con le dipendenze tra loro (per esempio Amministrazione prima dei modelli che ne usano le tariffe e le durate; lo scadenzario unico prima delle lettere di scadenza e degli avvisi di pagamento);
- dove vanno: ruoli e schermata "Entra come", pagina del Cittadino, campanella personale, Amministrazione, regole degli spazi, la semplificazione pagina per pagina (Ricerca, Censimento e Nuovo rilievo, Manutenzioni, Impostazioni e Amministrazione, Dashboard, Mappa e Scheda), il lavoro senza rete sul campo (app installabile, Planimetria automatica, "Da inviare", interruttore "Simula senza rete"), i dati finti di ogni modello;
- quanto è grande ogni fase, perché stia in una sessione;
- cosa si può mostrare al cliente alla fine di ogni fase.

Fonti: le risposte di tutti i ticket chiusi (vedi "Decisions so far" nella mappa). Quando questo ticket e "Risposta al cliente" sono chiusi, la mappa è finita e si passa a to-spec.

## Comments

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

Il ticket 18 ([Impostazioni e Amministrazione](18-semplificazione-impostazioni.md)) è ancora aperto: dove una fase dipende da lui è scritto "in sospeso, dipende dal ticket 18".

Fatti trovati nel codice: l'app è di circa 12.000 righe (React). I dati finti nascono da `scripts/genera-dati-demo.py`. I dati restano nel browser per sempre: oggi si ricaricano solo con "Ripristina i dati dimostrativi". La demo consegnata non si tocca, quindi il cliente vede le fasi su un'altra copia.

Regole generali

1. **Quante fasi e in che ordine.** Proposta: 13 fasi, una per sessione, una alla volta e mai in parallelo, perché toccano gli stessi file (dati, scheda, menu). Prima le pagine e il telefono (fasi 1–7), poi i modelli nuovi (fasi 8–13), come nell'ordine della stesura. Così le pagine nuove nascono già con la cornice, le tabelle, l'Esporta e la campanella fatti una volta sola.
   1 Nome, cornice e accessi · 2 Ricerca · 3 Scheda, Mappa e pagina del Cittadino · 4 Censimento e Nuovo rilievo · 5 Manutenzioni e campanella personale · 6 Impostazioni e Amministrazione · 7 Lavoro senza rete · 8 Concessioni · 9 Illuminazione votiva · 10 Pratiche · 11 Agenda e registro · 12 Scadenzario e invii tramite DAT · 13 Avvisi di pagamento e morosi.
2. **La demo resta intera a ogni fase.** Proposta: una cosa vecchia si toglie solo nella fase che costruisce quella che la prende al suo posto, così il cliente non vede mai sparire una funzione. Quindi:
   - Anagrafe: Defunti esce nella fase 2, Concessionari nella 8; la voce sparisce nella 8.
   - Esportazioni: Excel di Ricerca ed "Esportazioni recenti" nella 2, etichette QR nella 3, Excel delle lampade votive nella 9, Excel delle scadenze nella 12; la voce sparisce nella 12.
   - Report: Postazioni libere nella 2, Statistiche nella 4, Lampade votive nella 9, Scadenze nella 12, Pagamenti nella 13; la voce sparisce nella 13.
   - Scheda: la concessione resta nella finestra Modifica fino alla 8; flag "Lampada votiva" a mano, "Canone lampada votiva", "Codice utenza" e "Intestatario utenza" fino alla 9; "Stato pagamenti" (e con lui la sezione "Fatturazione e pagamenti") fino alla 13.
   - Censimento › Operatori: "Nuovo operatore" e "Modifica" restano fino alla 6.
   - Dashboard: il riquadro Alert resta fino alla 11, quando diventa "Agenda di oggi"; dalla 5 mostra gli alert personali di chi è entrato.
3. **Una fase non si spezza a metà.** Proposta: ogni fase si chiude con la demo funzionante, commit e push. Se in to-spec una fase sembra troppo grande per una sessione, si divide in due prima di cominciarla, mai a lavoro avviato.

Le fasi (grandezza: media o grande; nessuna è piccola)

4. **Fase 1 · Nome, cornice e accessi** (media). Proposta: nome e logo CimiTera, "REST IN GPS" sparisce, "Una soluzione DAT | HYA Group" nella schermata di caricamento e in fondo ai PDF; le regole degli spazi sulla cornice di tutte le pagine (margini, tutta larghezza, solo il titolo, via le sette frasi descrittive); schermata "Entra come" (l'Operatore sceglie il suo nome, l'Amministratore entra come "Ufficio Cimiteri"); menu nuovo per ruolo, sul computer e sul telefono, con le voci che esistono già (la voce Mappa esce dal menu del computer); riquadro dell'utente con il cambio di ruolo. Al cliente: "l'app si chiama CimiTera, le pagine sono più pulite, si entra come Operatore o Amministratore e sul telefono c'è solo il lavoro sul campo".
5. **Fase 2 · Ricerca** (media, ticket 15). Proposta: tutta la semplificazione di Ricerca: vista "Defunti", filtro "Libero", un solo Esporta, barra delle righe selezionate, 50 righe per pagina, elenco a card sul telefono. La finestra Esporta e la barra delle pagine nascono qui e le riusano le fasi dopo. Al cliente: "una sola ricerca per postazioni e defunti, un solo pulsante per esportare".
6. **Fase 3 · Scheda, Mappa e pagina del Cittadino** (grande, ticket 19). Proposta: sezioni, azioni e parole della scheda ("postazione", "Concessionario"), flag "Visibile al pubblico", card del pin con "Apri scheda" e "Indicazioni", "Dashboard" evidenziata sulla Mappa, il QR sparisce del tutto, la pagina del QR diventa la pagina del Cittadino. I riassunti Concessione, Illuminazione votiva e Pratiche si riempiono nelle fasi 8, 9 e 10. Al cliente: "scheda più ordinata e pagina pubblica per trovare un defunto dal telefono".
7. **Fase 4 · Censimento e Nuovo rilievo** (grande, ticket 16). Proposta: tutta la semplificazione del ticket 16, con le Statistiche di Report dentro Avanzamento e il Nuovo rilievo in cinque passi. La domanda "C'è una lampada accesa?" arriva con la fase 9, perché serve l'utenza votiva. Se i flag Tomba singola, Cappella e Colombaio escono anche dai campi configurabili: in sospeso, dipende dal ticket 18. Al cliente: "l'avanzamento del censimento in una pagina e un rilievo più corto".
8. **Fase 5 · Manutenzioni e campanella personale** (media, ticket 17). Proposta: tutta la semplificazione del ticket 17 (squadre comprese, che escono anche dalle Impostazioni) e la campanella personale in tutta l'app, sul computer e sul telefono, con gli alert di manutenzioni e verifiche. Gli alert delle pratiche arrivano nella 11, quelli dei lotti DAT nella 12. Al cliente: "ognuno vede le sue manutenzioni e i suoi alert".
9. **Fase 6 · Impostazioni e Amministrazione** (media). Proposta: la fase si fa dopo la 5, perché Amministrazione mostra gli alert e le cose da fare di ogni operatore, e prima della 8, perché le concessioni ci mettono le durate. Contenuto: in sospeso, dipende dal ticket 18 (linguette, campi da togliere, operatori, agenzie funebri, registro, collegamenti esterni).
10. **Fase 7 · Lavoro senza rete** (media, ticket 14). Proposta: app installabile sul telefono, Planimetria automatica senza rete, striscia "Senza rete", etichetta e contatore "Da inviare" con invio finto quando torna la rete, interruttore "Simula senza rete" nel riquadro dell'utente. Va dopo le fasi 2–5 perché copre le pagine del telefono già semplificate; le fasi 8–13 riguardano quasi solo il computer. Al cliente: "con il telefono in modalità aereo si lavora lo stesso".
11. **Fase 8 · Concessioni** (grande, ticket 07). Proposta: voce Concessioni con contratti, concessionari (persona o ente, rappresentante), aventi diritto, stati, azioni (nuova, rinnovo, subentro, rinuncia, avvio della decadenza, decadenza) e storico; Anagrafe › Concessionari entra qui; la concessione esce dalla finestra Modifica della scheda; riassunto Concessione nella scheda. Senza avvisi di pagamento né lettere, che arrivano nelle fasi 12 e 13. Al cliente: "le concessioni complete, con scadenze calcolate e rinnovi".
12. **Fase 9 · Illuminazione votiva** (grande, ticket 08). Proposta: voce Illuminazione votiva con utenze, abbonati, punti luce, stati, azioni e storico; "Segnala guasto"; chiusura da sola a fine concessione; flag "Lampada votiva" calcolato; riassunto nella scheda; Excel per la fatturazione; "C'è una lampada accesa?" nel rilievo e le lampade da controllare. "Emetti i canoni dell'anno" e la scala della morosità arrivano nella 13. Al cliente: "l'illuminazione votiva completa, legata alla postazione e al defunto".
13. **Fase 10 · Pratiche** (grande, ticket 09). Proposta: voce Operazioni cimiteriali con la linguetta Pratiche: le cinque operazioni, richiedente, stati, esecuzione che aggiorna da sola schede, posti occupati e utenze votive, traslazione, dove vanno i resti, sezione Pratiche nella scheda, defunto spostato trovabile in Ricerca e nella pagina del Cittadino, avviso maggio–settembre, agenzia funebre scelta dall'elenco. Al cliente: "una pratica dall'apertura all'esecuzione, e la scheda si aggiorna da sola".
14. **Fase 11 · Agenda e registro** (media, ticket 09). Proposta: agenda unica per settimana e per giorno con filtri e avvisi di sovrapposizione, registro delle operazioni in PDF, "Agenda di oggi" nella Dashboard, alert delle pratiche nella campanella. Al cliente: "l'agenda dell'ufficio e il registro chiesto dalla legge".
15. **Fase 12 · Scadenzario e invii tramite DAT** (grande, ticket 09 e 11). Proposta: voce Scadenze e pagamenti con lo scadenzario unico (concessioni in scadenza, fosse a fine turno, concessioni chiuse ma occupate) e le pratiche d'ufficio aperte dalle righe; lettere di scadenza, lotti, canali, esiti simulati, prove, reinvio e stampa per l'affissione; linguetta "Invii DAT"; diffida di decadenza con Notifica Certa; alert dei non consegnati. Prima dei pagamenti perché i pagamenti usano lo stesso invio tramite DAT. Al cliente: "tutte le scadenze in un posto e le lettere tramite DAT, simulate".
16. **Fase 13 · Avvisi di pagamento e morosi** (grande, ticket 10). Proposta: gli avvisi di pagamento nascono da soli dalle azioni di concessioni, utenze e pratiche; "Simula pagamento", PDF "FAC-SIMILE", linguette "Avvisi di pagamento" e "Morosi", scala della morosità per i tre motivi, sospensione e riaccensione dell'utenza, "Emetti i canoni dell'anno", canoni, solleciti e diffide tramite DAT, etichetta "Moroso". Al cliente: "il giro completo: scadenza, lettera, avviso, pagamento simulato, moroso, sollecito".

Dati, Amministrazione e cliente

17. **Amministrazione cresce per fasi.** Proposta: la pagina nasce nella fase 6; ogni fase di modello ci aggiunge le regole del suo modello, importi compresi (8 durate, rinnovo, soglia "in scadenza" e tariffe delle concessioni; 9 canone e allaccio; 10 turno e tariffe delle operazioni; 13 i giorni per pagare, dopo il sollecito e dopo la diffida) e le sue cose da fare dell'operatore. Dove stanno dentro la pagina: in sospeso, dipende dal ticket 18.
18. **Dati finti.** Proposta: ogni fase scrive i dati finti di ciò che costruisce, nel generatore dei dati dimostrativi, legati a quelli delle fasi prima (per esempio le utenze votive della 9 stanno su schede con concessioni della 8).
19. **Dati vecchi nel browser.** Proposta: quando una fase cambia la forma dei dati, la demo ricarica da sola i dati dimostrativi alla prima apertura e lo dice con un messaggio breve. Niente conversione dei dati vecchi: le prove fatte dal cliente nella fase prima si perdono.
20. **Cosa vede il cliente.** Proposta: alla fine di ogni fase Dan aggiorna la copia di lavoro online (mai la demo consegnata) e manda al cliente il link con le tre righe "Al cliente" della fase. Nessuna data, come nella risposta già approvata.

### 2026-11-12 · risposte di Dan al primo giro

Sì a tutte e venti le proposte. Il ticket 18 è ancora aperto: i punti che dipendono da lui restano in sospeso (vedi Answer).

## Answer

Risolto il 2026-11-12. Alcuni punti restano in sospeso e dipendono dal ticket [Semplificazione di Impostazioni e Amministrazione](18-semplificazione-impostazioni.md).

**Regole**

- **13 fasi**, una per sessione, una alla volta e mai in parallelo (toccano gli stessi file). Prima le pagine e il telefono (1–7), poi i modelli nuovi (8–13).
- **La demo resta intera a ogni fase**: una cosa vecchia si toglie solo nella fase che costruisce quella che la prende al suo posto.
  - Anagrafe: Defunti esce nella 2, Concessionari nella 8; la voce sparisce nella 8.
  - Esportazioni: Excel di Ricerca ed "Esportazioni recenti" nella 2, etichette QR nella 3, Excel delle lampade votive nella 9, Excel delle scadenze nella 12; la voce sparisce nella 12.
  - Report: Postazioni libere nella 2, Statistiche nella 4, Lampade votive nella 9, Scadenze nella 12, Pagamenti nella 13; la voce sparisce nella 13.
  - Scheda: la concessione resta nella finestra Modifica fino alla 8; flag "Lampada votiva" a mano, "Canone lampada votiva", "Codice utenza" e "Intestatario utenza" fino alla 9; "Stato pagamenti" e la sezione "Fatturazione e pagamenti" fino alla 13.
  - Censimento › Operatori: "Nuovo operatore" e "Modifica" fino alla 6.
  - Dashboard: il riquadro Alert mostra dalla 5 gli alert personali di chi è entrato e diventa "Agenda di oggi" nella 11.
- **Nessuna fase si lascia a metà**: si chiude con la demo funzionante, commit e push. Se in to-spec una fase sembra troppo grande, si divide in due prima di cominciarla.
- **Amministrazione cresce per fasi**: la pagina nasce nella 6; ogni fase di modello ci aggiunge le sue regole, importi compresi (8 durate, rinnovo, soglia "in scadenza" e tariffe delle concessioni; 9 canone e allaccio; 10 turno e tariffe delle operazioni; 13 i giorni per pagare, dopo il sollecito e dopo la diffida) e le sue cose da fare dell'operatore. Dove stanno nella pagina: in sospeso, dipende dal ticket 18.
- **Dati finti**: ogni fase scrive quelli di ciò che costruisce, nel generatore dei dati dimostrativi, legati a quelli delle fasi prima.
- **Dati vecchi nel browser**: quando una fase cambia la forma dei dati, la demo ricarica da sola i dati dimostrativi alla prima apertura, con un messaggio breve. Niente conversione: le prove del cliente della fase prima si perdono.
- **Cliente**: alla fine di ogni fase Dan aggiorna la copia di lavoro online (mai la demo consegnata) e manda il link con le tre righe "Al cliente" della fase, senza date.

**Fasi**

| Fase | Contenuto | Grandezza | Al cliente |
|---|---|---|---|
| 1 Nome, cornice e accessi | nome e logo CimiTera ("REST IN GPS" sparisce, "Una soluzione DAT \| HYA Group" nel caricamento e nei PDF); regole degli spazi sulla cornice di tutte le pagine; "Entra come"; menu nuovo per ruolo, computer e telefono, con le voci che esistono (Mappa esce dal menu del computer); riquadro dell'utente con il cambio di ruolo | media | nome nuovo, pagine più pulite, ingresso per ruolo, telefono solo per il campo |
| 2 Ricerca | ticket 15 per intero; finestra Esporta e barra delle pagine, riusate dopo | media | una sola ricerca per postazioni e defunti, un solo Esporta |
| 3 Scheda, Mappa e pagina del Cittadino | ticket 19 tranne "Agenda di oggi"; QR via; "Visibile al pubblico"; i riassunti Concessione, Illuminazione votiva e Pratiche si riempiono nelle fasi 8, 9, 10 | grande | scheda più ordinata, pagina pubblica per trovare un defunto |
| 4 Censimento e Nuovo rilievo | ticket 16 per intero, Statistiche in Avanzamento, rilievo in cinque passi; "C'è una lampada accesa?" arriva nella 9; flag doppioni fuori anche dai campi configurabili: in sospeso, dipende dal ticket 18 | grande | avanzamento in una pagina, rilievo più corto |
| 5 Manutenzioni e campanella personale | ticket 17 per intero (squadre via anche dalle Impostazioni); campanella personale su computer e telefono con gli alert di manutenzioni e verifiche | media | ognuno vede le sue manutenzioni e i suoi alert |
| 6 Impostazioni e Amministrazione | dopo la 5 (alert e cose da fare degli operatori), prima della 8 (durate); contenuto in sospeso, dipende dal ticket 18 | media | in sospeso, dipende dal ticket 18 |
| 7 Lavoro senza rete | ticket 14 per intero: app installabile, Planimetria automatica, "Senza rete", "Da inviare" con invio finto, "Simula senza rete" | media | con il telefono in modalità aereo si lavora lo stesso |
| 8 Concessioni | ticket 07: contratti, concessionari, aventi diritto, stati, azioni, storico; Anagrafe › Concessionari entra qui; concessione fuori dalla finestra Modifica; riassunto nella scheda; senza avvisi di pagamento né lettere | grande | concessioni complete con scadenze calcolate e rinnovi |
| 9 Illuminazione votiva | ticket 08: utenze, abbonati, punti luce, stati, azioni, storico, "Segnala guasto", chiusura a fine concessione, flag calcolato, riassunto, Excel per la fatturazione, lampada nel rilievo e lampade da controllare; canoni dell'anno e morosità nella 13 | grande | illuminazione votiva legata a postazione e defunto |
| 10 Pratiche | ticket 09, linguetta Pratiche di Operazioni cimiteriali: cinque operazioni, richiedente, stati, esecuzione che aggiorna schede, posti e utenze, traslazione, resti, sezione nella scheda, defunto spostato in Ricerca e nella pagina del Cittadino, avviso maggio–settembre, agenzia funebre | grande | una pratica dall'apertura all'esecuzione, la scheda si aggiorna da sola |
| 11 Agenda e registro | ticket 09: agenda unica con filtri e sovrapposizioni, registro in PDF, "Agenda di oggi" nella Dashboard, alert delle pratiche | media | agenda dell'ufficio e registro chiesto dalla legge |
| 12 Scadenzario e invii tramite DAT | voce Scadenze e pagamenti: scadenzario unico e pratiche d'ufficio dalle righe; ticket 11 per intero (lettere, lotti, canali, esiti, prove, reinvio, affissione, "Invii DAT", diffida con Notifica Certa, alert dei non consegnati) | grande | tutte le scadenze in un posto e le lettere tramite DAT, simulate |
| 13 Avvisi di pagamento e morosi | ticket 10 per intero: avvisi dalle azioni, "Simula pagamento", PDF "FAC-SIMILE", "Avvisi di pagamento" e "Morosi", scala della morosità, sospensione e riaccensione, "Emetti i canoni dell'anno", canoni, solleciti e diffide tramite DAT, "Moroso" | grande | il giro completo: scadenza, lettera, avviso, pagamento simulato, moroso, sollecito |

**In sospeso, dipende dal ticket 18**: il contenuto della fase 6 (linguette, campi da togliere, operatori e loro ruolo, agenzie funebri, registro, collegamenti esterni); dove stanno le regole che ogni fase di modello aggiunge in Amministrazione; se i flag Tomba singola, Cappella e Colombaio escono dai campi configurabili nella fase 4 o nella 6. Quando il ticket 18 si chiude, chi lo chiude aggiunge qui un aggiornamento e, se cambia una fase, lo scrive nella tabella.
