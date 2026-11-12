# Semplificazione di Dashboard, Mappa, Scheda e pagina del QR

Type: grilling
Status: open
Assignee: Dan
Blocked by: 05, 06, 09, 12

## Question

Cosa si toglie e cosa si unisce nella Dashboard, nella Mappa, nella Scheda e nella pagina del QR?

Da decidere:

- Dashboard: la campanella è personale e nessuno riceve alert generali, quindi cosa prende il posto del riquadro Alert; "Attività recente" serve all'Amministratore o solo all'Operatore. Gli spazi della home restano com'erano;
- Mappa: un modo chiaro per tornare alla Dashboard; la card del pin ha quattro azioni: tenere "Apri scheda" e "Indicazioni" e spostare le altre dentro la scheda?
- Scheda: pannello laterale e vista estesa restano entrambi, con i contenuti da allineare; il pannello laterale e le finestre di modifica non sono ancora stati guardati;
- sulla lapide non c'è un QR: cosa fare delle etichette QR e se la pagina pubblica del QR diventa la pagina del Cittadino (ricerca del defunto dal telefono).

Gli spazi seguono [Regole degli spazi](12-regole-degli-spazi.md), tranne la home. Punto di partenza: [inventario-pagine.md](../inventario-pagine.md), doppioni 7 e 9 e le sezioni Dashboard, Mappa, Scheda e pagina pubblica del QR; [Ruoli e versioni dell'app](05-ruoli-e-versioni.md) per il Cittadino.

Dal ticket [Modello dell'utenza votiva](08-modello-utenza-votiva.md): la Scheda mostra lo stato dell'utenza votiva in sola lettura, anche sul telefono; il flag "Lampada votiva" è calcolato e i campi "Canone lampada votiva" e "Codice utenza" spariscono.

Dal ticket [Semplificazione di Censimento e Nuovo rilievo](16-semplificazione-censimento-e-rilievo.md): il riquadro Censimento della Dashboard porta a Censimento › Avanzamento, che tiene l'indicatore "Schede censite" proprio per questo; "Assegna verifica" resta nella scheda; la mappa non c'è più in Avanzamento, resta in Censimento › Quadranti.

## Comments

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

Oggi la Dashboard ha la mappa e i riquadri Alert, Censimento, Manutenzione e Attività recente (gli ultimi 5 rilievi, con chi e quando). La campanella ha in fondo "Apri il centro alert", che porta alla Dashboard. La card del pin ha "Apri scheda", poi "Parete" (loculi in un colombaio o in una cappella) oppure l'icona delle indicazioni (le altre postazioni), e l'icona della vista estesa. Pannello laterale e vista estesa mostrano già lo stesso contenuto; la vista estesa ha in più due colonne, Precedente e Successiva, "Sulla mappa" in testata (ripetuto tra le azioni), il riquadro del QR e una mappa in fondo. Le azioni della scheda sono otto: Modifica, Modifica GPS, QR Code, Scheda PDF, Segnala, Verifica, Indicazioni, Sulla mappa. La finestra Modifica contiene ancora la concessione (numero, intestatario, date, rinnovi) e la sezione "Fatturazione e pagamenti". La pagina del QR mostra una scheda con tutti i suoi defunti, una mappa, "Portami qui con Google Maps", "Area operatori · scheda completa" e in fondo "Powered by REST IN GPS". Anche il PDF della scheda stampa il QR.

1. **Riquadro Alert della Dashboard.** Proposta: stesso posto e stessa misura, diventa "Agenda di oggi": le operazioni cimiteriali di oggi e di domani (ora, tipo, defunto, postazione, operatori), con il collegamento all'agenda di Operazioni cimiteriali. Uguale per Operatore e Amministratore. Gli alert restano solo nella campanella e "Apri il centro alert" sparisce.
2. **Attività recente.** Proposta: resta per tutti e due i ruoli, com'è.
3. **Tornare alla Dashboard dalla Mappa.** Proposta: mentre si è sulla Mappa, nel menu del computer resta evidenziata la voce "Dashboard"; un clic riporta indietro. Nessun pulsante nuovo.
4. **Card del pin.** Proposta: due pulsanti, "Apri scheda" e "Indicazioni", per tutte le postazioni (anche i loculi in un colombaio). "Parete" e "Vista estesa" escono dalla card: sono già nella scheda ("Vedi nella griglia a parete" e "Vista estesa" in testa al pannello).
5. **Il resto della Mappa.** Proposta: resta com'è: Filtri, Colora per, Quadranti, Elenco (apre Ricerca con gli stessi filtri), legenda cliccabile.
6. **Pannello laterale e vista estesa.** Proposta: stesso contenuto; la vista estesa ha in più solo le due colonne e Precedente / Successiva. Spariscono il riquadro del QR e la mappa in fondo alla vista estesa. In alto restano foto, codice, stato cliccabile e flag: "Lampada votiva" in sola lettura (è calcolato), "Visibile al pubblico" modificabile.
7. **Azioni della scheda.** Proposta: Modifica, Modifica GPS, Scheda PDF, Segnala, Verifica, Indicazioni, Sulla mappa (nascosta quando si è già sulla Mappa). Via "QR Code". Nella testata della vista estesa via "Sulla mappa", che è già tra le azioni.
8. **Sezioni della scheda.** Proposta, in quest'ordine: Defunti, Ubicazione, Concessione, Illuminazione votiva, Pratiche, Manutenzioni e verifiche, campi configurabili, Note, Storico. Concessione e Illuminazione votiva sono riassunti in sola lettura (stato, concessionario o abbonato, scadenza o punti luce) con il collegamento alla pagina, che sul telefono non c'è. La sezione "Fatturazione e pagamenti" sparisce dalla scheda.
9. **Finestra Modifica e altre finestre.** Proposta: la concessione esce dalla finestra Modifica: si crea e si cambia solo in Concessioni. Restano i sottotitoli che dicono una conseguenza ("Segnala manutenzione"); via quelli di "Assegna una verifica" e "Modifica GPS".
10. **Parole.** Proposta: nella scheda, nel pannello e nelle finestre "manufatto" diventa "postazione" (per esempio "Stato della postazione") e "Intestatario" diventa "Concessionario", come nel glossario.
11. **QR.** Proposta: sparisce del tutto: azione "QR Code" e la sua finestra, riquadro del QR, QR nel PDF della scheda, etichette QR e l'indirizzo `/qr/`.
12. **Pagina del Cittadino.** Proposta: nasce dalla pagina del QR. In alto il logo e la casella "Cerca un defunto". Il risultato è per defunto: foto della lapide, nome e date, dove si trova (cimitero, viale, struttura, fila e colonna), piccola mappa, "Portami qui con Google Maps". Gli altri defunti della stessa postazione non compaiono. Spariscono "Area operatori · scheda completa", la scritta REST IN GPS e la mascotte. Sul computer è la stessa pagina, in una colonna al centro.
13. **Quali cimiteri.** Proposta: il Cittadino cerca in tutti i cimiteri del Comune senza sceglierne uno prima; l'elenco dei risultati mostra nome, anni, cimitero e viale.
14. **Uscita nella demo.** Proposta: in fondo alla pagina del Cittadino un collegamento discreto "Area riservata" riporta a "Entra come".
