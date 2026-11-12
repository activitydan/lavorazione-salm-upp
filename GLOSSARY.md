# CimiTera

Gestione digitale del patrimonio cimiteriale di un Comune: censimento sul campo e gestione d'ufficio.

## Language

**Postazione**:
Il posto fisico di sepoltura che viene censito: loculo, tomba di famiglia, celletta ossario, nicchia cineraria o fossa in campo comune.
_Avoid_: manufatto

**Tomba di famiglia**:
Postazione con più posti, data in concessione a una famiglia; comprende cappelle e mausolei.
_Avoid_: cappella gentilizia

**Scheda**:
Il documento che descrive una postazione, identificato da un codice univoco.
_Avoid_: record

**Defunto**:
La persona sepolta in una postazione; una postazione può averne più di uno.
_Avoid_: deceduto, estinto

**Concessione**:
Il contratto con cui il Comune assegna per un tempo determinato una o più postazioni a un concessionario.
_Avoid_: assegnazione, contratto (da solo)

**Concessionario**:
La persona, le persone o l'ente che hanno una concessione.
_Avoid_: intestatario, titolare

**Rappresentante**:
Il concessionario che tratta con il Comune per conto degli altri, quando i concessionari sono più di uno.
_Avoid_: referente

**Avente diritto**:
Chi può essere sepolto in una tomba di famiglia in base alla concessione.
_Avoid_: beneficiario

**Illuminazione votiva**:
Il servizio che tiene accesa una lampada su una postazione, a carico di chi lo richiede.
_Avoid_: votiva (da sola), lampade

**Utenza votiva**:
Il contratto di illuminazione votiva su una postazione, per un defunto o per tutta una tomba di famiglia, con uno o più punti luce.
_Avoid_: abbonamento, contratto (da solo), lampada

**Abbonato**:
Chi ha un'utenza votiva e ne paga il canone; non è per forza il concessionario.
_Avoid_: utente, intestatario, richiedente (che indica chi chiede il servizio)

**Punto luce**:
Una lampada votiva collegata alla rete del cimitero; il canone si paga per punto luce.
_Avoid_: lampada (da sola), luce

**Voltura**:
Il passaggio di un'utenza votiva a un nuovo abbonato, con il consenso del precedente o per il suo decesso.
_Avoid_: subentro (che riguarda la concessione), cambio intestatario

**Operazione cimiteriale**:
Un intervento che mette o sposta la salma, i resti o le ceneri di un defunto: inumazione, tumulazione, esumazione, estumulazione o traslazione. Esumazione ed estumulazione sono ordinarie (a fine turno o a fine concessione) oppure straordinarie (prima, su richiesta o per ordine del giudice).
_Avoid_: lavorazione, intervento (che indica una manutenzione)

**Traslazione**:
L'operazione cimiteriale che sposta un defunto da una postazione a un'altra, anche da o verso un altro cimitero.
_Avoid_: trasferimento, spostamento

**Pratica**:
Il fascicolo di una sola operazione cimiteriale su un solo defunto, dalla richiesta o dall'avvio d'ufficio fino all'esecuzione.
_Avoid_: istanza, richiesta, procedimento

**Richiedente**:
Chi chiede al Comune una pratica o un servizio; non è per forza il concessionario.
_Avoid_: istante, intestatario

**Agenzia funebre**:
L'impresa che cura il funerale e segue le pratiche per conto della famiglia.
_Avoid_: impresa funebre, pompe funebri, onoranze funebri

**Turno**:
Il periodo dopo il quale una fossa in campo comune si libera con l'esumazione ordinaria.
_Avoid_: rotazione (da sola), scadenza (che riguarda le concessioni)

**Da inviare**:
Lo stato di un rilievo, una segnalazione o una verifica fatta sul telefono senza rete e non ancora arrivata all'ufficio.
_Avoid_: non sincronizzato, offline, in coda

## Ruoli

**Cittadino**:
Chi cerca dove si trova un defunto, senza accesso ai dati riservati.
_Avoid_: utente, visitatore

**Operatore**:
Chi lavora in CimiTera per conto del Comune, sul campo o in ufficio.
_Avoid_: funzionario, rilevatore

**Amministratore**:
L'operatore che gestisce anche gli altri operatori, le regole del Comune e le impostazioni.
_Avoid_: admin, superutente

