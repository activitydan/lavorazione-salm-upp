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

**Operazione cimiteriale**:
Un intervento su una sepoltura: inumazione, tumulazione, esumazione o estumulazione.
_Avoid_: lavorazione, intervento (che indica una manutenzione)

## Ruoli

**Cittadino**:
Chi cerca dove si trova un defunto, senza accesso ai dati riservati.
_Avoid_: utente, visitatore

**Operatore**:
Chi lavora in CimiTera per conto del Comune, sul campo o in ufficio.
_Avoid_: funzionario, rilevatore

**Amministratore**:
L'operatore che gestisce anche gli altri operatori e le impostazioni.
_Avoid_: admin, superutente

