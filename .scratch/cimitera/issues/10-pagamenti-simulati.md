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

## Comments

### Giro 1 (2026-11-12)

1. **Nome del documento pagoPA.** Proposta: si chiama **avviso di pagamento**, come nella documentazione pagoPA. "Avviso" da solo non si usa; niente "bollettino" né "bolletta".
2. **Nome di quello che manda DAT.** Proposta: si chiama **lettera di scadenza**: la lettera, mandata tramite DAT con qualunque canale (posta, raccomandata, messo, PEC), che avvisa che una concessione o un'utenza votiva sta per scadere. Niente "avviso di scadenza".
3. **Cosa si paga.** Proposta: tre cose. Concessione: una **tariffa** alla nuova concessione e una al rinnovo, per tipo di concessione, pagate una volta sola (niente canone annuo della concessione: a Ragusa esiste ma le regole non si trovano). Illuminazione votiva: allaccio con i dodicesimi, poi il canone annuo. Pratica su richiesta: la tariffa del suo tipo di operazione. Le tariffe delle concessioni stanno in Amministrazione accanto alle altre, con importi della demo inventati.
4. **Un avviso, un motivo.** Proposta: ogni avviso di pagamento riguarda una sola cosa (una concessione, un'utenza per un anno, una pratica); può avere più voci dello stesso motivo (allaccio + dodicesimi). Niente avvisi che raccolgono più motivi, niente rate.
5. **Come nasce.** Proposta: lo crea CimiTera da solo con l'azione che lo richiede: nuova concessione, rinnovo, nuovo allaccio, nuova pratica su richiesta, "Emetti i canoni dell'anno". Nessun blocco: l'azione vale subito, il pagamento si segue a parte. Scadenza 30 giorni dopo l'emissione; i 30 giorni stanno in Amministrazione.
6. **Stati.** Proposta: da pagare, scaduto (calcolato dalla data, si può ancora pagare), pagato (data e numero della ricevuta), annullato (con motivo). Se la pratica viene annullata, CimiTera annulla da solo il suo avviso non pagato. L'attestazione di pagamento della pratica diventa lo stato del suo avviso.
7. **Come si vede che è simulato.** Proposta: pulsante "Simula pagamento" sull'avviso (Operatore e Amministratore), che lo porta a pagato con data e numero di ricevuta finti. Il PDF segue il modello ufficiale A4 ma ha la scritta "FAC-SIMILE" e codici finti. In "Scadenze e pagamenti" una riga fissa: "pagoPA simulato: nessun pagamento reale". Si paga solo con pagoPA: niente registrazione a mano di altri pagamenti.
