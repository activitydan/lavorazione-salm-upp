# Pagamenti simulati

Type: grilling
Status: open
Blocked by: 03, 07, 08

## Question

Cosa si paga in CimiTera e come simuliamo pagoPA?

Da decidere: quali importi esistono (canoni di concessione, canoni votivi, tariffe delle operazioni), come nasce un avviso, quali stati ha un pagamento, come si vedono i morosi, e come si rende chiaro che il collegamento con pagoPA è simulato.

Dal ticket "Struttura del menu": i pagamenti stanno nella voce "Scadenze e pagamenti", insieme agli avvisi di scadenza, per concessioni e illuminazione votiva insieme. Da decidere anche per il glossario: "avviso" indica sia l'avviso di pagamento pagoPA sia l'avviso di scadenza inviato tramite DAT; servono due nomi distinti.

Dal ticket "Modello di pratiche e operazioni": ogni tipo di operazione ha una tariffa, che l'Amministratore cambia nella nuova voce "Amministrazione" (importi della demo inventati); le pratiche d'ufficio non hanno tariffa. La pratica mostra l'importo e l'attestazione di pagamento (pagata sì/no, data, numero), che è il suo unico documento. Anche le durate delle concessioni ora stanno in Amministrazione. La campanella degli alert è personale: i morosi non compaiono più come alert generale, si vedono solo nelle pagine.

Dal ticket "Modello dell'utenza votiva": chi paga il canone votivo è l'**abbonato** (indirizzo per la bolletta se diverso). All'allaccio si addebitano contributo di allaccio e dodicesimi del canone fino al 31 dicembre; ogni anno "Emetti i canoni dell'anno" addebita il canone (per punto luce) a tutte le utenze attive. Canone e allaccio stanno in Amministrazione (demo 24 € e 15 €). L'utenza diventa "sospesa per morosità" (luce spenta) e torna attiva pagando il dovuto: da decidere qui quando scatta la sospensione e quando la morosità porta alla cessazione.
