# Avvisi di scadenza inviati da DAT

Type: grilling
Status: open
Assignee: Dan
Blocked by: 03, 07, 08

## Question

Come funziona, in simulazione, l'invio degli avvisi di scadenza tramite DAT?

Da decidere: da dove si parte (scadenzario delle concessioni e delle utenze votive), cosa contiene un avviso, quali canali si mostrano (stampa, spedizione, notifica), quali stati ha un invio e come si rende chiaro che l'invio è simulato.

Dal ticket "Struttura del menu": gli avvisi stanno nella voce "Scadenze e pagamenti", nello stesso giro scadenza → avviso → pagamento → sollecito. Lo scadenzario è uno solo per concessioni e utenze votive. Attenzione al nome: "avviso" indica anche l'avviso di pagamento pagoPA (ticket "Pagamenti simulati").

Dal ticket "Modello di pratiche e operazioni": nello scadenzario unico entrano anche le esumazioni e le estumulazioni dovute (fosse a fine turno, postazioni con la concessione chiusa ma ancora occupate); da lì si aprono le pratiche d'ufficio. La campanella degli alert è personale: nessuno riceve alert generali sulle scadenze.

Dal ticket "Modello dell'utenza votiva": per l'illuminazione votiva il destinatario è l'**abbonato**, all'indirizzo per la bolletta se diverso dalla residenza. Il canone si paga ogni anno solare, in anticipo.

## Comments

### Giro 1 (2026-11-12): domande a Dan

Oggi l'app ha solo Report › Scadenze concessioni (elenco per periodo, Excel e un pulsante che crea un alert "Preparare le comunicazioni"). Nessun invio.

1. **Nome**: "Avviso di scadenza" è la lettera che il Comune manda tramite DAT per dire che una concessione o un turno sta per finire e cosa fare. "Avviso" da solo non si usa; il nome dell'avviso di pagamento pagoPA lo decide il ticket "Pagamenti simulati". Proposta: sì.
2. **Cosa riceve un avviso di scadenza**: le concessioni in scadenza e le esumazioni o estumulazioni dovute. Le utenze votive no: non scadono, e ogni anno l'abbonato riceve l'avviso di pagamento del canone, spedito nello stesso modo (punto 3). Proposta: sì.
3. **Un solo modo di spedire**: l'invio tramite DAT è lo stesso per avvisi di scadenza, avvisi di pagamento, solleciti e diffide. Qui si decide come funziona; "Pagamenti simulati" decide quali lettere di pagamento lo usano. Proposta: sì.
4. **Da dove parte**: dallo scadenzario di "Scadenze e pagamenti". Si spuntano una o più righe, "Invia tramite DAT", si sceglie il canale, si vede l'anteprima, si conferma. Nasce un **lotto**: le lettere affidate a DAT in una volta. Niente invio automatico; filtro pronto "Senza avviso". Proposta: sì.
5. **Destinatario per la concessione**: un avviso per concessione, al rappresentante o all'unico concessionario; per un ente, al legale rappresentante all'indirizzo dell'ente. Proposta: sì.
6. **Canali**: i tre servizi di DAT con i loro nomi: Posta Certa (proposta per gli avvisi di scadenza), Raccomandata Certa (ricevuta di ritorno), Notifica Certa (messo). Un canale per lotto. Niente PEC, app IO, SEND. Proposta: sì.
7. **Esiti**: ogni invio passa da "In lavorazione" (DAT stampa e imbusta) a "Spedito", poi a "Consegnato" (posta e raccomandata), "Notificato" (messo) oppure "Non consegnato" con il motivo (irreperibile, indirizzo errato, destinatario deceduto, rifiutato). Ogni esito ha la data e una prova finta da aprire: tracciamento, ricevuta di ritorno, relata di notifica. Proposta: sì.
8. **Simulazione**: gli esiti arrivano da soli pochi secondi dopo la conferma, quasi tutti consegnati e circa uno su dieci non consegnato. Si vede che è finto: frase "Simulazione: nessuna lettera parte davvero" nella finestra di invio, etichetta "Simulato" su ogni lotto, filigrana "Fac-simile" sui PDF. Nei dati finti, qualche lotto dei mesi passati. Proposta: sì.
9. **Contenuto dell'avviso per una concessione**: PDF A4 con stemma e ufficio del Comune, destinatario, oggetto ("Scadenza della concessione del loculo … – Cimitero …"), postazione e defunti, data di scadenza, come rinnovare (durata, entro quando, ufficio e contatti), cosa succede se non si rinnova, numero e data dell'avviso; in fondo "Una soluzione DAT | HYA Group". Testo fisso, non modificabile nella demo. Proposta: sì.
10. **Chi lo usa**: Operatore e Amministratore, solo dal computer. Proposta: sì.
