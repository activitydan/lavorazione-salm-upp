# Modello della concessione

Type: grilling
Status: resolved
Assignee: Dan
Blocked by: 01

## Question

Quali dati, stati e azioni ha una concessione in CimiTera?

Da decidere: i dati del contratto, il concessionario e gli eredi, come si calcola la scadenza, le azioni disponibili (stipula, rinnovo, subentro, decadenza), cosa l'amministratore può configurare (durate per tipo di postazione, come già fa con i campi della scheda).

Dalla ricerca "Regole delle concessioni e delle operazioni cimiteriali": la scadenza si calcola dalla data del contratto e dalla regola applicata (regolamento del 2023 o del 1985 per i contratti vecchi), non dagli anni dalla morte. Da decidere anche per il glossario: il concessionario può essere un ente o più persone; i nomi "celletta ossario" e "nicchia cineraria" non coincidono con "ossario" e "urna" del glossario.

## Comments

### 2026-11-12 · primo giro di domande

1. Concessione come elemento a sé, collegato a una o più schede.
2. Concessionario: persona, ente o più persone con un rappresentante; nome, codice fiscale, indirizzo, recapiti.
3. Durate configurabili per tipo di concessione in Impostazioni; ogni contratto conserva la regola con cui è nato.
4. Quattro stati più il motivo di chiusura.
5. Azioni: nuova, rinnovo, subentro, rinuncia, avvio della decadenza e decadenza; revoca esclusa; storico per ogni azione.
6. Elenco semplice degli aventi diritto nelle tombe di famiglia.
7. Nomi dei tipi di postazione presi dal regolamento di Ragusa.

### 2026-11-12 · risposte di Dan

Sì a 1, 3, 4, 5, 6. Sulla 2: sì, ma se il concessionario è un ente deve essere indicato esplicitamente. Sulla 7: Ragusa è solo l'esempio della demo, i nomi li scelgo io.

## Answer

Risolto il 2026-11-12.

- **Concessione**: un elemento a sé, collegato a una o più schede. Una tomba di famiglia copre tutti i suoi posti con un solo contratto; un loculo ha un contratto per una scheda.
- **Dati del contratto**: numero e data di stipula, provvedimento, tipo di concessione, schede collegate, posti totali e occupati, data di decorrenza, durata, scadenza calcolata, rinnovi fatti, regola applicata.
- **Concessionario**: uno o più. Il tipo va indicato sempre: **persona** (nome, cognome, codice fiscale, indirizzo, recapiti) oppure **ente** (denominazione, codice fiscale o partita IVA, indirizzo, recapiti, legale rappresentante). Con più concessionari uno è il **rappresentante**. L'indirizzo serve agli avvisi tramite DAT.
- **Scadenza**: si calcola dalla data di decorrenza del contratto e dalla regola applicata, mai dalla data di morte. Le durate per tipo di concessione e la durata del rinnovo sono in Impostazioni e le cambia l'Amministratore. Valori della demo (presi da Ragusa, solo come esempio): tomba di famiglia 99 anni, loculo 60, celletta ossario e nicchia cineraria 30, rinnovo 10. Ogni contratto conserva la regola con cui è nato: cambiare le durate non tocca i contratti esistenti.
- **Stati**: attiva; in scadenza (calcolato dalla data, soglia configurabile); in decadenza (diffida avviata); chiusa, con motivo: scaduta, decaduta, revocata, rinunciata, estinta.
- **Azioni nella demo**: nuova concessione, rinnovo, subentro, rinuncia, avvio della decadenza, decadenza. La revoca resta fuori. Ogni azione scrive una riga nello storico del contratto, con data, atto e operatore.
- **Aventi diritto**: solo per le tombe di famiglia, un elenco semplice con nome e parentela. Le dichiarazioni sostitutive non si gestiscono.
- **Tipi di postazione**: loculo, tomba di famiglia (comprende cappella e mausoleo), celletta ossario, nicchia cineraria, fossa in campo comune. La fossa in campo comune non ha concessione: ha un turno di rotazione, che riguarda il ticket "Modello di pratiche e operazioni".
- **Fuori dalla demo** perché regole del solo Comune di Ragusa: il limite di una concessione per persona e il termine di 12 mesi per il subentro.
- **Rimandati**: canone e pagamenti al ticket "Pagamenti simulati", avvisi al ticket "Avvisi di scadenza inviati da DAT".

### Aggiornamento del 2026-11-12

Dal ticket [Modello di pratiche e operazioni](09-modello-pratiche-e-operazioni.md). Questi punti valgono al posto di quelli sopra:

- Le durate per tipo di concessione e la durata del rinnovo non stanno più in Impostazioni ma nella nuova voce **"Amministrazione"**, sempre solo per l'Amministratore.
- Anche il **turno** della fossa in campo comune (10 anni nella demo) sta in Amministrazione. Le fosse a fine turno e le postazioni con la concessione chiusa ma ancora occupate entrano nello scadenzario unico di "Scadenze e pagamenti", da cui si aprono le pratiche d'ufficio.
- La pratica non mostra la concessione. Quando una pratica è eseguita, CimiTera aggiorna da sola i posti occupati.


### Aggiornamento del 2026-11-12 (utenza votiva)

Dal ticket [Modello dell'utenza votiva](08-modello-utenza-votiva.md): quando una concessione si chiude, CimiTera chiude da sola le utenze votive delle sue schede, con motivo "fine della concessione".

### Aggiornamento del 2026-11-12 (pagamenti)

Dal ticket [Pagamenti simulati](10-pagamenti-simulati.md): la concessione non ha un canone annuo. Si paga una **tariffa** alla nuova concessione e una al rinnovo, per tipo, in Amministrazione; l'avviso di pagamento nasce da solo con l'azione, intestato al rappresentante o all'unico concessionario, e l'azione vale subito. Se l'avviso resta scaduto: sollecito, poi avvio della decadenza. Il concessionario moroso ha l'etichetta "Moroso". Dopo un subentro gli avvisi già emessi restano a chi li aveva.
