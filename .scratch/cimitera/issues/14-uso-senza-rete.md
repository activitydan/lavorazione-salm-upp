# Uso senza rete sul campo

Type: grilling
Status: resolved
Assignee: Dan

## Question

Cosa deve funzionare sul telefono quando nel cimitero manca il segnale, e come si comporta l'app quando torna la rete?

Sul telefono ci sono Nuovo rilievo, Ricerca, Mappa, Scheda, segnalazione di manutenzione e verifiche (ticket "Ruoli e versioni dell'app"). Da decidere: quali di queste servono senza rete; cosa succede alla mappa satellitare senza connessione; come l'operatore capisce cosa è stato salvato solo sul telefono; come si mostra nella demo, visto che oggi i dati restano comunque nel browser.

## Comments

### 2026-11-12 · fatti dal codice

- I dati della demo stanno già nel browser del telefono (IndexedDB, `src/data/persist.ts`): ricerca, schede e foto funzionano anche senza rete, se l'app è già aperta.
- Non c'è niente che tenga l'app sul telefono (nessun service worker né manifest): se si ricarica la pagina senza rete, l'app non si apre.
- La vista Satellite carica le immagini da internet (Esri). La vista Planimetria disegna perimetro, viali e postazioni dai dati e funziona già senza rete.
- La lettura della lapide usa file dell'app di circa 13 MB (`public/ocr`). Il GPS del telefono non usa la rete.

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

1. **Cosa funziona senza rete.** Proposta: tutto quello che c'è sul telefono per Operatore e Amministratore: Mappa, Ricerca, Scheda, Nuovo rilievo (con foto, GPS e lettura della lapide), segnalazione di manutenzione, Verifiche. La pagina del Cittadino e la versione per computer richiedono la rete.
2. **Aprire l'app senza rete.** Proposta: sul telefono CimiTera si installa dal browser come un'app, con icona sulla schermata Home; tutti i suoi file, compresi quelli per leggere la lapide, restano sul telefono e l'app si apre anche senza rete.
3. **Mappa satellitare senza rete.** Proposta: senza rete la mappa passa da sola a Planimetria, con un avviso breve; quando torna la rete torna a Satellite se era quella scelta. Una copia delle immagini satellitari sul telefono si rimanda al prodotto vero (più lavoro e serve un fornitore che la permetta).
4. **Come l'operatore capisce cosa è solo sul telefono.** Proposta: in alto una striscia "Senza rete"; ogni rilievo, segnalazione o verifica fatta senza rete porta l'etichetta "Da inviare"; un contatore "3 da inviare" apre l'elenco. Quando torna la rete l'invio parte da solo, le etichette spariscono e compare "3 modifiche inviate all'ufficio". Nuovo termine nel glossario: **Da inviare**.
5. **Come si attiva nella demo.** Proposta: l'app segue lo stato vero della rete del telefono (si mostra con la modalità aereo) e in più c'è un interruttore "Simula senza rete" nel riquadro dell'utente, per mostrarlo anche dal computer. L'invio all'ufficio è finto: i dati restano comunque nel browser.

### 2026-11-12 · risposte di Dan al primo giro

Dan accetta tutte le proposte, nella sessione principale: "andiamo avanti, accetta tutto degli altri ticket".

1. Sì.
2. Sì.
3. Sì.
4. Sì.
5. Sì.

Non restano domande: invio vero all'ufficio e modifiche della stessa scheda fatte insieme dal telefono e dall'ufficio arrivano con il backend, già fuori da questa mappa.

## Answer

Risolto il 2026-11-12.

- **Senza rete funziona** tutto il telefono di Operatore e Amministratore: Mappa, Ricerca, Scheda, Nuovo rilievo (con foto, GPS e lettura della lapide), segnalazione di manutenzione, Verifiche. La pagina del Cittadino e la versione per computer richiedono la rete.
- **App installata**: sul telefono CimiTera si installa dal browser come un'app, con icona sulla schermata Home. Tutti i suoi file restano sul telefono, compresi quelli per leggere la lapide, e l'app si apre anche senza rete.
- **Mappa**: senza rete passa da sola a Planimetria, con un avviso breve; quando torna la rete torna a Satellite se era quella scelta. Una copia delle immagini satellitari sul telefono è rimandata al prodotto vero.
- **Da inviare**: in alto una striscia "Senza rete"; ogni rilievo, segnalazione o verifica fatta senza rete porta l'etichetta "Da inviare"; un contatore ("3 da inviare") apre l'elenco. Quando torna la rete l'invio parte da solo, le etichette spariscono e compare "3 modifiche inviate all'ufficio".
- **Nella demo**: l'app segue lo stato vero della rete del telefono (si mostra con la modalità aereo) e c'è l'interruttore "Simula senza rete" nel riquadro dell'utente, per mostrarlo anche dal computer. L'invio all'ufficio è finto: i dati restano comunque nel browser.
- **Fuori da questa mappa** (con il backend): invio vero all'ufficio, modifiche della stessa scheda fatte insieme dal telefono e dall'ufficio.
