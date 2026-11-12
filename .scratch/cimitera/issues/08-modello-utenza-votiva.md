# Modello dell'utenza votiva

Type: grilling
Status: resolved
Assignee: Dan
Blocked by: 02

## Question

Quali dati, stati e azioni ha un'utenza di illuminazione votiva?

Da decidere: i dati dell'intestatario, il legame con la postazione, le azioni (allacciamento, voltura, disdetta, guasto), come nascono le bollette e l'elenco per la fatturazione.

Da decidere anche il nome della persona che chiede il servizio. I regolamenti dicono "utente", "abbonato" o "intestatario"; il glossario sconsiglia "intestatario" e riserva "utente". La ricerca la chiama provvisoriamente "richiedente".

## Comments

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

Nel codice di oggi l'illuminazione votiva è un flag "Lampada votiva" sulla scheda, più i campi "Canone lampada votiva" e "Codice utenza"; tra le categorie di manutenzione c'è già "Lampada votiva guasta" e tra le squadre "Elettricista lampade votive".

1. **Nome della persona.** Proposta: **abbonato**, cioè chi ha un'utenza votiva e ne paga il canone. "Richiedente" resta per chi chiede (una pratica, o un'utenza prima dell'allaccio): dopo una voltura il nuovo abbonato non ha chiesto niente.
2. **Cos'è un'utenza.** Proposta: un'utenza è su una scheda e per un defunto, con un numero di punti luce: 1 di norma, più di 1 solo nelle tombe di famiglia, dove l'utenza può valere per tutta la tomba invece che per un defunto. Al massimo un'utenza attiva per defunto.
3. **Dati dell'abbonato.** Proposta: come il concessionario, persona o ente (nome o denominazione, codice fiscale o partita IVA, indirizzo, recapiti), più l'indirizzo per la bolletta se diverso e il legame con il defunto. Un solo abbonato per utenza. Pulsante "Copia dal concessionario".
4. **Dati dell'utenza.** Proposta: numero e data del contratto, scheda, defunto, abbonato, punti luce, data di allaccio, stato, data e motivo della cessazione, storico delle azioni (data, azione, operatore), come nella concessione.
5. **Stati.** Proposta: da allacciare (contratto firmato, luce non ancora accesa) → attiva → sospesa per morosità (luce spenta, si riaccende pagando il dovuto) → cessata, con motivo: disdetta, morosità, fine della concessione, defunto spostato. I passi della morosità (sollecito, diffida) li decide il ticket "Pagamenti simulati".
6. **Azioni.** Proposta: nuovo allaccio, allaccio eseguito, voltura (nuovo abbonato, con motivo: consenso del precedente o decesso), disdetta (vale dal 1° gennaio dell'anno dopo), sospensione e riallaccio, cessazione. Il cambio d'indirizzo è una semplice modifica dei dati.
7. **Guasto.** Proposta: non è un oggetto nuovo. È una manutenzione con la categoria "Lampada votiva guasta", che esiste già: dall'utenza il pulsante "Segnala guasto" apre la segnalazione con categoria e scheda già scelte.
8. **Fine automatica.** Proposta: CimiTera chiude da sola l'utenza quando la concessione della postazione si chiude (motivo "fine della concessione") e quando una pratica eseguita toglie il defunto dalla postazione (motivo "defunto spostato"). Per la traslazione la pratica chiede se spostare l'utenza sulla nuova postazione o chiuderla.
9. **Importi e fatturazione.** Proposta: canone annuo per punto luce e contributo di allaccio stanno in Amministrazione (demo: 24 € e 15 €, come Ragusa). All'allaccio si addebitano allaccio e dodicesimi del canone fino al 31 dicembre; ogni anno un pulsante "Emetti i canoni dell'anno" addebita il canone a tutte le utenze attive. Il nome del documento da pagare e i suoi stati li decide il ticket "Pagamenti simulati". L'elenco per la fatturazione è il pulsante Esporta della pagina Illuminazione votiva.
10. **Scheda e telefono.** Proposta: il flag "Lampada votiva" non si spunta più a mano, lo calcola CimiTera dall'utenza attiva; i campi "Canone lampada votiva" e "Codice utenza" spariscono dalla scheda. La scheda mostra lo stato dell'utenza in sola lettura, anche sul telefono.
11. **Gestione e Cittadino.** Proposta: la demo mostra solo la gestione diretta del Comune, come a Ragusa, senza gestore esterno. Il Cittadino non segnala guasti: la sua pagina resta solo ricerca.
12. **Dati finti.** Proposta: un'utenza per ogni scheda che oggi ha il flag "Lampada votiva", con qualche voltura, qualche utenza sospesa per morosità, qualche disdetta e qualche cessata a fine concessione.


### 2026-11-12 · risposte di Dan al primo giro

Sì a tutte e dodici le proposte.

## Answer

Risolto il 2026-11-12.

- **Abbonato**: chi ha un'utenza votiva e ne paga il canone. Persona o ente, come il concessionario (nome o denominazione, codice fiscale o partita IVA, indirizzo, recapiti), più l'indirizzo per la bolletta se diverso e il legame con il defunto. Uno solo per utenza; pulsante "Copia dal concessionario". "Richiedente" resta per chi chiede il servizio prima dell'allaccio.
- **Utenza votiva**: su una scheda e per un defunto, con un numero di punti luce. 1 di norma; più di 1 solo nelle tombe di famiglia, dove l'utenza può valere per tutta la tomba invece che per un defunto. Al massimo un'utenza attiva per defunto.
- **Dati dell'utenza**: numero e data del contratto, scheda, defunto, abbonato, punti luce, data di allaccio, stato, data e motivo della cessazione, storico delle azioni (data, azione, operatore).
- **Stati**: da allacciare (contratto firmato, luce non ancora accesa) → attiva → sospesa per morosità (luce spenta, si riaccende pagando il dovuto) → cessata, con motivo: disdetta, morosità, fine della concessione, defunto spostato.
- **Azioni**: nuovo allaccio, allaccio eseguito, voltura (nuovo abbonato, con motivo: consenso del precedente o decesso), disdetta (vale dal 1° gennaio dell'anno dopo), sospensione e riallaccio, cessazione. Il cambio d'indirizzo è una modifica dei dati. Ogni azione scrive una riga nello storico.
- **Guasto**: è una manutenzione con la categoria "Lampada votiva guasta", che esiste già. Dall'utenza il pulsante "Segnala guasto" apre la segnalazione con categoria e scheda già scelte.
- **Fine automatica**: CimiTera chiude da sola l'utenza quando si chiude la concessione della postazione (motivo "fine della concessione") e quando una pratica eseguita toglie il defunto dalla postazione (motivo "defunto spostato"). Nella traslazione la pratica chiede se spostare l'utenza sulla nuova postazione o chiuderla.
- **Importi**: canone annuo per punto luce e contributo di allaccio stanno in Amministrazione (demo: 24 € e 15 €, come Ragusa). All'allaccio si addebitano allaccio e dodicesimi del canone fino al 31 dicembre; il pulsante "Emetti i canoni dell'anno" addebita il canone a tutte le utenze attive. Documento da pagare, stati del pagamento, sollecito e diffida: ticket "Pagamenti simulati".
- **Fatturazione**: l'elenco per la fatturazione è il pulsante Esporta della pagina Illuminazione votiva.
- **Scheda**: il flag "Lampada votiva" non si spunta più a mano, lo calcola CimiTera dall'utenza attiva. I campi "Canone lampada votiva" e "Codice utenza" spariscono dalla scheda. La scheda mostra lo stato dell'utenza in sola lettura, anche sul telefono.
- **Gestione**: solo gestione diretta del Comune, come a Ragusa, senza gestore esterno. Il Cittadino non segnala guasti.
- **Dati finti**: un'utenza per ogni scheda che oggi ha il flag "Lampada votiva", con qualche voltura, qualche utenza sospesa per morosità, qualche disdetta e qualche cessata a fine concessione.
- **Aperto altrove**: nel Nuovo rilievo il flag non si può più spuntare; cosa fare quando sul campo c'è una lampada ma nessuna utenza è una domanda del ticket "Semplificazione di Censimento e Nuovo rilievo".
