# Struttura del menu

Type: prototype
Status: open
Assignee: Dan
Blocked by: 04, 05

## Question

Quali voci ha il menu per ogni ruolo, e dove stanno le funzioni nuove?

Da decidere su un prototipo navigabile:

- dove vanno concessioni, illuminazione votiva, pratiche e operazioni, pagamenti, avvisi;
- cosa si unisce tra le voci di oggi (per esempio Ricerca con Anagrafe, Report con Esportazioni);
- cosa resta di Report, che oggi contiene già scadenze, lampade votive e pagamenti.

## Assets

- Prototipo navigabile sul ramo [`prototipo/struttura-del-menu`](https://github.com/activitydan/lavorazione-salm-upp/tree/prototipo/struttura-del-menu) (da non unire a `main`). Si avvia con `npm run dev`; la variante si sceglie con `?menu=A|B|C|oggi` e il ruolo con `?ruolo=amministratore|operatore`, prima del `#` (esempio `http://localhost:5180/?menu=B#/`). Frecce ← → o la barra nera in basso per cambiare variante.
  - **A · Lista unica**: Dashboard, Censimento, Ricerca, Manutenzioni, Concessioni, Illuminazione votiva, Pratiche e operazioni, Report, Impostazioni. Pagamenti e avvisi sono schede dentro Concessioni e Illuminazione votiva.
  - **B · Gruppi per area**: Cimitero (Dashboard, Ricerca, Censimento, Manutenzioni), Servizi (Concessioni, Illuminazione votiva, Pratiche e operazioni), Scadenze e incassi (Scadenzario con avvisi DAT, Pagamenti), Configurazione (Operatori, Impostazioni). Report sparisce.
  - **C · Poche voci**: Dashboard, Ricerca, Cimitero (Censimento, Manutenzioni, Postazioni libere, Statistiche), Contratti (Concessioni, Illuminazione votiva), Pratiche, Scadenze e pagamenti, Impostazioni.
  - In tutte: Anagrafe ed Esportazioni spariscono; sul telefono il menu è uguale per tutte (Mappa, Ricerca, Nuovo rilievo, Manutenzioni, Verifiche).

## Comments

### 2026-11-12 · primo giro di domande sul prototipo, in attesa delle risposte di Dan

1. **Anagrafe ed Esportazioni.** Proposta: spariscono in tutte le varianti. Anagrafe › Defunti entra in Ricerca, Anagrafe › Concessionari in Concessioni, le esportazioni stanno accanto ai dati (un solo pulsante Esporta in Ricerca).
2. **Forma del menu.** Proposta: lista unica come la A (voci in fila, solo "Configurazione" come intestazione), perché è la più vicina a oggi.
3. **Pagamenti e avvisi.** Proposta: una voce sola "Scadenze e pagamenti", come nella C. Scadenza, avviso tramite DAT, pagamento e sollecito sono un unico giro, uguale per concessioni e illuminazione votiva, e così il servizio di DAT si vede in un posto.
4. **Report.** Proposta: sparisce, come nella B. Postazioni libere diventa un filtro pronto in Ricerca, Statistiche va in Censimento.
5. **Operatori.** Proposta: la gestione (aggiungere, togliere) va in Impostazioni, solo per l'Amministratore; in Censimento resta l'elenco in sola lettura per assegnare le verifiche.
6. **Censimento e Manutenzioni.** Proposta: restano due voci separate, non dentro una voce "Cimitero" come nella C.
7. **Menu del telefono.** Proposta: uguale per Operatore e Amministratore: Mappa, Ricerca, Nuovo rilievo, Manutenzioni, Verifiche. Il logo porta alla Mappa.

Con queste proposte il menu dell'Amministratore sul computer è: Dashboard, Ricerca, Censimento, Manutenzioni, Concessioni, Illuminazione votiva, Pratiche e operazioni, Scadenze e pagamenti, Impostazioni. L'Operatore ha le stesse voci senza Impostazioni. Il nome "Pratiche e operazioni" resta provvisorio fino al ticket "Modello di pratiche e operazioni".
