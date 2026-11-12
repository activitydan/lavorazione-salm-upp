# Pagamenti simulati

Type: grilling
Status: open
Assignee: Dan
Blocked by: 03, 07, 08

## Question

Cosa si paga in CimiTera e come simuliamo pagoPA?

Da decidere: quali importi esistono (canoni di concessione, canoni votivi, tariffe delle operazioni), come nasce un avviso, quali stati ha un pagamento, come si vedono i morosi, e come si rende chiaro che il collegamento con pagoPA è simulato.

Dal ticket "Struttura del menu": i pagamenti stanno nella voce "Scadenze e pagamenti", insieme agli avvisi di scadenza, per concessioni e illuminazione votiva insieme. Da decidere anche per il glossario: "avviso" indica sia l'avviso di pagamento pagoPA sia l'avviso di scadenza inviato tramite DAT; servono due nomi distinti.

Dal ticket "Modello di pratiche e operazioni": ogni tipo di operazione ha una tariffa, che l'Amministratore cambia nella nuova voce "Amministrazione" (importi della demo inventati); le pratiche d'ufficio non hanno tariffa. La pratica mostra l'importo e l'attestazione di pagamento (pagata sì/no, data, numero), che è il suo unico documento. Anche le durate delle concessioni ora stanno in Amministrazione. La campanella degli alert è personale: i morosi non compaiono più come alert generale, si vedono solo nelle pagine.

Dal ticket "Modello dell'utenza votiva": chi paga il canone votivo è l'**abbonato** (indirizzo per la bolletta se diverso). All'allaccio si addebitano contributo di allaccio e dodicesimi del canone fino al 31 dicembre; ogni anno "Emetti i canoni dell'anno" addebita il canone (per punto luce) a tutte le utenze attive. Canone e allaccio stanno in Amministrazione (demo 24 € e 15 €). L'utenza diventa "sospesa per morosità" (luce spenta) e torna attiva pagando il dovuto: da decidere qui quando scatta la sospensione e quando la morosità porta alla cessazione.

Dal ticket "Semplificazione di Ricerca": la pagina Esportazioni sparisce. L'Excel delle lampade votive per la fatturazione, con il foglio dei morosi, va in Illuminazione votiva; l'Excel delle scadenze delle concessioni va in "Scadenze e pagamenti".

Dal ticket [Semplificazione di Dashboard, Mappa, Scheda e pagina del QR](19-semplificazione-dashboard-mappa-scheda-qr.md): la sezione "Fatturazione e pagamenti" (con "Stato pagamenti") sparisce dalla scheda. La scheda mostra Concessione e Illuminazione votiva come riassunti in sola lettura con il loro stato; da decidere qui se e come quei riassunti mostrano la morosità.

Dal ticket [Avvisi di scadenza inviati da DAT](11-avvisi-di-scadenza.md): il nome è "**lettera di scadenza**", solo per concessioni ed esumazioni o estumulazioni dovute, non per le utenze votive; "avviso" resta per l'avviso di pagamento. Ogni lettera (lettera di scadenza, avviso di pagamento, sollecito, diffida) passa dallo stesso invio tramite DAT: si sceglie da un elenco, nasce un **lotto** con un canale (Posta Certa, Raccomandata Certa o Notifica Certa; niente PEC), ogni invio ha un **esito** (consegnato, notificato, non consegnato) e chi non è stato raggiunto si reinvia o si stampa per l'affissione. La lettera di scadenza indica la tariffa del rinnovo ma non contiene un avviso di pagamento. La diffida di decadenza parte con Notifica Certa già scelta. In "Scadenze e pagamenti" c'è anche la linguetta "Invii DAT"; chi invia un lotto riceve un alert solo per gli invii non consegnati.

## Comments

### Giro 1 (2026-11-12)

1. **Nome del documento pagoPA.** Proposta: si chiama **avviso di pagamento**, come nella documentazione pagoPA. "Avviso" da solo non si usa; niente "bollettino" né "bolletta".
2. **Nome di quello che manda DAT.** Proposta: si chiama **lettera di scadenza**: la lettera, mandata tramite DAT con qualunque canale (posta, raccomandata, messo, PEC), che avvisa che una concessione o un'utenza votiva sta per scadere. Niente "avviso di scadenza".
3. **Cosa si paga.** Proposta: tre cose. Concessione: una **tariffa** alla nuova concessione e una al rinnovo, per tipo di concessione, pagate una volta sola (niente canone annuo della concessione: a Ragusa esiste ma le regole non si trovano). Illuminazione votiva: allaccio con i dodicesimi, poi il canone annuo. Pratica su richiesta: la tariffa del suo tipo di operazione. Le tariffe delle concessioni stanno in Amministrazione accanto alle altre, con importi della demo inventati.
4. **Un avviso, un motivo.** Proposta: ogni avviso di pagamento riguarda una sola cosa (una concessione, un'utenza per un anno, una pratica); può avere più voci dello stesso motivo (allaccio + dodicesimi). Niente avvisi che raccolgono più motivi, niente rate.
5. **Come nasce.** Proposta: lo crea CimiTera da solo con l'azione che lo richiede: nuova concessione, rinnovo, nuovo allaccio, nuova pratica su richiesta, "Emetti i canoni dell'anno". Nessun blocco: l'azione vale subito, il pagamento si segue a parte. Scadenza 30 giorni dopo l'emissione; i 30 giorni stanno in Amministrazione.
6. **Stati.** Proposta: da pagare, scaduto (calcolato dalla data, si può ancora pagare), pagato (data e numero della ricevuta), annullato (con motivo). Se la pratica viene annullata, CimiTera annulla da solo il suo avviso non pagato. L'attestazione di pagamento della pratica diventa lo stato del suo avviso.
7. **Come si vede che è simulato.** Proposta: pulsante "Simula pagamento" sull'avviso (Operatore e Amministratore), che lo porta a pagato con data e numero di ricevuta finti. Il PDF segue il modello ufficiale A4 ma ha la scritta "FAC-SIMILE" e codici finti. In "Scadenze e pagamenti" una riga fissa: "pagoPA simulato: nessun pagamento reale". Si paga solo con pagoPA: niente registrazione a mano di altri pagamenti.

**Risposte di Dan**: sì a tutte e 7. "Tariffa", "Avviso di pagamento" e "Lettera di scadenza" sono nel GLOSSARY.md.

### Giro 2 (2026-11-12)

8. **Chi è moroso.** Proposta: è moroso chi ha almeno un avviso di pagamento scaduto. L'avviso è intestato al rappresentante della concessione (o all'unico concessionario), all'abbonato (all'indirizzo per la bolletta se c'è) o al richiedente della pratica. Il campo "Stato pagamenti" della scheda sparisce, e con lui tutta la sezione "Fatturazione e pagamenti" (gli altri suoi campi spariscono già per il ticket dell'utenza votiva).
9. **Scala della morosità.** Proposta: si va avanti a mano, un passo alla volta, con un pulsante "prossimo passo" che compare quando il termine è passato. Utenza votiva: sollecito → diffida → sospensione per morosità → dopo un anno di sospensione, cessazione per morosità. Concessione: sollecito → avvio della decadenza (che ha già la sua diffida). Pratica: sollecito → diffida, poi basta (la riscossione coattiva è fuori dalla demo). Sollecito e diffida sono lettere che partono tramite DAT come le lettere di scadenza, con un nuovo termine di 30 giorni; i giorni stanno in Amministrazione.
10. **Riaccensione.** Proposta: quando tutti gli avvisi scaduti di un'utenza sospesa sono pagati, l'utenza torna attiva da sola, senza nuovo allaccio. "Emetti i canoni dell'anno" non addebita il canone alle utenze sospese.
11. **Dove si vede.** Proposta: in "Scadenze e pagamenti" due linguette. "Avvisi di pagamento": tutti, con filtri per stato e motivo, ed Esporta. "Morosi": una riga per avviso scaduto, con intestatario, motivo, importo, giorni di ritardo, ultimo passo fatto e pulsante del prossimo passo. Concessione, utenza votiva e pratica mostrano i loro avvisi con lo stato, il PDF e "Simula pagamento"; concessionario e abbonato morosi hanno l'etichetta "Moroso", che compare anche nei riassunti Concessione e Illuminazione votiva della scheda (anche sul telefono, in sola lettura). Avvisi e pagamenti solo dal computer; il Cittadino non vede niente.
12. **Cosa passa da DAT.** Proposta: partono tramite DAT gli avvisi di pagamento dei canoni dell'anno, i solleciti e le diffide. Gli altri avvisi di pagamento (nuova concessione, rinnovo, allaccio, pratica) si stampano e si consegnano allo sportello, perché la persona è in ufficio. Come si spedisce (lotti, canali, esiti) lo decide il ticket "Avvisi di scadenza inviati da DAT".
13. **Rimborsi.** Proposta: un avviso pagato resta pagato anche se poi la pratica viene annullata o la concessione rinunciata. I rimborsi sono fuori dalla demo.
14. **Nome della lettera di DAT, di nuovo.** Nel giro 1 hai detto sì a "lettera di scadenza" qui e sì ad "avviso di scadenza" nel ticket "Avvisi di scadenza inviati da DAT", che lo usa già in tutte le domande. Lì hai anche deciso che riguarda concessioni e turni (non le utenze votive) e niente PEC. Proposta: si tiene **avviso di scadenza**; i due nomi restano distinti perché "avviso" da solo non si usa mai. Il glossario si allinea: "La lettera che il Comune manda tramite DAT per dire che una concessione o un turno sta per finire e cosa fare".
   **Ritirata.** Il nome si sceglie solo nel ticket "Avvisi di scadenza inviati da DAT" (giro 2, domande 11 e 12): lì si propone di tenere "lettera di scadenza" per concessioni, esumazioni ed estumulazioni dovute, senza utenze votive. La voce del glossario la corregge quel ticket. **Deciso lì da Dan**: "lettera di scadenza", per concessioni ed esumazioni o estumulazioni dovute, non per le utenze votive; "avviso" resta solo per l'avviso di pagamento.

**Risposte di Dan**: sì a tutte, dalla 8 alla 13. "Moroso", "Sollecito" e "Diffida" sono nel GLOSSARY.md.

### Giro 3 (2026-11-12)

15. **Riepilogo in cima.** Proposta: in cima alla linguetta "Avvisi di pagamento" tre numeri dell'anno scelto: emesso, incassato, scaduto. Niente grafici.
16. **Chi fa cosa.** Proposta: Operatore e Amministratore fanno tutto sugli avvisi: "Simula pagamento", annullare con il motivo, il prossimo passo della scala, "Emetti i canoni dell'anno". Solo l'Amministratore cambia importi e giorni in Amministrazione.
17. **Storico.** Proposta: ogni avviso emesso, pagato o annullato e ogni passo della scala (sollecito, diffida, sospensione, riaccensione, cessazione, avvio della decadenza) scrivono una riga nello storico della concessione, dell'utenza o della pratica, con data e operatore.
18. **Debiti che restano.** Proposta: dopo una voltura o un subentro gli avvisi già emessi restano intestati a chi li aveva; il nuovo abbonato o concessionario parte senza debiti. Dopo la cessazione per morosità, la decadenza o l'ultima diffida di una pratica, gli avvisi non pagati restano nell'elenco dei morosi senza altri passi.
19. **Esporta.** Proposta: "Avvisi di pagamento" e "Morosi" hanno lo stesso pulsante Esporta di Ricerca (Excel o PDF, sulle righe selezionate o su tutte). L'Excel di Illuminazione votiva tiene il suo foglio dei morosi, solo per le utenze votive.
20. **Dati finti.** Proposta: avvisi di pagamento per tutti e tre i motivi e in tutti gli stati, compresi alcuni annullati con il motivo; i canoni del 2026 già emessi e quasi tutti pagati; morosi a ogni passo della scala (sollecitati, diffidati, utenze sospese, una cessata per morosità, una concessione in decadenza per un rinnovo non pagato, una pratica diffidata). Il tempo non si simula: la scala si vede intera grazie ai dati finti.
