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

Dal ticket [Semplificazione di Manutenzioni](17-semplificazione-manutenzioni.md): le squadre di intervento spariscono, anche dall'elenco nelle Impostazioni, perché quando si programma una manutenzione si assegnano uno o più operatori. Le categorie di manutenzione restano. Le manutenzioni assegnate a un operatore sono tra le sue cose da fare.

Dal ticket [Pagamenti simulati](10-pagamenti-simulati.md): Amministrazione riceve anche le tariffe delle concessioni (nuova concessione e rinnovo, per tipo, importi inventati) e tre numeri di giorni: 30 per pagare un avviso di pagamento, 30 di termine dopo il sollecito e 30 dopo la diffida. Li cambia solo l'Amministratore. Il campo "Stato pagamenti" sparisce anche dai campi configurabili.

Dal ticket [Risposta al cliente](13-risposta-al-cliente.md): nella risposta al cliente i collegamenti esterni (ANPR, protocollo, contabilità) stanno tra le cose che richiedono accordi esterni. Se questo ticket decide di mostrarli nell'app, chi lo chiude aggiunge al punto 3 di [risposta-al-cliente.md](../risposta-al-cliente.md) la riga "nella demo un riquadro mostra i collegamenti previsti". Se non li mostra, il testo resta com'è.

Dal ticket [Divisione in fasi](20-divisione-in-fasi.md): Impostazioni e Amministrazione sono la fase 6 di 13, dopo Manutenzioni e prima di Concessioni. Amministrazione nasce lì e le fasi 8, 9, 10 e 13 ci aggiungono le regole dei loro modelli. Restano in sospeso nel ticket 20, e chi chiude questo ticket li scrive lì come aggiornamento: il contenuto della fase 6, dove stanno le regole che ogni modello aggiunge, e se i flag Tomba singola, Cappella e Colombaio escono dai campi configurabili nella fase 4 (Censimento e Nuovo rilievo) o nella 6.

## Comments

### 2026-11-12 · primo giro di domande, in attesa delle risposte di Dan

Oggi le Impostazioni hanno sotto il titolo una frase e il badge "Versione configurazione · salvataggio automatico", poi sei linguette:

- **Scheda Pro · campi**: un riquadro di spiegazione, poi tre colonne: elenco dei campi divisi per sezione, modifica del campo (con "Chiave nei dati", sei interruttori, Archivia ed Elimina definitivamente), anteprima del telefono. I campi sono dieci: i flag Lampada votiva, Tomba singola, Cappella e Colombaio; Stato pagamenti, Canone lampada votiva, Codice utenza e Intestatario utenza (sezione "Fatturazione e pagamenti"); Materiale lapide e Condizione lapide (sezione "Manufatto").
- **Stati**: Occupato, Libero, Da verificare, Da manutenzionare, Inaccessibile, modificabili. Il codice li cambia già da solo: una manutenzione segnalata mette "Da manutenzionare", una verifica assegnata "Da verificare".
- **Tipologie**: Loculo, Tomba, Cappella, Colombaio, Vuota, In costruzione, modificabili. Non sono i cinque tipi di postazione decisi nel ticket 07.
- **Elenchi**: categorie di manutenzione, squadre di intervento, motivi di verifica, viali del cimitero scelto.
- **Cimitero e dati**: dati del cimitero in sola lettura (codice per gli ID, perimetro, punto di partenza), backup e ripristino, riquadro "Configurazione" con conteggi e una frase sui contatori dell'acqua.
- **Registro modifiche**: elenco delle modifiche alla configurazione, con chi e quando.

Impostazioni

1. **Criterio tra le due pagine.** Proposta: Amministrazione contiene le persone e le regole del Comune (operatori, agenzie funebri, durate, turno, tariffe e canoni); Impostazioni contiene i campi della scheda e gli elenchi di voci usati nelle pagine. Tutte e due solo per l'Amministratore e solo sul computer.
2. **Campi da togliere.** Proposta: escono dai campi configurabili Lampada votiva (la calcola l'utenza; il filtro in Ricerca resta, fisso), Tomba singola, Cappella e Colombaio (ripetono la tipologia; spariscono anche da filtri e scheda), e tutta la sezione "Fatturazione e pagamenti" (già decisa dai ticket 08 e 19). Restano Materiale lapide e Condizione lapide, nella sezione "Postazione"; le sezioni rimaste vuote spariscono.
3. **Stati e tipologie fissi.** Proposta: non si modificano più ed escono dalle Impostazioni. Le tipologie diventano i cinque tipi di postazione del glossario (loculo, tomba di famiglia, celletta ossario, nicchia cineraria, fossa in campo comune), perché da loro dipendono durate, tariffe e turno. Gli stati restano i cinque di oggi, perché li cambiano da sole pratiche, verifiche e manutenzioni. Cosa diventano Tomba, Cappella, Colombaio, Vuota e In costruzione di oggi va al secondo giro.
4. **Linguette.** Proposta: due, "Campi della scheda" (al posto di "Scheda Pro · campi") ed "Elenchi". Elenchi contiene categorie di manutenzione, motivi di verifica, viali del cimitero scelto e squadre di intervento, se il ticket [Manutenzioni](17-semplificazione-manutenzioni.md) le tiene.
5. **Cimitero e dati.** Proposta: la linguetta sparisce. Il riquadro del cimitero (solo lettura) e il riquadro "Configurazione" si tolgono. Backup e ripristino diventa un pulsante "Backup" in alto a destra, che apre una finestra con Scarica il backup, Importa un backup, Ripristina i dati dimostrativi.
6. **Aspetto dei campi.** Proposta: spariscono la frase sotto il titolo, il badge della versione, il riquadro di spiegazione e la riga "Chiave nei dati". Restano le tre colonne: elenco dei campi, modifica, anteprima del telefono.
7. **Interruttori del campo.** Proposta: da sei a quattro: Nel rilievo, Nei filtri, Colonna in Ricerca, Obbligatorio. "Nelle esportazioni" sparisce perché nella finestra Esporta ogni campo si sceglie già tra le colonne; "Nel popup della mappa" sparisce perché mostrava solo i flag, che con il punto 2 non ci sono più.
8. **Archivia ed elimina.** Proposta: un campo che ha dati si può solo archiviare (sparisce ovunque, i dati restano, si ripristina); "Elimina" c'è solo per i campi senza dati.

Amministrazione

9. **Linguette.** Proposta: Operatori, Agenzie funebri, Regole del Comune, Registro modifiche.
10. **Regole del Comune.** Proposta: un riquadro per voce del menu: Concessioni (durata per tipo, durata del rinnovo, soglia "in scadenza"), Campo comune (turno), Operazioni cimiteriali (tariffa per tipo), Illuminazione votiva (canone per punto luce, allaccio). Qui arrivano anche le tariffe e i giorni che decideranno i ticket [Pagamenti simulati](10-pagamenti-simulati.md) e [Avvisi di scadenza](11-avvisi-di-scadenza.md). Sotto durate e importi una sola riga: "Vale per i nuovi contratti e addebiti".
11. **Operatori.** Proposta: tabella con nome, ruolo, contatti, quadranti, alert aperti, cose da fare, attivo; "Nuovo operatore" in alto, "Modifica" sulla riga. Cliccando una riga si apre il pannello laterale con due elenchi: i suoi alert (gli stessi della sua campanella) e le sue cose da fare (operazioni programmate, verifiche aperte, manutenzioni assegnate); ogni voce apre la sua pagina.
12. **Ruolo dell'operatore.** Proposta: il campo "Ruolo" diventa Operatore o Amministratore, come nel glossario. Spariscono Rilevatore, Rilevatrice, Supervisore e Manutentore.
13. **Togliere un operatore.** Proposta: si disattiva, non si cancella: non compare più in "Entra come" né nelle assegnazioni, ma il suo nome resta su rilievi, pratiche e registro.
14. **Agenzie funebri.** Proposta: tabella con nome, partita IVA, telefono, email e numero di pratiche; "Nuova agenzia" in alto, "Modifica" sulla riga; si disattiva come gli operatori. Dati finti: una decina di agenzie.
15. **Registro modifiche.** Proposta: passa in Amministrazione e registra le modifiche fatte in tutte e due le pagine (campi, elenchi, operatori, agenzie, regole), con chi le ha fatte e quando.
16. **Collegamenti esterni** (ANPR, protocollo, contabilità). Proposta: non si mostrano nell'app, perché un riquadro che non fa nulla è superfluo; stanno nella risposta al cliente tra le cose che richiedono accordi esterni. Nella mappa il punto passa in "Out of scope".
