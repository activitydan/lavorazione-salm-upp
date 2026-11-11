# Struttura del menu

Type: prototype
Status: resolved
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

### 2026-11-12 · risposte di Dan al primo giro

Sì a tutte e sette le proposte.

## Answer

Risolto il 2026-11-12, sul prototipo (variante A come base, con la voce unica di C e la fine di Report come in B).

- **Menu dell'Amministratore sul computer**, in quest'ordine: Dashboard, Ricerca, Censimento, Manutenzioni, Concessioni, Illuminazione votiva, Pratiche e operazioni, Scadenze e pagamenti; sotto l'intestazione "Configurazione", Impostazioni. Lista unica, nessun'altra intestazione.
- **Menu dell'Operatore sul computer**: le stesse voci senza Impostazioni.
- **Menu sul telefono** (Operatore e Amministratore): Mappa, Ricerca, Nuovo rilievo, Manutenzioni, Verifiche. Il logo porta alla Mappa.
- **Spariscono** Anagrafe, Esportazioni e Report:
  - Anagrafe › Defunti entra in Ricerca; Anagrafe › Concessionari entra in Concessioni;
  - le esportazioni stanno accanto ai dati che esportano; in Ricerca c'è un solo pulsante Esporta;
  - Report › Postazioni libere diventa un filtro pronto in Ricerca; Report › Statistiche va in Censimento; Scadenze, Lampade votive e Pagamenti passano alle voci nuove.
- **Scadenze e pagamenti** è una voce sola per tutto il giro scadenza → avviso tramite DAT → pagamento → sollecito, per concessioni e illuminazione votiva insieme.
- **Operatori**: aggiungerli e toglierli si fa in Impostazioni, solo l'Amministratore. In Censimento resta l'elenco in sola lettura, per assegnare le verifiche.
- **Censimento e Manutenzioni** restano due voci separate.
- **Nome provvisorio**: "Pratiche e operazioni" resta finché il ticket "Modello di pratiche e operazioni" non definisce la pratica.
- **Prototipo**: ramo `prototipo/struttura-del-menu`, da non unire a `main`.

### Aggiornamento del 2026-11-12

Dal ticket [Modello di pratiche e operazioni](09-modello-pratiche-e-operazioni.md). Questi punti valgono al posto di quelli sopra:

- "Pratiche e operazioni" si chiama **"Operazioni cimiteriali"**; dentro ci sono pratiche, agenda e registro.
- Nasce la voce **"Amministrazione"**, solo per l'Amministratore, sotto "Configurazione" e sopra Impostazioni: operatori (aggiungere, togliere, vedere alert e cose da fare di ognuno), agenzie funebri, durate delle concessioni, turno del campo comune, tariffe delle operazioni.
- La gestione degli operatori passa quindi dalle Impostazioni ad Amministrazione. Le Impostazioni restano per i campi della scheda (flag, tendine, sezioni) e per elenchi come categorie di manutenzione e squadre.
- Menu dell'Amministratore sul computer: Dashboard, Ricerca, Censimento, Manutenzioni, Concessioni, Illuminazione votiva, Operazioni cimiteriali, Scadenze e pagamenti; sotto "Configurazione", Amministrazione e Impostazioni. L'Operatore ha le stesse voci senza Amministrazione e Impostazioni.
- In "Scadenze e pagamenti" entrano anche le esumazioni e le estumulazioni dovute.
- La campanella degli alert è personale in tutta l'app: nessuno riceve alert generali, neanche nella Dashboard.
- Il prototipo sul ramo `prototipo/struttura-del-menu` mostra ancora il menu di prima.
