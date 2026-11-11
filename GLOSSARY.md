# CimiTera

Gestione digitale del patrimonio cimiteriale di un Comune: censimento sul campo e gestione d'ufficio.

## Language

**Postazione**:
Il posto fisico di sepoltura che viene censito: loculo, tomba, cappella, ossario o urna.
_Avoid_: manufatto

**Scheda**:
Il documento che descrive una postazione, identificato da un codice univoco.
_Avoid_: record

**Concessionario**:
La persona che ha in concessione una postazione in forza di un contratto con il Comune.
_Avoid_: intestatario, titolare

**Illuminazione votiva**:
Il servizio che tiene accesa una lampada su una postazione, a carico di chi lo richiede.
_Avoid_: votiva (da sola), lampade

**Operazione cimiteriale**:
Un intervento su una sepoltura: inumazione, tumulazione, esumazione o estumulazione.
_Avoid_: lavorazione, intervento (che indica una manutenzione)
