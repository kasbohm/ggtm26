# Strava API Setup Guide

For å aktivere automatisk synkronisering av aktiviteter fra Strava, følg denne guiden.

## Trinn 1: Opprett Strava API Application

1. Gå til [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
2. Logg inn med din Strava-konto
3. Klikk på "Create an App" (eller "My API Application" hvis du allerede har en app)

## Trinn 2: Fyll ut applikasjonsdetaljer

- **Application Name**: `Gåping Mallorca Konkurranse` (eller et annet navn du ønsker)
- **Category**: `Social` eller `Visualizer`
- **Club**: La stå tom (ikke påkrevd)
- **Website**: `https://kasbohm.github.io/ggtm26/`
- **Application Description**: "Konkurranse for Mallorca sykkeltur 2026"
- **Authorization Callback Domain**:
  - For lokal testing: `localhost` eller `127.0.0.1`
  - For produksjon: `kasbohm.github.io`

⚠️ **Viktig**: Hvis du skal teste lokalt OG bruke i produksjon, sett begge:
```
localhost, kasbohm.github.io
```

## Trinn 3: Hent Client ID og Client Secret

Etter du har opprettet appen, vil du få:

- **Client ID**: Et tall (f.eks. `123456`)
- **Client Secret**: En hemmelig kode (f.eks. `abc123def456...`)

⚠️ **ADVARSEL**: Aldri del Client Secret offentlig!

## Trinn 4: Oppdater strava-config.js

Åpne filen `strava-config.js` og oppdater:

```javascript
const STRAVA_CONFIG = {
    // Erstatt med ditt Client ID
    clientId: '123456',  // <-- Legg inn ditt Client ID her

    // Resten er allerede riktig konfigurert
    redirectUri: window.location.origin + window.location.pathname,
    scope: 'activity:read_all',
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    apiUrl: 'https://www.strava.com/api/v3'
};
```

## Trinn 5: Oppdater strava-api.js med Client Secret

⚠️ **SIKKERHETSADVARSEL**: I en produksjonsapp skal Client Secret ALDRI lagres i frontend-kode!

For testing kan du midlertidig legge inn Client Secret i `strava-api.js`:

1. Åpne `strava-api.js`
2. Finn linje 52 og 94 hvor det står `'YOUR_CLIENT_SECRET_HERE'`
3. Erstatt med din Client Secret: `'abc123def456...'`

**For produksjon**: Du bør lage en backend-tjeneste som håndterer token exchange. Alternativer:
- Bruke en serverless function (Vercel, Netlify, Cloudflare Workers)
- Bruke en OAuth proxy-tjeneste
- Sette opp en enkel Node.js backend

## Trinn 6: Oppdater konkurransedatoer

Åpne `strava-config.js` og oppdater:

```javascript
const COMPETITION_DATES = {
    start: '2026-03-15',  // <-- Endre til riktig startdato
    end: '2026-03-22',    // <-- Endre til riktig sluttdato
    // ...
};
```

## Trinn 7: Test integrasjonen

1. Åpne `konkurranse.html` i nettleseren
2. Klikk på "Koble til Strava"
3. Du vil bli videresendt til Strava for å godkjenne tilgang
4. Etter godkjenning blir du sendt tilbake til konkurransesiden
5. Klikk på "Synkroniser" for å hente aktiviteter

## Hvordan det fungerer

### Automatisk poengberegning

**Klartepoeng (Klatring)**:
- 0.1 poeng per meter høydemeter
- Bonus poeng for store klatringer:
  - HC (Hors Catégorie): 1000m+ → +50 poeng
  - Cat 1: 600m+ → +30 poeng
  - Cat 2: 400m+ → +20 poeng
  - Cat 3: 200m+ → +10 poeng
  - Cat 4: 100m+ → +5 poeng

**Spurtpoeng**:
- Basert på gjennomsnittsfart
- 10 poeng for 40+ km/t
- 5 poeng for 35+ km/t
- (Kan også konfigureres for spesifikke Strava-segmenter)

**Snittfartpris**:
- Total distanse / total tid
- Automatisk beregnet fra alle aktiviteter i perioden

## Feilsøking

### "Not authenticated" eller OAuth errors

1. Sjekk at Authorization Callback Domain matcher nøyaktig
2. For localhost: Bruk `http://localhost:8000` (ikke `127.0.0.1`)
3. Fjern eventuelle ekstra spaces i callback domain

### "Invalid client_secret"

Client Secret er ikke riktig oppdatert i `strava-api.js`

### Ingen aktiviteter synkroniseres

1. Sjekk at datoene i `COMPETITION_DATES` er riktige
2. Sjekk at aktivitetene er merket som "Ride" i Strava
3. Sjekk at aktivitetene ikke er private (krever `activity:read_all` scope)

### CORS errors

Dette kan skje hvis du tester lokalt. Løsninger:
- Bruk en lokal webserver (f.eks. `python -m http.server 8000`)
- Deploy til GitHub Pages
- Bruke en OAuth proxy

## Avansert: Segmentbaserte spurtpoeng

For å bruke spesifikke Strava-segmenter for spurtpoeng:

1. Finn segment ID fra Strava URL (f.eks. `https://www.strava.com/segments/123456`)
2. Oppdater `strava-config.js`:

```javascript
const POINTS_RULES = {
    sprint: {
        segments: [
            { id: 123456, name: 'Port de Soller Sprint', points: 15 },
            { id: 789012, name: 'Sa Calobra Sprint', points: 20 }
        ]
    }
};
```

3. Oppdater `strava-api.js` for å sjekke segment efforts i aktiviteter

## Datasikkerhet

- Tokens lagres i localStorage i nettleseren
- Ingen data sendes til andre servere enn Strava API
- For å fjerne all data: Klikk "Koble fra" eller tøm localStorage

## Support

Har du problemer? Sjekk:
- [Strava API Documentation](https://developers.strava.com/docs/)
- [Strava API Playground](https://developers.strava.com/playground/)
