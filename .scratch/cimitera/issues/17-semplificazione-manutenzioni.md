# Semplificazione di Manutenzioni

Type: grilling
Status: resolved
Assignee: Dan
Blocked by: 06, 09, 12

## Question

Cosa si toglie e cosa si unisce in Manutenzioni?

Da decidere:

- la linguetta Mappa diventa un pulsante "Vedi sulla mappa" che apre la Mappa filtrata?
- l'elenco a card arriva a 32,5 schermate sul telefono e 5,9 sul computer: pagine da 25 o un limite;
- servono tutti e quattro i filtri (ricerca, stato, priorità, categoria);
- "Crea alert": la campanella è personale, quindi a chi va l'alert.

Gli spazi seguono [Regole degli spazi](12-regole-degli-spazi.md). Punto di partenza: [inventario-pagine.md](../inventario-pagine.md), doppione 6 e la sezione Manutenzioni; [Modello di pratiche e operazioni](09-modello-pratiche-e-operazioni.md) per la campanella.

## Comments

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

Oggi Manutenzioni ha: in alto "Excel" (scarica tutte le manutenzioni, anche quelle nascoste dai filtri) e "Segnala manutenzione"; tre linguette, Elenco, Calendario (il mese, con la lista "Da pianificare") e Mappa. L'elenco è a card con la foto, quattro filtri (ricerca, stato, priorità, categoria) e nessuna pagina. Il dettaglio ha Apri scheda, Crea alert, Pianifica, Avvia lavori e Risolvi (con foto obbligatoria). Stati: aperta, pianificata, in corso, risolta. Quando si pianifica si sceglie la data e una squadra (Squadra edile, Squadra verde, Elettricista lampade votive, Ditta esterna): nessuna persona è assegnata. "Crea alert" manda l'alert a tutti gli operatori. Dati finti: 105 manutenzioni, 77 non risolte; 11 hanno la fonte "Segnalazione cittadino".

1. **Mappa.** Proposta: la linguetta Mappa sparisce; in alto c'è "Vedi sulla mappa", che apre la Mappa con il filtro di stato "Da manutenzionare" (le schede con una manutenzione non risolta).
2. **Calendario.** Proposta: resta una linguetta di Manutenzioni, con il mese e la lista delle manutenzioni da programmare, solo sul computer. Non entra nell'agenda di Operazioni cimiteriali, che resta per le pratiche.
3. **A chi è assegnata.** Proposta: quando si programma si scelgono la data e uno o più operatori, come nelle pratiche; la squadra sparisce, anche dall'elenco nelle Impostazioni. In alternativa: resta la squadra e si aggiunge un operatore responsabile.
4. **Stati.** Proposta: aperta → programmata → risolta (con la foto), oppure annullata con il motivo (doppione, segnalazione sbagliata). Spariscono "In corso" e "Avvia lavori"; "pianificata" diventa "programmata", come nelle pratiche.
5. **Crea alert.** Proposta: il pulsante sparisce. Gli alert delle manutenzioni arrivano da soli, solo alle persone coinvolte; quali e a chi si decide nel prossimo giro.
6. **Filtri.** Proposta: restano ricerca, stato e categoria; sparisce la priorità, perché l'elenco è già ordinato per priorità e ogni card la mostra.
7. **Elenco lungo.** Proposta: card con la foto come oggi, 25 per pagina, con la stessa barra delle pagine di Ricerca: circa 2 schermate sul computer invece di 6. Il telefono si vede nel prossimo giro.
8. **Esporta.** Proposta: "Excel" diventa "Esporta" e scarica l'Excel dell'elenco con i filtri attivi, scrivendo quante sono ("Esporta 77"). Solo sul computer.
9. **Chi l'ha segnalata.** Proposta: sparisce il campo "fonte" (App rilievo, Ufficio, Segnalazione cittadino); resta "Segnalata da", cioè l'operatore che l'ha registrata. Il Cittadino non usa l'app per segnalare: se telefona, l'ufficio registra la segnalazione. Le 11 segnalazioni finte del cittadino diventano dell'ufficio.
10. **Manutenzione nel glossario.** Proposta: "Un problema da riparare su una postazione (lapide danneggiata, infiltrazioni, lampada votiva guasta…), dalla segnalazione alla foto dopo il lavoro." Da evitare: ticket, intervento, guasto (da solo).

### 2026-11-12 · risposte di Dan al primo giro

Sì a tutte e dieci le proposte. "Manutenzione" è entrata nel glossario.

### 2026-11-12 · secondo giro di domande, in attesa delle risposte di Dan

11. **Alert.** Proposta: agli operatori assegnati arrivano nuova assegnazione (o assegnazione tolta), manutenzione di oggi o di domani, data cambiata, annullata. A chi l'ha segnalata arrivano risolta e annullata. Una segnalazione nuova non manda alert a nessuno, nemmeno se urgente: le urgenti stanno in cima all'elenco e alla lista da programmare.
12. **Numero nel menu.** Proposta: il numero accanto a Manutenzioni conta le mie manutenzioni non risolte (assegnate a me), non più tutte le aperte. Vale anche sul telefono.
13. **Elenco sul telefono.** Proposta: interruttore "Mie / Tutte", che parte da "Mie"; card piccole (foto a sinistra, categoria, scheda e viale, priorità, data); 25 per pagina; in alto "Segnala" e "Vedi sulla mappa". Niente Calendario né Esporta.
14. **Azioni sul telefono.** Proposta: nel dettaglio solo Apri scheda e Risolvi, con la foto scattata sul posto. Programma e Annulla solo sul computer.
15. **Dati finti.** Proposta: le 16 "in corso" diventano programmate; ogni programmata ha uno o due operatori; 5 annullate con il motivo; ogni operatore finto ha almeno 3 manutenzioni assegnate, così la campanella di chi entra ha qualcosa.

### 2026-11-12 · risposte di Dan al secondo giro

Sì a tutte e cinque le proposte.

## Answer

Risolto il 2026-11-12.

- **Com'è fatta la pagina**: titolo "Manutenzioni", senza frase sotto; in alto a destra "Vedi sulla mappa", "Esporta" e "Segnala manutenzione"; due linguette, Elenco e Calendario.
- **Mappa**: la linguetta sparisce. "Vedi sulla mappa" apre la Mappa con il filtro di stato "Da manutenzionare" (le schede con una manutenzione non risolta).
- **Elenco**: card con la foto come oggi, ordinate per priorità; 25 per pagina, con la barra delle pagine di Ricerca. Filtri: ricerca, stato e categoria; il filtro priorità sparisce.
- **Calendario**: resta in Manutenzioni, solo sul computer, con il mese e la lista "Da programmare". È separato dall'agenda di Operazioni cimiteriali.
- **Stati**: aperta → programmata → risolta, oppure annullata con il motivo (doppione, segnalazione sbagliata). Per risolvere serve la foto, che diventa la foto della scheda. Spariscono "In corso" e "Avvia lavori"; "pianificata" diventa "programmata", come nelle pratiche.
- **Assegnazione**: quando si programma si scelgono la data e uno o più operatori, almeno uno, come nelle pratiche. La squadra sparisce, anche dall'elenco nelle Impostazioni.
- **Segnalata da**: l'operatore che ha registrato la manutenzione, con la data. Il campo "fonte" sparisce. Il Cittadino non segnala dall'app: se telefona, la segnalazione la registra l'ufficio.
- **Dettaglio sul computer**: Apri scheda, Programma (o Riprogramma), Annulla, Risolvi. "Crea alert" sparisce.
- **Alert**, solo nella campanella personale. Agli operatori assegnati: nuova assegnazione o assegnazione tolta, manutenzione di oggi o di domani, data cambiata, annullata. A chi l'ha segnalata: risolta e annullata. Una segnalazione nuova non manda alert a nessuno, nemmeno se urgente: le urgenti stanno in cima all'elenco e alla lista da programmare.
- **Numero nel menu**: accanto a Manutenzioni, le mie manutenzioni non risolte (assegnate a me), anche sul telefono.
- **Esporta**: scarica l'Excel dell'elenco con i filtri attivi e scrive quante sono ("Esporta 77"). Solo sul computer.
- **Telefono**: interruttore "Mie / Tutte", che parte da "Mie"; card piccole (foto a sinistra, categoria, scheda e viale, priorità, data); 25 per pagina; in alto "Segnala" e "Vedi sulla mappa"; niente Calendario né Esporta. Nel dettaglio solo Apri scheda e Risolvi, con la foto scattata sul posto. Programma e Annulla solo dal computer.
- **Parole**: nella finestra Risolvi "manufatto" diventa "postazione", come nel glossario. "Manutenzione" entra nel glossario.
- **Dati finti**: le 16 "in corso" diventano programmate; ogni programmata ha uno o due operatori; 5 annullate con il motivo; ogni operatore finto ha almeno 3 manutenzioni assegnate; le 11 segnalazioni del cittadino diventano dell'ufficio.
- **Altri ticket**: le squadre escono dalle Impostazioni ([Semplificazione di Impostazioni e Amministrazione](18-semplificazione-impostazioni.md)); nel riquadro Manutenzione della Dashboard "in corso" sparisce ([Semplificazione di Dashboard, Mappa, Scheda e pagina del QR](19-semplificazione-dashboard-mappa-scheda-qr.md)). Il guasto della lampada votiva resta una manutenzione con la categoria "Lampada votiva guasta" ([Modello dell'utenza votiva](08-modello-utenza-votiva.md)).
