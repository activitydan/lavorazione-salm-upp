# Regole degli spazi su una pagina campione

Type: prototype
Status: open
Assignee: Dan
Blocked by: 04

## Question

Quali regole di spazio valgono per tutte le pagine?

Da decidere su una pagina campione rifatta: margini di pagina, distanza tra i riquadri, margini interni, intestazione della pagina, righe delle tabelle. Lo standard di partenza è la home; il risultato vale poi per tutte le altre pagine.

## Assets

- Prototipo sul ramo [`prototipo/regole-degli-spazi`](https://github.com/activitydan/lavorazione-salm-upp/tree/prototipo/regole-degli-spazi) (da non unire a `main`). Si avvia con `npm run dev`; la variante si sceglie con `?spazi=A|B|C|oggi` prima del `#` (esempio `http://localhost:5180/?spazi=A#/censimento`). Frecce ← → o la barra nera in basso per cambiare variante; la barra mostra anche dove comincia il primo riquadro e quanto è lunga la pagina. Le varianti valgono su tutte le pagine tranne la home; la pagina campione è Censimento › Avanzamento.
  - **A · Come la home**: pagina 20 sopra, 38 ai lati, 24 sotto, a tutta larghezza; riquadri a 16; margini interni 16; righe delle tabelle 10 sopra e sotto; titolo e linguette su due righe. Primo riquadro a 128 px dalla barra in alto (oggi 162).
  - **B · Compatta**: pagina 16 / 24 / 16; riquadri a 12; margini interni 12; righe 6; titolo, linguette e pulsanti su una riga. Primo riquadro a 70 px.
  - **C · Ariosa**: pagina 24 / 40 / 40; riquadri a 24; margini interni 20; righe 14; titolo e linguette su due righe. Primo riquadro a 144 px.
  - In tutte: niente frase sotto il titolo, riquadri affiancati alti uguali, nessuno scorrimento di lato sul telefono.

## Comments

### 2026-11-12 · primo giro di domande sul prototipo, in attesa delle risposte di Dan

1. **Margini di pagina.** Proposta: 20 px sopra, 38 ai lati (allineati alla barra in alto), 24 sotto, a tutta larghezza anche sugli schermi grandi; sul telefono 16 ai lati.
2. **Intestazione.** Proposta: titolo e pulsanti sulla prima riga, linguette sotto; 12 px tra titolo e linguette, 16 tra linguette e contenuto. Non su una riga sola come in B.
3. **Distanza tra i riquadri.** Proposta: 16 px ovunque (indicatori, colonne, griglie di card); un titolo fuori dai riquadri, come "Operatori sul campo", ha 16 sopra e 8 sotto.
4. **Margini interni.** Proposta: 16 px in tutti i riquadri (oggi 18); la testata del riquadro 14 sopra e sotto e 16 ai lati, come i riquadri della home.
5. **Righe delle tabelle.** Proposta: 10 px sopra e sotto (righe di circa 44 px), 12 tra le colonne, prima e ultima colonna a 16 dal bordo, allineate al titolo del riquadro.
6. **Riquadri affiancati.** Proposta: alti uguali, così non resta un buco sotto il più basso (in Avanzamento il grafico si allunga fino all'altezza della mappa).
7. **Scala delle distanze.** Proposta: tutte le altre distanze solo tra 4, 8, 12, 16 e 24 px.
8. **Parola per le linguette.** Le "schede" in alto si confondono con la Scheda del glossario. Proposta: nei ticket si chiamano "linguette".
