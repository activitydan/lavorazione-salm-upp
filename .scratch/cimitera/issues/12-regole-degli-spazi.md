# Regole degli spazi su una pagina campione

Type: prototype
Status: resolved
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

### 2026-11-12 · risposte di Dan al primo giro

Sì a tutte e otto le proposte.

### 2026-11-12 · secondo giro di domande, in attesa delle risposte di Dan

Il prototipo ora applica le regole anche alle finestre e al pannello laterale della scheda (per esempio "Assegna verifica" in Censimento).

9. **Finestre e pannello laterale.** Proposta: stesse regole dei riquadri: 16 px dentro (oggi 18–20), testata 14 sopra e sotto e 16 ai lati, piede 12 e 16; 16 px tra i campi dei moduli (oggi 14).
10. **Sottotitoli nelle finestre.** Proposta: restano solo quando dicono una conseguenza che non si vede ("Il poligono disegnato contiene 12 schede già censite" resta; "Compare subito nella scheda, nel rilievo sul campo, nei filtri e nelle esportazioni" va via).
11. **La home.** Proposta: resta com'è, come il frame Figma, anche se fino a 1475 px di larghezza ha a destra un margine più largo (73 px) delle altre pagine (38).
12. **Semplificazione pagina per pagina.** Proposta: la nebbia diventa cinque ticket di domande, uno per gruppo di pagine: Ricerca; Censimento e Nuovo rilievo; Manutenzioni; Impostazioni; Dashboard, Mappa, Scheda e pagina del QR. Le pagine nuove (Concessioni, Illuminazione votiva, Operazioni cimiteriali, Scadenze e pagamenti, Amministrazione) prendono forma dai loro ticket di modello e seguono queste regole.

### 2026-11-12 · risposte di Dan al secondo giro

Sì a tutte e quattro le proposte.

## Answer

Risolto il 2026-11-12 sul prototipo, variante A "Come la home". Le regole valgono per tutte le pagine tranne la home.

- **Margini di pagina**: 20 px sopra, 38 ai lati (allineati alla barra in alto), 24 sotto. La pagina è a tutta larghezza anche sugli schermi grandi: sparisce il limite di 1640 px. Sul telefono 16 px ai lati.
- **Intestazione**: solo il titolo, senza frase descrittiva. Titolo e pulsanti sulla prima riga, linguette sotto. 12 px tra titolo e linguette, 16 tra linguette e contenuto; 16 tra titolo e contenuto se la pagina non ha linguette.
- **Distanza tra i riquadri**: 16 px ovunque (indicatori, colonne, griglie di card). Un titolo fuori dai riquadri, come "Operatori sul campo", ha 16 px sopra e 8 sotto.
- **Margini interni**: 16 px in tutti i riquadri e negli indicatori. Testata del riquadro 14 px sopra e sotto, 16 ai lati; piede 12 e 16.
- **Righe delle tabelle**: 10 px sopra e sotto (righe di circa 44 px) e 12 px ai lati di ogni cella, come oggi; la prima e l'ultima colonna stanno a 16 px dal bordo, allineate al titolo del riquadro.
- **Riquadri affiancati**: alti uguali, così non resta un buco sotto il più basso.
- **Scala delle distanze**: tutte le altre distanze solo 4, 8, 12, 16 e 24 px. Fanno eccezione i margini di pagina (20 e 38), presi dalla home.
- **Finestre e pannello laterale della scheda**: stesse regole dei riquadri: 16 px dentro, testata 14 e 16, piede 12 e 16; 16 px tra i campi dei moduli.
- **Sottotitoli nelle finestre**: restano solo quando dicono una conseguenza che non si vede.
- **Home**: resta com'è, come il frame Figma 104:36 (fino a 1475 px di larghezza ha 73 px a destra).
- **Parole**: nei ticket le "schede" in alto nelle pagine si chiamano linguette, per non confonderle con la Scheda del glossario.
- **Semplificazione pagina per pagina**: diventa cinque ticket di domande: [Ricerca](15-semplificazione-ricerca.md), [Censimento e Nuovo rilievo](16-semplificazione-censimento-e-rilievo.md), [Manutenzioni](17-semplificazione-manutenzioni.md), [Impostazioni e Amministrazione](18-semplificazione-impostazioni.md), [Dashboard, Mappa, Scheda e pagina del QR](19-semplificazione-dashboard-mappa-scheda-qr.md). Le pagine nuove prendono forma dai loro ticket di modello e seguono queste regole.
- **Prototipo**: ramo `prototipo/regole-degli-spazi`, da non unire a `main`.
