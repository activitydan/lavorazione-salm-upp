# Avvisi di scadenza inviati da DAT

Type: grilling
Status: resolved
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

**Risposta di Dan**: sì a tutte.

Conflitto da sciogliere: nel ticket "Pagamenti simulati" Dan ha accettato anche "**lettera di scadenza**" (con "avviso di scadenza" da evitare, per concessioni e utenze votive), già scritta nel GLOSSARY.md. Le domande 11 e 12 lo risolvono.

### Giro 2 (2026-11-12): domande a Dan

11. **Un nome solo**: si chiama "**lettera di scadenza**", come già nel glossario, e non "avviso di scadenza". "Avviso" resta solo per l'avviso di pagamento, così "l'avviso" non vuol dire mai due cose; anche solleciti e diffide sono lettere. Proposta: sì.
12. **Utenze votive**: resta il punto 2: la lettera di scadenza vale per le concessioni e per le esumazioni e le estumulazioni dovute, non per le utenze votive (che ricevono ogni anno l'avviso di pagamento del canone). La voce del glossario si corregge così. Proposta: sì.
13. **Destinatario per le esumazioni e le estumulazioni dovute**: fossa a fine turno → il richiedente della pratica di inumazione, se c'è; concessione chiusa con la postazione ancora occupata → l'ultimo concessionario (il rappresentante). Se non c'è nessuno, la riga dice "Nessun destinatario" (vedi 17). Proposta: sì.
14. **Copia all'abbonato**: se sulla postazione c'è un'utenza votiva attiva e l'abbonato è un'altra persona, anche l'abbonato riceve la lettera di scadenza nello stesso lotto, perché la sua luce si spegnerà con la concessione. Proposta: sì.
15. **Contenuto della lettera per esumazioni ed estumulazioni**: come quella della concessione, ma dice da quando si farà l'operazione, che si può scegliere dove vanno i resti (ossario comune, cinerario comune, altra postazione, fuori Comune), entro quando contattare l'ufficio, e che senza risposta i resti vanno nell'ossario comune. Proposta: sì.
16. **Rinnovo e pagamento**: la lettera di scadenza non contiene un avviso di pagamento. Dice la tariffa del rinnovo, presa da Amministrazione; l'avviso di pagamento nasce quando l'ufficio registra il rinnovo (ticket "Pagamenti simulati", domanda 5). Proposta: sì.
17. **Non consegnato**: si corregge l'indirizzo e si reinvia, in un nuovo lotto e anche con un altro canale. Se un indirizzo non c'è, "Stampa per l'affissione": la lettera da attaccare sulla postazione, con la riga "Affissa il …" nello storico. Proposta: sì.
18. **Dove si vede**: in "Scadenze e pagamenti" la linguetta "Invii DAT" elenca i lotti (numero, data, canale, operatore, quanti consegnati, notificati e non consegnati, etichetta "Simulato"); aprendo un lotto si vedono i suoi invii con esito, data e prova. Nello scadenzario ogni riga mostra l'ultima lettera e il suo esito. Lo storico della concessione riceve la riga "Lettera di scadenza tramite DAT – consegnato il …". Proposta: sì.
19. **Alert**: chi ha inviato il lotto riceve nella sua campanella un alert solo se ci sono invii non consegnati ("Lotto 12: 2 non consegnati"). Proposta: sì.
20. **Diffida di decadenza**: quando si avvia la decadenza di una concessione, la diffida parte tramite DAT con Notifica Certa già scelta. Testo fisso. Proposta: sì.
21. **Glossario**: entrano **Invio** (una lettera affidata a DAT per un destinatario, con il suo esito), **Lotto** (gli invii affidati a DAT in una volta, con lo stesso canale), **Esito** (consegnato, notificato, non consegnato) e **Notifica** (solo la consegna formale con il messo; la campanella mostra alert, non notifiche). "Da inviare" resta solo per il lavoro fatto senza rete: un invio DAT non ha mai quello stato. Proposta: sì.

**Risposta di Dan**: sì a tutte. Con il nome "lettera di scadenza", il filtro del punto 4 diventa "Senza lettera".

## Answer

Risolto il 2026-11-12.

- **Nome**: **lettera di scadenza**, la lettera che il Comune manda tramite DAT per dire che una concessione sta per scadere o che una postazione va liberata, e cosa fare. "Avviso" resta solo per l'**avviso di pagamento** pagoPA (ticket "Pagamenti simulati"). Il titolo di questo ticket resta com'è.
- **Per cosa**: concessioni in scadenza ed esumazioni o estumulazioni dovute (fosse a fine turno, concessioni chiuse con la postazione ancora occupata). Non per le utenze votive: l'abbonato riceve ogni anno l'avviso di pagamento del canone.
- **Invio tramite DAT**: uno solo per tutte le lettere: lettere di scadenza, avvisi di pagamento, solleciti, diffide. Quali lettere di pagamento passano da DAT lo decide "Pagamenti simulati".
- **Da dove parte**: dallo scadenzario di "Scadenze e pagamenti". Si spuntano una o più righe, "Invia tramite DAT", si sceglie il canale, si vede l'anteprima, si conferma: nasce un **lotto**. Niente invio automatico; filtro pronto "Senza lettera".
- **Destinatari**: una lettera per concessione, al rappresentante o all'unico concessionario; per un ente, al legale rappresentante all'indirizzo dell'ente. Fossa a fine turno: il richiedente della pratica di inumazione, se c'è. Concessione chiusa con la postazione occupata: l'ultimo concessionario (il rappresentante). Se non c'è nessuno, la riga dice "Nessun destinatario". Se sulla postazione c'è un'utenza votiva attiva con un abbonato diverso, anche l'abbonato riceve la lettera, nello stesso lotto.
- **Canali**: i servizi di DAT con i loro nomi: Posta Certa (proposta per le lettere di scadenza), Raccomandata Certa (ricevuta di ritorno), Notifica Certa (messo). Un canale per lotto. Niente PEC, app IO, SEND.
- **Esiti**: In lavorazione → Spedito → Consegnato (posta e raccomandata), Notificato (messo) oppure Non consegnato, con il motivo (irreperibile, indirizzo errato, destinatario deceduto, rifiutato). Ogni esito ha la data e una prova finta da aprire: tracciamento, ricevuta di ritorno, relata di notifica.
- **Non consegnato**: si corregge l'indirizzo e si reinvia, in un nuovo lotto e anche con un altro canale. Se un indirizzo non c'è, "Stampa per l'affissione": la lettera da attaccare sulla postazione, con la riga "Affissa il …" nello storico.
- **Contenuto**: PDF A4, testo fisso per tipo, non modificabile nella demo. Per la concessione: stemma e ufficio del Comune, destinatario, oggetto ("Scadenza della concessione del loculo … – Cimitero …"), postazione e defunti, data di scadenza, come rinnovare (durata, entro quando, tariffa del rinnovo presa da Amministrazione, ufficio e contatti), cosa succede se non si rinnova, numero e data della lettera; in fondo "Una soluzione DAT | HYA Group". Per esumazioni ed estumulazioni: da quando si farà l'operazione, dove possono andare i resti (ossario comune, cinerario comune, altra postazione, fuori Comune), entro quando contattare l'ufficio, e che senza risposta i resti vanno nell'ossario comune.
- **Pagamento**: la lettera di scadenza non contiene un avviso di pagamento; l'avviso nasce quando l'ufficio registra il rinnovo.
- **Diffida di decadenza**: quando si avvia la decadenza di una concessione, la diffida parte tramite DAT con Notifica Certa già scelta. Testo fisso.
- **Simulazione**: gli esiti arrivano da soli pochi secondi dopo la conferma, quasi tutti consegnati e circa uno su dieci non consegnato. Frase "Simulazione: nessuna lettera parte davvero" nella finestra di invio, etichetta "Simulato" su ogni lotto, filigrana "Fac-simile" sui PDF.
- **Dove si vede**: in "Scadenze e pagamenti" la linguetta "Invii DAT" elenca i lotti (numero, data, canale, operatore, quanti consegnati, notificati e non consegnati, "Simulato"); dentro un lotto, i suoi invii con esito, data e prova. Nello scadenzario ogni riga mostra l'ultima lettera e il suo esito. Lo storico della concessione riceve la riga "Lettera di scadenza tramite DAT – consegnato il …".
- **Alert**: chi ha inviato il lotto riceve nella sua campanella un alert solo se ci sono invii non consegnati ("Lotto 12: 2 non consegnati").
- **Chi**: Operatore e Amministratore, solo dal computer.
- **Dati finti**: qualche lotto dei mesi passati, con esiti misti.
- **Glossario**: corretta "Lettera di scadenza"; nuove Invio, Lotto, Esito, Notifica. "Da inviare" resta solo per il lavoro fatto senza rete.

### Aggiornamento del 2026-11-12 (pagamenti)

Dal ticket [Pagamenti simulati](10-pagamenti-simulati.md): tramite DAT passano gli avvisi di pagamento dei canoni dell'anno, i solleciti e le diffide; gli altri avvisi di pagamento (nuova concessione, rinnovo, allaccio, pratica) si stampano e si consegnano allo sportello.
