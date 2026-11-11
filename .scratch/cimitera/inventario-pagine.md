# Inventario delle pagine e proposte di semplificazione

Scritto il 2026-11-11 dal codice e dalle misure prese nell'anteprima a 1920×930 e su telefono (375×812). Le proposte sono solo proposte: le decisioni si prendono nei ticket "Struttura del menu", "Regole degli spazi su una pagina campione" e nei ticket pagina per pagina.

Criterio di Dan: è superfluo ciò che si raggiunge già da un'altra parte (esempio: la voce "Mappa" del menu, tolta perché la mappa si apre dalla Dashboard).

Non ancora guardato: il pannello laterale della scheda sulla mappa e le finestre di modifica. Vanno visti nel ticket della pagina a cui appartengono.

## Misure a 1920×930

Tutte le pagine tranne la home hanno la stessa cornice:

- margini 24 px sopra, 28 ai lati, 48 sotto;
- larghezza bloccata a 1640 px su 1720 disponibili: restano 40 px vuoti per lato, mentre la home usa tutta la larghezza;
- titolo con frase descrittiva alto 58 px, poi 20 px, poi le schede, poi 18 px: il primo contenuto utile comincia circa 165 px sotto la barra in alto. Nella home comincia a 20 px;
- tra i blocchi le distanze sono 14, 16, 18 e 20 px, mescolate.

Pagine troppo lunghe (in schermate da scorrere):

| Pagina | Computer | Telefono |
|--------|----------|----------|
| Anagrafe › Concessionari | 19,9 | non misurata |
| Censimento › Verifiche | 7,7 | 13,8 |
| Manutenzioni › Elenco | 5,9 | 32,5 |
| Censimento › Colombari e cappelle | 4,7 | 25,1 |
| Anagrafe › Defunti | 4,5 | 6,3 |

Proposta: elenchi a pagine da 25 righe come già fa Ricerca, oppure altezza fissa con scorrimento interno come i riquadri della home.

## Misure su telefono

- Nessuna pagina scorre in orizzontale: bene.
- Le schede in alto escono dallo schermo e vanno fatte scorrere di lato: Impostazioni (915 px su 347), Censimento (806), Report (751).
- Le tabelle scorrono di lato: Ricerca (1322 px su 345), Operatori (939), Report (899), Anagrafe (842), Verifiche (786).
- Proposta per la versione semplificata: su telefono le tabelle diventano elenchi a card con due o tre dati, e le pagine con molte schede mostrano solo quelle utili al ruolo.

## Doppioni trovati (in ordine di peso)

| # | Cosa | Dove sta oggi | Proposta |
|---|------|---------------|----------|
| 1 | Esportare Excel, PDF ed etichette QR | Ricerca (tre punti diversi della pagina), Esportazioni, Report, Anagrafe | Togliere la pagina Esportazioni: ogni esportazione sta accanto ai dati che esporta. In Ricerca un solo gruppo di pulsanti. |
| 2 | Cercare un nominativo | Barra in alto, Ricerca, Anagrafe › Defunti | Unire Anagrafe › Defunti dentro Ricerca (un interruttore "Schede / Defunti"). La barra in alto resta la ricerca veloce. |
| 3 | Concessionari e scadenze | Anagrafe › Concessionari, Report › Scadenze concessioni, Esportazioni › Scadenze | Tutto nella nuova voce Concessioni. |
| 4 | Lampade votive e morosi | Report › Lampade votive, Report › Pagamenti, Esportazioni › Lampade votive | Tutto nella nuova voce Illuminazione votiva (e Pagamenti). |
| 5 | Operatori | Censimento › Avanzamento ("Operatori sul campo") e Censimento › Operatori | Una sola lista. Dato che gli operatori li gestisce l'amministratore, valutare lo spostamento in Impostazioni. |
| 6 | Mappa | Dashboard, pagina Mappa, Censimento › Avanzamento, Censimento › Quadranti, Manutenzioni › Mappa, Scheda | Togliere la mappa da Censimento › Avanzamento (c'è già in Quadranti). Manutenzioni › Mappa diventa un pulsante "Vedi sulla mappa" che apre la pagina Mappa filtrata. |
| 7 | Alert | Riquadro Alert della Dashboard, campanella nel menu, "centro alert" | La campanella apre lo stesso elenco del riquadro: tenere il riquadro in Dashboard e far portare lì la campanella, senza pannello a parte. |
| 8 | Numeri del censimento | Riquadro Censimento della Dashboard e i quattro indicatori di Censimento › Avanzamento | Tenere entrambi, ma in Avanzamento togliere "Schede censite", già in Dashboard. |
| 9 | Scheda | Pannello laterale sulla mappa e pagina "vista estesa" | Tenere entrambe: servono a due momenti diversi. Da allineare i contenuti. |

## Testi descrittivi

Ogni pagina ha sotto il titolo una frase che la descrive (per esempio "Filtri multipli su tutte le schede: gli stessi filtri valgono per la mappa e per le esportazioni"). Sono 7 frasi su 7 pagine. Proposta: toglierle tutte. Il titolo e le schede bastano, e si recuperano circa 24 px in alto per pagina.

Lo stesso vale per i sottotitoli dentro le finestre ("Compare subito nella scheda, nel rilievo sul campo, nei filtri e nelle esportazioni"): tenerli solo dove spiegano una conseguenza che l'utente non vede.

## Pagina per pagina

### Dashboard
Mappa con interruttore Satellite/Planimetria, "Apri la mappa" e legenda cliccabile; riquadri Alert, Censimento, Manutenzione, Attività recente. In alto: scelta del cimitero, ricerca, "Nuovo rilievo".
- È lo standard. Nessuna proposta, salvo decidere se "Attività recente" serve all'amministratore o solo all'operatore.

### Mappa (si apre da "Apri la mappa")
Mappa a tutta pagina, pulsante Filtri, "Colora per" stato o tipologia, interruttore Quadranti, pulsante Elenco, legenda, card del pin con "Apri scheda", Parete, indicazioni Google Maps, vista estesa.
- Proposta: aggiungere un modo chiaro per tornare alla Dashboard, perché ora nessuna voce del menu è evidenziata.
- Proposta: la card del pin ha quattro azioni; tenere "Apri scheda" e "Indicazioni", spostare le altre dentro la scheda.

### Censimento
Cinque schede: Avanzamento, Quadranti, Operatori, Verifiche, Colombari e cappelle.
- Avanzamento: quattro indicatori, grafico delle schede al giorno, mappa dei quadranti, tabella di avanzamento per quadrante, elenco "Operatori sul campo". Proposte ai punti 5, 6 e 8.
- Quadranti: mappa per disegnare e lista con modifica, filtro sulla mappa, elimina.
- Operatori: tabella con ruolo, contatti, quadranti, schede, verifiche.
- Verifiche: filtro aperte/completate, "Assegna verifica", tabella.
- Colombari e cappelle: filtro per tipo, ricerca, "Nuova struttura", card con "Griglia a parete", "Scheda", "Sulla mappa".

### Nuovo rilievo
Sei passi: foto della lapide, posizione GPS, classificazione, anagrafica e ubicazione, flag, riepilogo. Poi "Scheda salvata" con tre pulsanti.
- È il cuore della versione per telefono. Proposta: unire "flag" dentro "anagrafica" quando i flag sono pochi, per scendere a cinque passi.

### Ricerca
Titolo, pulsante Excel in alto, filtri, barra della selezione con Excel, PDF, Etichette QR, Assegna verifica, poi ancora "PDF di tutte" ed "Etichette QR"; tabella ordinabile con colonne configurabili; paginazione.
- Proposta al punto 1: un solo gruppo "Esporta" che agisce sulla selezione oppure, se non c'è selezione, su tutti i risultati.

### Anagrafe
Due schede: Defunti (due indicatori, ricerca, Excel, tabella) e Concessionari (ricerca, tabella con concessioni, prossima scadenza, lampade, pagamenti).
- Proposte ai punti 2 e 3: la pagina sparisce, divisa tra Ricerca e Concessioni.

### Manutenzioni
"Segnala manutenzione"; tre schede: Elenco, Calendario (con "Da pianificare"), Mappa; dettaglio con "Risolvi" e foto; "Crea alert". L'elenco ha quattro filtri: ricerca, stato, priorità, categoria.
- Proposta al punto 6 per la scheda Mappa.
- L'elenco è a card e arriva a 32 schermate su telefono: serve un limite o la divisione in pagine.

### Report
Cinque schede: Scadenze concessioni, Postazioni libere, Lampade votive, Pagamenti, Statistiche.
- Scadenze: grafico a 12 mesi, scelta del periodo, "Crea alert", Excel, tabella.
- Postazioni libere: indicatori per tipologia, "Vedi sulla mappa", loculi liberi per struttura, elenco.
- Lampade votive: tre indicatori, Excel per la fatturazione, lampade per viale, utenze morose.
- Pagamenti: ciambella degli stati di pagamento e tabella "Posizioni da sollecitare o verificare".
- Statistiche: ciambella degli stati, barre delle tipologie, riepilogo per quadrante.
- Con le nuove voci restano qui solo Postazioni libere e Statistiche. Proposta: Report diventa una pagina sola, senza schede, oppure "Postazioni libere" passa in Ricerca come filtro pronto.

### Esportazioni
Excel delle schede filtrate con scelta delle colonne, cinque card di esportazione (lampade votive, totali, scadenze, PDF multiplo, etichette QR), "Esportazioni recenti".
- Proposta al punto 1: togliere la pagina. La scelta delle colonne va nel pulsante "Esporta" di Ricerca.

### Impostazioni
Sei schede: Scheda Pro · campi, Stati, Tipologie, Elenchi, Cimitero e dati, Registro modifiche.
- "Cimitero e dati" contiene: viali, dati del cimitero, backup e ripristino, configurazione.
- Solo per l'amministratore. Proposta: unire Stati, Tipologie ed Elenchi in una scheda "Elenchi", perché sono tre liste dello stesso tipo. Qui possono arrivare Operatori e le durate delle concessioni.

### Scheda (vista estesa) e pagina pubblica del QR
Scheda: foto, dati, stato, flag, defunti, ubicazione, mappa in fondo, pulsanti Precedente, Successiva, "Sulla mappa". Pagina del QR: nome, dati essenziali, mappa, indicazioni.
- La pagina del QR è la base naturale per il ruolo di chi cerca un defunto.

## Spazi: scarti rispetto alla home

Standard della home: 16 px tra i riquadri, margini interni dei riquadri 14–16 px, pagina a tutta larghezza con 20 px sopra.

| Dove | Oggi | Standard |
|------|------|----------|
| Margini di pagina (tutte tranne la home) | 24 px sopra, 28 ai lati, 48 sotto, larghezza massima 1640 centrata | 20 sopra, come la home |
| Distanza tra indicatori (`kpi-grid`) | 14 px | 16 |
| Margine interno dei riquadri (`card--pad`) | 18 px | 16 |
| Margine interno degli indicatori | 16 / 18 px | 16 |
| Campi dei moduli (`grid-form`) | 14 px | 16 |
| Titolo di pagina → contenuto | 20 px, più la frase descrittiva | 16, senza frase |
| Distanze usate nel CSS | 2, 4, 6, 8, 10, 12, 14, 16 | scala 4, 8, 12, 16, 24 |

## Cosa passa ai prossimi ticket

- "Struttura del menu": punti 1–5 della tabella dei doppioni. Con quelle proposte il menu passa da 8 voci a Dashboard, Censimento, Ricerca, Concessioni, Illuminazione votiva, Pratiche e operazioni, Manutenzioni, Report, Impostazioni, da ridurre ancora per ruolo.
- "Regole degli spazi su una pagina campione": la tabella degli spazi. Pagina campione consigliata: Censimento › Avanzamento, perché ha indicatori, grafico, mappa e tabella insieme.
- "Ruoli e versioni dell'app": le note su Nuovo rilievo, Impostazioni e pagina del QR.
