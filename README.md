Just force push to main like a cowboy.
This is fine!

## Start lokal web server

```
python3 -m http.server 8000
```

Åpne så http://localhost:8000 i nettleseren.

> Nødvendig fordi `fetch()` ikke fungerer på `file://`-protokollen.

## Oppdater rute-bundle (hvis du legger til nye GPX-filer)

```
python3 build-routes-bundle.py
```
