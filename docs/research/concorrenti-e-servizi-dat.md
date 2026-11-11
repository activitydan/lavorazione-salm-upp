# Concorrenti, avviso pagoPA e servizi di DAT

Ricerca per il ticket `03-concorrenti-e-servizi-dat` della mappa CimiTera. Pagine lette l'11/11/2026.

Legenda: **[dichiarato]** = lo scrive il fornitore o l'ente sul proprio sito; **[dedotto]** = lo deduco io dalle fonti.

## 1. Sintesi

- **Deda Next** (modulo "CiviliaNext Gestione Cimiteriale") è il concorrente più completo: concessioni con scadenze, illuminazione votiva, mappa, avviso pagoPA per ogni cittadino con riconciliazione, e un vero portale per le imprese funebri (scelgono la sepoltura in mappa, emettono l'avviso pagoPA, prenotano i servizi). Conferma quanto dice il cliente.
- **APKappa** (Gruppo Maggioli) copre concessioni, movimenti delle salme e bollettazione dell'illuminazione votiva con la suite hyperSIC e con un servizio in outsourcing (APKSERVICE). Gli avvisi pagoPA ci sono solo se il Comune usa anche il loro intermediario pagoPA. Nessun portale per le agenzie trovato.
- **Systemtec** (CimiteroSmart) ha totem da esterno con ricerca del defunto e necrologi, scadenzario delle concessioni a 6 mesi e mappa a colori. Non trovato pagoPA.
- **Roseto** è Roseto degli Abruzzi: usa l'app Aldilapp (STUP1 srl) per cercare il defunto, lasciare un ricordo, ordinare fiori e pulizia della lapide.
- **Morosi**: nessuno dei quattro dichiara una funzione di solleciti o morosi. Deda Next ha solo l'elenco dei dovuti non pagati.
- **Avviso pagoPA**: modello A4 obbligatorio, con codice avviso di 18 cifre, codice fiscale dell'ente, importo, scadenza, CBILL e codice QR (`PAGOPA|002|avviso|CF ente|importo in centesimi`). Una posizione debitoria passa per gli stati DRAFT, PUBLISHED, VALID, PARTIALLY_PAID, PAID, più EXPIRED/UNPAYABLE (scaduta) e INVALID (annullata).
- **DAT** fa stampa, imbustamento, spedizione, raccomandate con ricevuta scansionata, notifica di atti con messi, esternalizzazione dell'ufficio messi e conservazione a norma come outsourcer di **Ifin Sistemi**. Non cita **Zucchetti** né **SEND**. Il cliente ha ragione su un punto: i concorrenti software mandano avvisi digitali (e-mail, app IO, SEND), ma nessuno dichiara recapito fisico e notifica con messi.

## 2. Concorrenti

### Deda Next — CiviliaNext Gestione Cimiteriale

Il modulo cimiteriale di Deda Next fa parte della suite CiviliaNext, area "Demografia" (insieme ad Anagrafe, Elettorale, Stato Civile). **[dichiarato]** — https://www.civilianext.it/civilia-next/demografia-anpr

Dalla pagina del modulo — https://www.civilianext.it/civilia-next/demografia-anpr/gestione-cimiteriale **[dichiarato]**:

- **Mappa**: le sepolture sono mostrate su cartografia digitalizzata, con un WebGIS di consultazione.
- **Entità cimiteriale**: è l'unità minima a cui si lega una pratica (cella, tomba, loculo...). Ha anagrafica e localizzazione, stato di assegnazione, stato di occupazione, anagrafica delle lampade votive, anagrafica delle concessioni, gestione economica.
- **Concessioni**: tipologia, validità del contratto, scadenze, importi del canone. Lo stato di assegnazione tiene lo storico (prenotazione o concessione, intestatario, periodo di validità, situazione dei pagamenti e saldo).
- **Occupazione**: storico di ingressi e uscite delle salme, con date, soggetti, esecutori e destinazioni.
- **Lampade votive**: anagrafica con tipo di illuminazione e numero di lampade.
- **Pagamenti**: oneri per concessione, trasporto, tumulazione, cremazione e altre prestazioni; stampa di un avviso pagoPA per ogni cittadino e riconciliazione dei pagamenti; flusso unico verso pagoPA con accorpamento per richiedente.
- **Portale per le imprese funebri**: le imprese entrano con identità digitale dal portale del Comune, assegnano ai cittadini le entità disponibili scegliendole in mappa, emettono gli avvisi pagoPA e prenotano trasporto, funerale, tumulazione e altri servizi. Al Comune restano revisione e autorizzazione.
- **Controllo**: reportistica sulle scadenze, fascicoli.

Il modulo generale dei pagamenti di CiviliaNext — https://www.civilianext.it/civilia-next/servizi-online/pagamenti-online-pago-pa **[dichiarato]**:

- gestisce "tutti i dovuti, pagati e non pagati", con filtri ed esportazione;
- permette di modificare o eliminare i dovuti non pagati e di segnare come pagati quelli incassati in altro modo;
- ha una funzione di riconciliazione sulle posizioni pagate, con ricerca per flusso di riversamento;
- invia notifiche automatiche via e-mail, SMS, app IO e posta; è integrato con SEND.

Non trovato sulle pagine lette: una funzione dedicata a solleciti e morosi, la ricerca del defunto per il cittadino.

### APKappa — hyperSIC e APKSERVICE

APKAPPA srl è una società del Gruppo Maggioli. **[dichiarato]** — https://www.apkappa.it/APKappa/media/apkappa/doc/SRV_cimitero_SH2019_IT_v3.pdf

- **Suite hyperSIC Cloud**: la brochure elenca tra le aree coperte i "servizi cimiteriali amministrativi e contabili", i "servizi messi notificatori" e i "pagamenti elettronici con pagoPA". Tra le piattaforme collegate: ANPR, pagoPA, app IO, conservazione digitale a norma, PEC, SEND. **[dichiarato]** — https://apkappa.it/it-it/soluzioni/software-gestionale-per-comuni/hs_cloud_112024_a4.aspx (brochure 11/2024)
- **APKSERVICE "Servizio di gestione banca dati cimitero, censimento e gestione servizi cimiteriali"** (scheda del 2019): servizio in outsourcing. Il team APKappa acquisisce i dati delle strutture dai documenti del Comune o dal sopralluogo, censisce le salme, collega i dati alla cartografia, inserisce e gestisce i contratti di concessione e i movimenti delle salme, gestisce la bollettazione delle lampade votive, emette gli avvisi di pagamento "anche eventualmente in formato pagoPA (solo se l'Ente utilizza il servizio di intermediazione APKser.pagoPA)", e rendiconta gli incassi delle lampade votive. **[dichiarato]** — https://www.apkappa.it/APKappa/media/apkappa/doc/SRV_cimitero_SH2019_IT_v3.pdf
- Il sito pubblico di APKappa non ha una pagina di prodotto dedicata al modulo cimiteriale: la pagina della suite elenca solo le aree (Demografici, Segreteria, Contabilità, Tributi, Personale, Ufficio Tecnico, Frontoffice e Territorio). — https://apkappa.it/it-it/soluzioni/software-gestionale-per-comuni

Non trovato: gestione dei morosi, portale per le agenzie funebri, ricerca del defunto per il cittadino.

### Systemtec — CimiteroSmart

Systemtec Srl (Villanuova sul Clisi, Brescia) vende CimiteroSmart, software "web based" per la gestione dei loculi, abbinabile a un totem touch screen. **[dichiarato]** — https://cimiterosmart.com/

- **Concessioni**: assegnando un loculo a un defunto si genera il contratto di concessione, con data di inizio e di scadenza; si emette e si stampa la fattura o la si esporta verso il programma fiscale. Il software segnala i contratti "inattivi, scaduti, senza fattura o senza lampada votiva". In home c'è una tabella con i loculi in scadenza nei prossimi 6 mesi. **[dichiarato]** — https://cimiterosmart.com/software-cimitero-smart/
- **Lampade votive**: elenco dei contraenti con data del contratto, scadenza e rinnovo automatico; generazione di contratto, fattura e bollettino postale; rinnovi massivi a inizio anno. **[dichiarato]** — https://cimiterosmart.com/software-cimitero-smart/
- **Mappa**: cimitero diviso in zone, con i loculi colorati per stato: verde libero, giallo prenotato, rosso occupato. **[dichiarato]** — https://cimiterosmart.com/software-cimitero-smart/
- **Totem**: il cittadino cerca la posizione del defunto nel cimitero; la schermata iniziale mostra gli ultimi necrologi; l'operatore comunale pubblica avvisi (orari, comunicazioni); in opzione, un modulo per le segnalazioni al Comune. Struttura da esterno, attiva 24 ore su 24. **[dichiarato]** — https://cimiterosmart.com/totem-multimediali/
- **Richieste funerali**: le richieste di funerale arrivano a chi esegue le operazioni cimiteriali, con stati "Aperta / Presa in carico / Chiusa", e-mail automatiche, documenti allegati e autorizzazioni precompilate. A richiesta chiusa i dati passano nell'archivio e il loculo risulta occupato. **[dichiarato]** — https://cimiterosmart.com/richieste-funerali/

Non trovato sulle pagine lette: pagoPA, morosi, ricerca del defunto online fuori dal totem.

### Roseto degli Abruzzi — Aldilapp

Il "Roseto" citato dal cliente è Roseto degli Abruzzi (Teramo). Il Comune ha avviato il censimento e la mappatura dei suoi cimiteri e ha adottato l'app Aldilapp. — https://www.comune.roseto.te.it/novita/comunicati/roseto-degli-abruzzi-digitalizza-i-suoi-cimiteri-al-via-il-censimento-e-la-mappatura-delle-sepolture/

Aldilapp è prodotta da STUP1 srl Società Benefit (Milano). **[dichiarato]** — https://aldilapp.it/

- Per il cittadino: ricerca del defunto per nome, cognome, data o anno di nascita e di morte; pensieri commemorativi; foto e biografia sul profilo del defunto; cero virtuale; invio di fiori e ordine della pulizia della lapide; notifiche sui profili seguiti. — https://aldilapp.it/app/
- Per il Comune: contratto di adesione per pubblicare i dati cimiteriali, segnaletica nei cimiteri, una dashboard e la digitalizzazione dell'anagrafe cimiteriale. — https://aldilapp.it/aldilapp-applicazione-cimiteri
- Store: https://apps.apple.com/it/app/apple-store/id1567407543 e https://play.google.com/store/apps/details?id=com.stup1.aldilapp

### Tabella di confronto

"Sì" = dichiarato sul sito del fornitore. "Non trovato" = non compare nelle pagine lette, non vuol dire che manchi.

| | Deda Next (CiviliaNext) | APKappa (hyperSIC / APKSERVICE) | Systemtec (CimiteroSmart) | Aldilapp (Roseto) |
|---|---|---|---|---|
| Concessioni | Sì: tipologia, validità, scadenze, canone | Sì: contratti di concessione (servizio in outsourcing) | Sì: contratto, fattura, scadenzario a 6 mesi | Non trovato |
| pagoPA | Sì: avviso per cittadino, riconciliazione | Sì, ma solo con l'intermediazione APKser.pagoPA | Non trovato (fattura e bollettino postale) | Non trovato |
| Morosi | Non trovato (c'è l'elenco dei dovuti non pagati) | Non trovato | Non trovato (segnala i contratti senza fattura) | Non trovato |
| Illuminazione votiva | Sì: anagrafica delle lampade | Sì: bollettazione e rendiconto incassi | Sì: contratti, rinnovi, bollettino | Non trovato |
| Portale agenzie funebri | Sì: assegnazione in mappa, avvisi pagoPA, prenotazioni | Non trovato | In parte: modulo "Richieste funerali" | No |
| Servizi al cittadino | Non trovato per i cimiteri | Non trovato per i cimiteri | Sì: totem con ricerca del defunto e necrologi | Sì: app con ricerca del defunto |
| Recapito e notifica | Notifiche via e-mail, SMS, app IO, posta; SEND | Integrazione con SEND e PEC nella suite | Non trovato | No |

## 3. Avviso pagoPA

Fonte: documentazione ufficiale "L'avviso di pagamento pagoPA", versione 3.5.0 — https://docs.pagopa.it/avviso-pagamento/

### Com'è fatto l'avviso analogico

- È un foglio A4, stampabile anche fronte e retro. I modelli sono obbligatori per gli enti creditori. Esistono due modelli base (rata unica, rate multiple) e alcune varianti (senza scadenza, molte rate, altre lingue). — https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche e https://docs.pagopa.it/avviso-pagamento/allegato-1/modelli-base
- I moduli vanno messi in quest'ordine: 1) Intestazione, 2.1) Informazioni sull'Ente Creditore, 2.2) Informazioni sul Destinatario, 3.1) Importo e scadenza, 3.2) Dove pagare, 4) Dati per il pagamento. — https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche

### I dati dell'avviso

| Dato | Regola | Esempio della documentazione |
|---|---|---|
| Oggetto del pagamento | Massimo 90 caratteri, iniziale maiuscola, non tutto maiuscolo | TARI 2021 |
| Logo dell'ente | 30×30 mm | — |
| Codice fiscale dell'ente creditore | Massimo 16 caratteri (11 nel codice QR) | 01199250158 |
| Nome dell'ente | Massimo 50 caratteri | Comune di Milano |
| Settore dell'ente | Massimo 50 caratteri | Tributi locali |
| Informazioni di contatto | Massimo 100 caratteri | Per informazioni www.comune.milano.it/TARI · tel. 02 0202 |
| Codice fiscale del destinatario | Massimo 16 caratteri; si omette solo se non è noto | RSSMRA60D20F205R |
| Nome e cognome del destinatario | Massimo 70 caratteri | Mario Rossi |
| Indirizzo del destinatario | Massimo 140 caratteri | Vicolo Corto 12 20133 Milano MI |
| Importo | Migliaia con il punto, decimali con la virgola | 150,00 |
| Data di scadenza | Formato gg/mm/aaaa | 31/01/2022 |
| Codice avviso | 18 cifre, scritte a gruppi di 4 separati da uno spazio | 0000 0000 0000 0000 00 |
| Codice CBILL | Codice interbancario dell'ente (codice SIA), tutto maiuscolo | A0EDT |
| Codice QR | 25×25 mm, monocromatico | vedi sotto |

Fonti: https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/intestazione, .../informazioni-sullente-creditore, .../informazioni-sul-destinatario, .../importo-e-scadenza, .../dati-per-il-pagamento/rata-unica

- **Codice avviso**: è la concatenazione di AUX digit, application code e codice IUV. — https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dati-per-il-pagamento/codice-qr
- **Codice QR**: contiene la stringa `PAGOPA|002|<codice avviso di 18 cifre>|<codice fiscale dell'ente di 11 cifre>|<importo in centesimi>`. Esempio della documentazione: `PAGOPA|002|000000000000000000|01199250158|0000015000`. — stessa pagina
- **Testi fissi "Dove pagare"**: "PAGA CON L'APP IO oppure dal tuo Home Banking, con la tua app di pagamento o con gli altri canali abilitati." e "PAGA SUL TERRITORIO presso Banche e Sportelli ATM, negli Uffici Postali e Punti Postali, nei Bar, Edicole, Ricevitorie, Supermercati, Tabaccherie, e altri Esercenti Convenzionati." — https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dove-pagare
- **Bollettino Postale PA**: si aggiunge solo se l'ente incassa su un conto corrente postale. Contiene numero e intestatario del conto, un Data Matrix di 25×25 mm e l'autorizzazione di Poste alla stampa in proprio. — https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dati-per-il-pagamento/bollettino-postale-pa
- **Rate**: il testo "Puoi pagare per intero oppure in N rate" compare solo con 2 o più rate; ogni rata ha il proprio importo, la propria data, il proprio codice avviso e il proprio codice QR. — https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/importo-e-scadenza

### Gli stati di una posizione debitoria

Fonte: Gestione Posizioni Debitorie (GPD), API V3 — https://developer.pagopa.it/pago-pa/guides/sanp/appendici/posizioni-debitorie/stati-della-posizione-debitoria-v3 e, per INVALID, https://developer.pagopa.it/pago-pa/guides/sanp/appendici/posizioni-debitorie/operazioni-disponibili

| Stato | Significato | Come ci si arriva |
|---|---|---|
| DRAFT | Bozza, non ancora pagabile | Creazione con `toPublish=false` |
| PUBLISHED | Pubblicata, in attesa della data di validità | Pubblicazione di una bozza, o creazione con date di validità future |
| VALID | Pagabile | Creazione senza data di validità, oppure in automatico quando arriva la data di validità |
| PARTIALLY_PAID | Pagata in parte (rateizzata) | Pagamento di una parte delle rate; si pagano solo le rate rimaste |
| PAID | Pagata per intero | Pagamento di tutte le rate dell'opzione scelta |
| EXPIRED / UNPAYABLE | Scaduta, non più pagabile | In automatico dopo l'ultima scadenza, solo se l'ente ha attivato `switchToExpired`; torna VALID se l'ente mette una nuova scadenza |
| INVALID | Annullata (cancellazione logica) | Invalidazione dell'ente, possibile solo da PUBLISHED o VALID |

- PARTIALLY_PAID e PAID non si possono più modificare; una posizione pagata non si può cancellare. — stesse pagine
- Senza `switchToExpired` una posizione resta VALID, cioè pagabile, anche dopo la scadenza. **[dedotto]** dalla stessa pagina.
- La pagina usa sia "EXPIRED" sia "UNPAYABLE" per lo stato di scaduta: il nome esatto va verificato.

## 4. Servizi di DAT

Fonte principale: il sito datnotifiche.it.

### Chi è

- DAT s.r.l., sede in Via Mazzini 152, Agrigento. "Una società giovane che nasce nel 2017". Il sito dice che oggi fa parte del "Gruppo HYA"; la natura del legame societario non è spiegata. **[dichiarato]** — https://datnotifiche.it/chi-siamo
- Licenze postali dichiarate in home: "Licenza Ministeriale Individuale n.37132017", "Autorizzazione Generale n. 7253/2024" e "Licenza Speciale Individuale A1-Italia n. LISP/34/2024" (notifica di atti e multe sul territorio nazionale). Certificazioni ISO 9001 e ISO/IEC 27001:2022. **[dichiarato]** — https://datnotifiche.it/
- Le quattro aree di servizio del menu: servizi postali e di notifica, servizi digitali, servizi di consulenza, servizi di censimento sul territorio. **[dichiarato]** — https://datnotifiche.it/

### Servizi postali e di notifica

Fonte: https://datnotifiche.it/servizi-postali/ **[dichiarato]**

| Servizio | Cosa comprende |
|---|---|
| Notificare per riscuotere | Elenco plichi, elaborazione e stampa dei plichi, notifica degli atti, lavorazioni informatiche. Promette "100% degli esiti di notifica e zero resi", 60 giorni per chiudere le notifiche, fascicolo elettronico per contribuente con gli importi notificati. |
| Posta Certa | Recapito georeferenziato, ogni plico rintracciabile, PDF consultabili online, rendicontazione del 100% del lotto. |
| Raccomandata Certa | Raccomandate georeferenziate, raccolta e scansione delle ricevute di ritorno, esiti digitali importabili, archiviazione del cartaceo. |
| Notifica Certa | Messi straordinari, notifiche secondo gli artt. 138, 139, 140, 143, 144, 145 e 149-bis c.p.c., atti giudiziari, stampa e postalizzazione di CAD/CAN e degli atti giudiziari. |
| Messo comunale smart | Esternalizzazione dell'ufficio messi: front-office, predisposizione degli atti, imbustamento manuale o meccanizzato, affrancatura, spedizione e notifica, anche via PEC se il destinatario è in un altro Comune. |
| Notifica violazioni e atti amministrativi | Notifica postale di atti giudiziari (L. 890/1982) e di violazioni del Codice della Strada (art. 201 D.lgs. 285/1992), con fascicolo informatico e scansione dell'avviso di ricevimento. |

### Servizi digitali

Fonte: https://datnotifiche.it/servizi-digitali/ **[dichiarato]**

- **Conservazione a norma e digitalizzazione documentale**: DAT si definisce "Partner Selected Outsourcer di Ifin Sistemi, conservatore accreditato". Rivolta a PA, multiutility e aziende private.
- **Espertizzazione ufficio tributi**: servizio clienti digitale per l'ufficio entrate (portale, call center, consulenza), legato alla TARI e alla delibera ARERA 15/2022.

### Servizi di consulenza e censimento

- Consulenza: compliance privacy, supporto agli uffici finanziari, supporto alle misure PNRR. **[dichiarato]** — https://datnotifiche.it/servizi-di-consulenza/
- Censimento sul territorio: rilevazione georeferenziata per il Canone Unico Patrimoniale, con schede "cespite" e file CSV. La pagina non parla di censimento cimiteriale. **[dichiarato]** — https://datnotifiche.it/servizi-di-censimento-sul-territorio/

### HYA Group

- Hya s.r.l. ha sede in Via Mazzini 150, Agrigento, accanto a DAT (152). Offre servizi postali, stampa massiva a dati variabili, archiviazione digitale (piattaforma web per consultare i PDF dei documenti prodotti per i clienti), censimento dei cespiti per il Canone Unico Patrimoniale e letture dei contatori dell'acqua. **[dichiarato]** — https://www.hyagroup.it/
- La pagina "Partner" mostra solo loghi; i nomi dei file indicano tra gli altri GLS e SDA (corrieri). **[dedotto]** dai nomi dei file — https://www.hyagroup.it/partner-3/
- Sulla home di hyagroup.it compaiono frasi pubblicitarie di casinò online fuori contesto: probabilmente il sito è stato manomesso. Da segnalare al cliente. **[dedotto]**

### Recapito e notifica: cosa fa DAT e cosa fanno i concorrenti

| | DAT | Concorrenti software |
|---|---|---|
| Stampa, imbustamento, spedizione | Sì | Non trovato |
| Raccomandata con ricevuta scansionata | Sì | Non trovato |
| Notifica con messi | Sì (anche messi straordinari, ufficio messi in outsourcing) | APKappa: la suite ha un'area "servizi messi notificatori", cioè il software per l'ufficio messi del Comune |
| Notifica digitale | PEC come canale di inoltro | Deda Next: e-mail, SMS, app IO, posta, SEND; APKappa: SEND e PEC nella suite |
| Conservazione a norma | Sì, come outsourcer di Ifin Sistemi | APKappa: "Conservazione digitale a norma" tra le integrazioni |

**[dedotto]**: la frase del cliente "nessun concorrente software fa anche recapito e notifica" regge solo per il recapito fisico e la notifica con i messi. Sulla notifica digitale (app IO, SEND) i concorrenti sono già integrati.

## 5. Cosa significa per CimiTera

Sono proposte, non decisioni. Restano dentro i confini della mappa: dati finti, niente collegamenti reali.

### Per simulare i pagamenti in modo credibile

- **Avviso pagoPA finto ma fedele al modello**: un PDF A4 con i moduli nell'ordine ufficiale (intestazione, ente, destinatario, importo e scadenza, dove pagare, dati per il pagamento), codice avviso di 18 cifre a gruppi di 4, codice fiscale del Comune, CBILL, codice QR generato con la stringa `PAGOPA|002|...`. L'oggetto deve essere chiaro, per esempio "Rinnovo concessione loculo 12 – Cimitero di ...", oppure "Canone illuminazione votiva 2027".
- **Stati semplificati per l'operatore**: "Da pagare" (VALID), "Pagata in parte" (PARTIALLY_PAID), "Pagata" (PAID), "Scaduta" (EXPIRED), "Annullata" (INVALID). La bozza può restare interna. Nella demo un pulsante "Simula pagamento" porta l'avviso a "Pagata" e registra la data.
- **Un avviso per concessionario** che raccoglie più voci (come il "flusso unico con accorpamento per richiedente" di Deda Next e il "multi-dovuto" di CiviliaNext): un unico avviso per l'illuminazione votiva di più postazioni dello stesso concessionario.
- **Morosi**: un elenco di chi ha avvisi scaduti e non pagati, con importo, giorni di ritardo e postazione. Nessun concorrente dichiara questa funzione: qui CimiTera può distinguersi.

### Per simulare gli avvisi di scadenza "inviati da DAT"

- **Lotto di invio**: l'operatore sceglie le concessioni o le illuminazioni votive in scadenza (per esempio nei prossimi 6 mesi, come fa CimiteroSmart), crea un lotto e lo "invia a DAT".
- **Canale per ogni concessionario**: posta ordinaria, raccomandata, notifica con messo, PEC. Sono i canali che DAT dichiara.
- **Esiti simulati per ogni invio**: "In lavorazione", "Spedito", "Consegnato", "Notificato", "Irreperibile", con data e, per la raccomandata, la ricevuta scansionata finta. Riprende la "rendicontazione del 100% del lotto" e gli "esiti digitali importabili" che DAT promette.
- **Collegamento avviso ↔ pagamento**: l'avviso di scadenza contiene l'avviso pagoPA. Così si vede tutto il percorso: scadenza, invio DAT, esito della consegna, pagamento oppure moroso.

### Dove CimiTera può distinguersi

1. **Ciclo completo in un'unica schermata**: scadenza della concessione → invio tramite DAT → esito della consegna → pagamento → moroso. Nessun concorrente lo mostra intero, perché nessuno fa il recapito fisico.
2. **Gestione dei morosi** con solleciti e passaggio alla notifica formale con messo (servizio "Notificare per riscuotere" di DAT).
3. **Conservazione a norma** come voce visibile (per esempio un'etichetta "Inviato in conservazione" sui documenti), tramite Ifin Sistemi.
4. **Da non inseguire ora**: il portale per le agenzie funebri (Deda Next è avanti) e totem o app pubblica (Systemtec, Aldilapp). Sono già nel "Not yet specified" e nell'"Out of scope" della mappa.

## 6. Non trovato o incerto

- **Zucchetti**: il sito di DAT non lo nomina. L'unico partner per la conservazione citato è Ifin Sistemi. Da chiedere al cliente quale rapporto c'è con Zucchetti.
- **Partner per la riscossione**: nessuno nominato. DAT offre "Notificare per riscuotere" in proprio.
- **SEND**: DAT non dice di usare la piattaforma notifiche digitali SEND.
- **Licenze di DAT**: la pagina dei servizi postali cita una "Licenza Speciale n. 24/2023 di tipo B" limitata alla Sicilia; la home cita la licenza A1 nazionale LISP/34/2024. Non è chiaro quale sia in vigore per quale servizio.
- **Legame tra DAT e HYA**: stessa via, mail e PEC con dominio hyagroup; la struttura societaria non è spiegata.
- **APKappa**: nessuna pagina di prodotto attuale sul modulo cimiteriale. La scheda di APKSERVICE è del 2019. Non trovati portale per le agenzie, morosi, ricerca del defunto.
- **Deda Next**: non trovati solleciti e morosi, né la ricerca del defunto per il cittadino.
- **Systemtec**: non trovati pagoPA, morosi, ricerca online fuori dal totem.
- **Aldilapp a Roseto**: la pagina del Comune non dava il testo completo del comunicato (né la data). Non verificato se il servizio è ancora attivo.
- **Stato "scaduta" in pagoPA**: la documentazione usa sia EXPIRED sia UNPAYABLE.
- **Brochure di APKappa (2024)**: letta solo come testo estratto dal PDF; l'impaginazione a colonne rende incerto l'ordine delle voci.

## 7. Fonti

- https://datnotifiche.it/
- https://datnotifiche.it/chi-siamo
- https://datnotifiche.it/servizi-postali/
- https://datnotifiche.it/servizi-digitali/
- https://datnotifiche.it/servizi-di-consulenza/
- https://datnotifiche.it/servizi-di-censimento-sul-territorio/
- https://www.dedanext.it/
- https://www.dedanext.it/next-software-cloud-servizi-digitalizzazione-pa/
- https://www.civilianext.it/civilia-next
- https://www.civilianext.it/civilia-next/demografia-anpr
- https://www.civilianext.it/civilia-next/demografia-anpr/gestione-cimiteriale
- https://www.civilianext.it/civilia-next/servizi-online
- https://www.civilianext.it/civilia-next/servizi-online/pagamenti-online-pago-pa
- https://www.apkappa.it/
- https://apkappa.it/it-it/soluzioni/software-gestionale-per-comuni
- https://apkappa.it/it-it/soluzioni/software-gestionale-per-comuni/hs_cloud_112024_a4.aspx
- https://www.apkappa.it/APKappa/media/apkappa/doc/SRV_cimitero_SH2019_IT_v3.pdf
- https://cimiterosmart.com/
- https://cimiterosmart.com/software-cimitero-smart/
- https://cimiterosmart.com/totem-multimediali/
- https://cimiterosmart.com/richieste-funerali/
- https://www.comune.roseto.te.it/novita/comunicati/roseto-degli-abruzzi-digitalizza-i-suoi-cimiteri-al-via-il-censimento-e-la-mappatura-delle-sepolture/
- https://aldilapp.it/
- https://aldilapp.it/app/
- https://aldilapp.it/aldilapp-applicazione-cimiteri
- https://docs.pagopa.it/avviso-pagamento/
- https://docs.pagopa.it/avviso-pagamento/allegato-1/modelli-base
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/intestazione
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/informazioni-sullente-creditore
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/informazioni-sul-destinatario
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/importo-e-scadenza
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dove-pagare
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dati-per-il-pagamento
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dati-per-il-pagamento/rata-unica
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dati-per-il-pagamento/bollettino-postale-pa
- https://docs.pagopa.it/avviso-pagamento/allegato-2/specifiche-tecniche/dati-per-il-pagamento/codice-qr
- https://developer.pagopa.it/pago-pa/guides/sanp/appendici/posizioni-debitorie/stati-della-posizione-debitoria-v3
- https://developer.pagopa.it/pago-pa/guides/sanp/appendici/posizioni-debitorie/operazioni-disponibili
- https://www.hyagroup.it/
- https://www.hyagroup.it/partner-3/
