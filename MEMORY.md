# Memory — Erve Meander

## Project
Informatiewebsite voor zorg-erf in regio Hellendoorn. Start 2027/2028.
Puur statisch: HTML + CSS + Vanilla JS — geen npm, geen framework.

## Hosting
- Live: `www.ervemeander.nl`
- Vercel project `erven_meeander`, production branch: **`main`**
- Altijd pushen naar `main` — `master` branch wordt door Vercel NIET gevolgd

## Formulier
- Web3Forms API, key: `a62b3f12-f90e-4b61-aba0-6071ddd3e65e`
- Berichten naar: `aldo.huizinga@gmail.com`

## Afbeeldingen
- `copy_images.py` kopieert AI-gegenereerde afbeeldingen vanuit Gemini-map
- `remove_bg.py` verwijdert achtergronden
- Afbeeldingen worden handmatig gegenereerd en via scripts overgezet

## Bekende valkuilen
- Niet pushen naar `master` — Vercel pikt dit niet op
- `backup_old/` map nooit deployen (staat buiten root, Vercel negeert het al)
- CSS versie-tag in HTML: `styles.css?v=4` — ophogen bij grote CSS-wijzigingen
