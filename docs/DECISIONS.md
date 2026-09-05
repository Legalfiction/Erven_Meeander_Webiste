# Decisions — ErveMeander

Architectuurbeslissingen en de motivatie erachter. Nieuwste bovenaan.

---

## 2026-09-05 — Kaarten naar Aldo via regie, niet meer via de Kaarten-Postbus

**Besluit.** Dit project stuurt kaarten met vragen en voorstellen via regie.barkr.nl
(`scripts/regie-melden.mjs`, eigen `REGIE_SLEUTEL`). Het oude `scripts/stuur-kaart.mjs` blijft
staan tot de regie-route bewezen werkt, maar wordt niet meer aangeroepen.

**Waarom.** Aldo besloot op 2 september 2026 (regie-item 357) dat kaarten alleen nog via regie
gaan. Regie bewaakt de status van elke kaart (nieuw tot afgerond), zodat een advies niet in
lopende tekst blijft hangen. De sleutel is met zelfbediening aangemaakt (regie-items 91/100).

## 2026-09-05 — `package.json` in `scripts/`, niet in de projectroot

**Besluit.** De enige npm-afhankelijkheid (`dotenv`, voor de regie-scripts) staat in
`scripts/package.json`. De projectroot blijft zonder `package.json`.

**Waarom.** Vercel deployt de root als statische site zonder build. Een `package.json` in de
root laat Vercel een `npm install` en frameworkdetectie uitvoeren, en dat verandert het
deploygedrag van een site die live is. Node vindt `scripts/node_modules` gewoon via de
module-resolutie vanuit `scripts/*.mjs`, dus de scripts werken zonder dat de site iets merkt.

## 2026-09-05 — Losse artikelpagina's krijgen een canonical naar `blog.html`

**Besluit.** `blog1.html` en `blog4.html` t/m `blog11.html` blijven bestaan (oude gedeelde links
blijven werken), maar krijgen `<link rel="canonical" href="https://www.ervemeander.nl/blog.html">`.
De sitemap noemt alleen `/` en `/blog.html`.

**Waarom.** Sinds de blogpagina alle berichten op één pagina toont, linkt niets meer naar de
losse pagina's. Dezelfde tekst op tien adressen is voor zoekmachines dubbele inhoud; de
canonical wijst hen naar de pagina die wél gelinkt en onderhouden wordt. Verwijderen is bewust
niet gedaan: dat breekt links die in het verleden gedeeld zijn.

## 2026-07-08 — Log gestart

Dit bestand is aangemaakt als onderdeel van de projectstandaardisatie (Architect, conform
`Projecten\STANDAARDEN\PROJECTSTANDAARD.md`). Nog geen eerdere beslissingen gedocumenteerd —
voeg vanaf nu nieuwe architectuurkeuzes hier toe met datum en motivatie.
