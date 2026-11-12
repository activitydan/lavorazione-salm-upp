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

**Risposta di Dan**: sì a tutte.

Nota: il giro 1 del ticket "Pagamenti simulati" proponeva "lettera di scadenza", con utenze votive e PEC. Qui Dan ha scelto "avviso di scadenza", senza utenze votive e senza PEC; la sessione di quel ticket è stata avvisata.

### Giro 2 (2026-11-12): domande a Dan

11. **Destinatario per le esumazioni e le estumulazioni dovute**: fossa a fine turno → il richiedente della pratica di inumazione, se c'è; concessione chiusa con la postazione ancora occupata → l'ultimo concessionario (il rappresentante). Se non c'è nessuno, la riga dice "Nessun destinatario" (vedi 15). Proposta: sì.
12. **Copia all'abbonato**: se sulla postazione c'è un'utenza votiva attiva e l'abbonato è un'altra persona, anche l'abbonato riceve l'avviso di scadenza nello stesso lotto, perché la sua luce si spegnerà con la concessione. Proposta: sì.
13. **Contenuto dell'avviso per esumazioni ed estumulazioni**: come quello della concessione, ma dice da quando si farà l'operazione, che si può scegliere dove vanno i resti (ossario comune, cinerario comune, altra postazione, fuori Comune), entro quando contattare l'ufficio, e che senza risposta i resti vanno nell'ossario comune. Proposta: sì.
14. **Rinnovo e pagamento**: l'avviso di scadenza non contiene un avviso di pagamento. Dice la tariffa del rinnovo, se esiste in Amministrazione; l'avviso di pagamento nasce quando l'ufficio registra il rinnovo (ticket "Pagamenti simulati"). Proposta: sì.
15. **Non consegnato**: si corregge l'indirizzo e si reinvia, in un nuovo lotto e anche con un altro canale. Se un indirizzo non c'è, "Stampa per l'affissione": l'avviso da attaccare sulla postazione, con la riga "Affisso il …" nello storico. Proposta: sì.
16. **Dove si vede**: in "Scadenze e pagamenti" la linguetta "Invii DAT" elenca i lotti (numero, data, canale, operatore, quanti consegnati, notificati e non consegnati, etichetta "Simulato"); aprendo un lotto si vedono i suoi invii con esito, data e prova. Nello scadenzario ogni riga mostra l'ultimo avviso e il suo esito. Lo storico della concessione riceve la riga "Avviso di scadenza – Consegnato il …". Proposta: sì.
17. **Alert**: chi ha inviato il lotto riceve nella sua campanella un alert solo se ci sono invii non consegnati ("Lotto 12: 2 non consegnati"). Proposta: sì.
18. **Diffida di decadenza**: quando si avvia la decadenza di una concessione, la diffida parte tramite DAT con Notifica Certa già scelta. Testo fisso. Proposta: sì.
19. **Glossario**: entrano **Invio** (una lettera affidata a DAT per un destinatario), **Lotto** (gli invii affidati a DAT in una volta, con lo stesso canale), **Esito** (consegnato, notificato, non consegnato) e **Notifica** (solo la consegna formale con il messo; la campanella mostra alert, non notifiche). "Da inviare" resta solo per il lavoro fatto senza rete: un invio DAT non ha mai quello stato. Proposta: sì.
