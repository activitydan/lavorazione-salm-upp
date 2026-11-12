# Semplificazione di Impostazioni e Amministrazione

Type: grilling
Status: open
Assignee: Dan
Blocked by: 06, 09, 12

## Question

Cosa resta nelle Impostazioni, cosa va in Amministrazione e come sono fatte le due pagine?

Le Impostazioni vanno riviste più delle altre pagine, nell'aspetto e nel contenuto (indicazione di Dan). Sono solo per il computer.

Da decidere:

- restano per i campi della scheda (flag, tendine, sezioni) e per elenchi come categorie di manutenzione e squadre: unire Stati, Tipologie ed Elenchi in una sola linguetta "Elenchi"?
- dove vanno "Cimitero e dati" (viali, dati del cimitero, backup e ripristino, configurazione) e il Registro modifiche;
- com'è fatta Amministrazione, che riceve operatori (con alert e cose da fare di ognuno), agenzie funebri, durate delle concessioni, turno del campo comune e tariffe delle operazioni;
- se mostrare i collegamenti con i sistemi esterni (ANPR, protocollo, contabilità), che starebbero in una di queste due pagine (punto ancora aperto in "Not yet specified" della mappa).

Gli spazi seguono [Regole degli spazi](12-regole-degli-spazi.md). Punto di partenza: [inventario-pagine.md](../inventario-pagine.md), sezione Impostazioni; [Modello di pratiche e operazioni](09-modello-pratiche-e-operazioni.md) e l'aggiornamento in [Struttura del menu](06-struttura-del-menu.md).

Dal ticket [Modello dell'utenza votiva](08-modello-utenza-votiva.md): Amministrazione riceve anche il canone votivo annuo per punto luce e il contributo di allaccio (demo 24 € e 15 €). Il campo "Lampada votiva" della scheda diventa calcolato e i campi "Canone lampada votiva" e "Codice utenza" spariscono: vanno tolti anche dai campi configurabili.

Dal ticket [Semplificazione di Censimento e Nuovo rilievo](16-semplificazione-censimento-e-rilievo.md): nel Nuovo rilievo spariscono i flag "Tomba singola", "Cappella" e "Colombaio", perché ripetono la tipologia; da decidere qui se toglierli anche dai campi configurabili (e quindi da filtri e scheda). Censimento › Operatori diventa un elenco in sola lettura: "Nuovo operatore" e "Modifica" (nome, ruolo, attivo, telefono, email, colore sulla mappa) arrivano in Amministrazione.

Dal ticket [Semplificazione di Dashboard, Mappa, Scheda e pagina del QR](19-semplificazione-dashboard-mappa-scheda-qr.md): la sezione "Fatturazione e pagamenti" sparisce dalla scheda (con "Stato pagamenti" e "Intestatario utenza"), quindi va tolta anche dai campi configurabili. Nella scheda "manufatto" diventa "postazione": va rinominata anche la sezione "Manufatto" dei campi configurabili.
