# Semplificazione di Censimento e Nuovo rilievo

Type: grilling
Status: open
Assignee: Dan
Blocked by: 05, 06, 09, 12

## Question

Cosa si toglie e cosa si unisce in Censimento e in Nuovo rilievo?

Da decidere:

- Avanzamento: togliere la mappa (c'è già in Quadranti) e l'indicatore "Schede censite" (già nella Dashboard)? "Operatori sul campo" è un doppione della linguetta Operatori;
- Operatori: diventa un elenco in sola lettura per assegnare le verifiche; aggiungere e togliere operatori sta in Amministrazione;
- dove va Statistiche, che arriva da Report;
- Verifiche (7,7 schermate sul computer, 13,8 sul telefono) e Colombari e cappelle (4,7 e 25,1): pagine da 25 righe o scorrimento dentro il riquadro;
- sul telefono le linguette escono dallo schermo (806 px): quali restano per chi lavora sul campo;
- Nuovo rilievo: unire i flag dentro l'anagrafica per scendere da sei a cinque passi.

Gli spazi seguono [Regole degli spazi](12-regole-degli-spazi.md). Punto di partenza: [inventario-pagine.md](../inventario-pagine.md), doppioni 5, 6 e 8 e le sezioni Censimento e Nuovo rilievo; [Struttura del menu](06-struttura-del-menu.md) e [Ruoli e versioni dell'app](05-ruoli-e-versioni.md) per il telefono.

Dal ticket [Modello dell'utenza votiva](08-modello-utenza-votiva.md): il flag "Lampada votiva" ora lo calcola CimiTera dall'utenza attiva e non si spunta più a mano. Da decidere qui: nel Nuovo rilievo, cosa fa l'operatore quando sul campo vede una lampada ma la scheda non ha un'utenza (o il contrario).

Dal ticket [Semplificazione di Ricerca](15-semplificazione-ricerca.md): arrivano qui, con Statistiche, i conteggi delle postazioni libere per tipologia e per struttura (oggi in Report › Postazioni libere); in Ricerca le postazioni libere si trovano col filtro di stato "Libero". In Ricerca gli elenchi hanno 50 righe per pagina.

## Comments

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

Oggi Censimento ha in alto "Assegna verifica" e cinque linguette: Avanzamento (quattro indicatori, grafico delle schede al giorno, mappa dei quadranti, tabella per quadrante, card "Operatori sul campo"), Quadranti, Operatori (con "Nuovo operatore" e "Modifica"), Verifiche (con un altro "Assegna verifica"), Colombari e cappelle (card con la griglia in miniatura). Report › Statistiche ha la ciambella degli stati, le barre delle tipologie e un riepilogo per quadrante. Censimento non è nel menu del telefono: sul telefono ci sono solo Nuovo rilievo e la voce Verifiche. Nuovo rilievo ha sei passi; il quinto, "Flag e dati", ora ha solo i flag Tomba singola, Cappella e Colombaio (doppioni delle tipologie) e le note, perché il flag Lampada votiva è calcolato.

1. **Avanzamento.** Proposta: via la mappa (c'è in Quadranti) e via la card "Operatori sul campo" (i suoi dati vanno nella linguetta Operatori). Restano i quattro indicatori, compreso "Schede censite": il riquadro della Dashboard porta proprio qui, quindi è il dettaglio, non un doppione.
2. **Statistiche.** Proposta: nessuna linguetta nuova, entra in Avanzamento. Accanto al grafico, dove c'era la mappa, i riquadri "Stato delle postazioni" (ciambella) e "Tipologie" (barre, con la parte libera di ogni tipologia). La tabella per quadrante resta una sola, con in più una colonna per ogni stato.
3. **Operatori.** Proposta: elenco in sola lettura con nome, quadranti, schede rilevate, schede di oggi, ultima attività, verifiche aperte e contatti. Spariscono "Nuovo operatore" e "Modifica" (vanno in Amministrazione). Il quadrante si assegna dalla linguetta Quadranti.
4. **"Assegna verifica" doppio.** Proposta: via dall'intestazione della pagina; resta nella linguetta Verifiche, nella barra delle righe selezionate di Ricerca e nella scheda.
5. **Verifiche.** Proposta: sul computer tabella a pagine da 50, con Aperte / Completate come oggi. Sul telefono la voce Verifiche mostra solo le verifiche aperte dell'operatore che è entrato, a card, con "Chiudi".
6. **Colombari e cappelle.** Proposta: le card diventano una tabella a pagine da 50 (nome, tipo, viale, posti, occupati, liberi, percentuale) con i pulsanti Griglia a parete, Scheda e Sulla mappa. La colonna "Liberi" sostituisce i loculi liberi per struttura di Report.
7. **Telefono.** Proposta: Censimento resta solo sul computer, come deciso nel menu; il problema delle linguette che escono dallo schermo non si pone.
8. **Nuovo rilievo in cinque passi.** Proposta: Foto, Posizione, Classificazione, Anagrafica, Riepilogo. Note e campi configurabili vanno in fondo ad Anagrafica. I flag Tomba singola, Cappella e Colombaio si tolgono, perché ripetono la classificazione.
9. **Lampada vista sul campo.** Proposta: nel rilievo la scheda mostra lo stato dell'utenza votiva in sola lettura e una domanda sì/no "C'è una lampada accesa?". Se c'è una lampada ma nessuna utenza, la scheda compare all'ufficio in Illuminazione votiva tra le lampade da controllare; se c'è un'utenza attiva ma la lampada è spenta, CimiTera propone "Segnala guasto".
