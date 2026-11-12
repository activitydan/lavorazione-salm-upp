# Semplificazione di Ricerca

Type: grilling
Status: resolved
Assignee: Dan
Blocked by: 06, 12

## Question

Come diventa la pagina Ricerca con quello che arriva dalle pagine tolte?

Da decidere:

- come entra Anagrafe › Defunti (per esempio un interruttore "Schede / Defunti"); la barra in alto resta la ricerca veloce;
- dove sta "Postazioni libere", che da Report diventa un filtro pronto;
- il pulsante Esporta unico: agisce sulla selezione oppure, se non c'è selezione, su tutti i risultati; dentro c'è la scelta delle colonne che oggi sta in Esportazioni;
- sul telefono la tabella scorre di lato (1322 px su 345): elenco a card con due o tre dati?

Le etichette QR si decidono nel ticket [Dashboard, Mappa, Scheda e pagina del QR](19-semplificazione-dashboard-mappa-scheda-qr.md). Gli spazi seguono [Regole degli spazi](12-regole-degli-spazi.md). Punto di partenza: [inventario-pagine.md](../inventario-pagine.md), doppioni 1 e 2 e le sezioni Ricerca, Anagrafe ed Esportazioni.

## Comments

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

Oggi Ricerca ha: in alto "Vedi sulla mappa" ed "Excel"; filtri a sinistra; sopra la tabella una barra con "PDF di tutte" ed "Etichette QR", che con righe selezionate diventa Excel, PDF schede, Etichette QR, Assegna verifica, Cambia stato e Deseleziona; tabella con 50 schede per pagina. Anagrafe › Defunti ha una riga per defunto, la barra delle lettere, due indicatori e un suo Excel. Report › Postazioni libere è l'elenco delle schede con stato "Libero", già presente nei filtri.

1. **Defunti in Ricerca.** Proposta: un interruttore "Schede / Defunti" sopra la tabella, con gli stessi filtri. In "Defunti" c'è una riga per defunto: cognome, nome, nascita, morte, età, ubicazione, stato. Spariscono la barra delle lettere e i due indicatori (i dati da completare sono già in Censimento, il totale dei defunti nella Dashboard).
2. **Postazioni libere.** Proposta: nessun pulsante nuovo; il filtro pronto è lo stato "Libero", che c'è già. I conteggi per tipologia e per struttura di Report passano al ticket [Censimento e Nuovo rilievo](16-semplificazione-censimento-e-rilievo.md), dove va Statistiche.
3. **Esporta.** Proposta: un solo pulsante "Esporta" in alto a destra, al posto di "Excel", accanto a "Vedi sulla mappa". Apre una finestra con Excel (con la scelta delle colonne), PDF delle schede ed Excel dei totali. Agisce sulle righe selezionate o, se non ce ne sono, su tutti i risultati, e lo dice ("Esporta 12" / "Esporta 1.858"). In "Defunti" l'Excel ha una riga per defunto.
4. **Barra delle righe selezionate.** Proposta: restano solo le azioni che cambiano i dati: Assegna verifica, Cambia stato, Deseleziona. Sparisce la barra con "PDF di tutte" ed "Etichette QR".
5. **Il resto di Esportazioni.** Proposta: l'Excel delle lampade votive per la fatturazione va in Illuminazione votiva, l'Excel delle scadenze in Scadenze e pagamenti; "Esportazioni recenti" sparisce.
6. **Telefono.** Proposta: la tabella diventa un elenco a card con foto, nome del defunto, ID e viale, stato; si tocca per aprire la scheda. Niente selezione né Esporta (sul telefono solo consultazione). I filtri si aprono dal pulsante "Filtri", come oggi.
7. **Righe per pagina.** Proposta: 50 come oggi, anche in "Defunti" (oggi 60) e sul telefono.
8. **Defunto nel glossario.** Proposta: "La persona sepolta in una postazione; una postazione può averne più di uno." Da evitare: deceduto, estinto.

### 2026-11-12 · risposte di Dan al primo giro

Sì a tutte e otto le proposte.

### 2026-11-12 · secondo giro, in attesa della risposta di Dan

9. **Concessioni dentro Ricerca.** Oggi Ricerca ha il filtro "Concessione" (in scadenza, scadute, senza) e il filtro "Nominativo" trova anche il nome del concessionario. Proposta: restano entrambi, perché si combinano con gli altri filtri e con la mappa (per esempio i loculi senza concessione di un viale); l'elenco delle concessioni e dei concessionari sta in Concessioni.

### 2026-11-12 · risposta di Dan al secondo giro

Sì.

## Answer

Risolto il 2026-11-12.

- **Com'è fatta la pagina**: titolo "Ricerca", senza frase sotto; in alto a destra "Vedi sulla mappa" ed "Esporta"; i filtri a sinistra come oggi; sopra la tabella l'interruttore "Schede / Defunti" e il numero dei risultati.
- **Defunti**: Anagrafe › Defunti diventa la vista "Defunti" di Ricerca, con gli stessi filtri. Una riga per defunto: cognome, nome, nascita, morte, età, ubicazione, stato. Spariscono la barra delle lettere e i due indicatori.
- **Postazioni libere**: nessun pulsante nuovo, il filtro pronto è lo stato "Libero". I conteggi per tipologia e per struttura passano al ticket [Censimento e Nuovo rilievo](16-semplificazione-censimento-e-rilievo.md).
- **Esporta**: un solo pulsante, che apre una finestra con Excel (con la scelta delle colonne), PDF delle schede ed Excel dei totali. Esporta le righe selezionate o, se non ce ne sono, tutti i risultati, e lo scrive sul pulsante ("Esporta 12" / "Esporta 1.858"). Nella vista "Defunti" l'Excel ha una riga per defunto.
- **Righe selezionate**: la barra ha solo Assegna verifica, Cambia stato e Deseleziona. Sparisce la barra con "PDF di tutte" ed "Etichette QR".
- **Il resto di Esportazioni**: l'Excel delle lampade votive per la fatturazione va in Illuminazione votiva, l'Excel delle scadenze in Scadenze e pagamenti; "Esportazioni recenti" sparisce. Le etichette QR si decidono nel ticket [Dashboard, Mappa, Scheda e pagina del QR](19-semplificazione-dashboard-mappa-scheda-qr.md).
- **Telefono**: elenco a card con foto, nome del defunto, ID e viale, stato; si tocca per aprire la scheda. Niente selezione né Esporta. I filtri si aprono dal pulsante "Filtri".
- **Righe per pagina**: 50, in tutte e due le viste e sul telefono.
- **Concessioni dentro Ricerca**: restano il filtro "Concessione" (in scadenza, scadute, senza) e la ricerca per nome che trova anche il concessionario.
- **Glossario**: entra "Defunto".
