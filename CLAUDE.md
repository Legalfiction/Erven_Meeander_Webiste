# Erve Meander — Website

Informatiewebsite voor een kleinschalig, duurzaam zorg-erf in de regio Hellendoorn voor (jong)volwassenen met een zorgvraag. Start gepland in 2027/2028.

## Stack

| Laag | Technologie |
|------|-------------|
| HTML | Vanilla HTML5 — `index.html` + `blog1/2/3.html` |
| CSS | Vanilla CSS3 — `styles.css` (CSS custom properties, geen preprocessor) |
| JS | Vanilla JavaScript — `script.js` (geen framework, geen bundler) |
| Fonts | Google Fonts: Montserrat (koppen) + Quicksand (body) |
| Icons | Font Awesome 6.4.0 (CDN) |
| Formulier | Web3Forms API (`https://api.web3forms.com/submit`) |

**Geen npm, geen build-stap, geen framework.** Bestanden direct bewerken en pushen.

## Bestandsstructuur

```
index.html          ← hoofdpagina (alle secties)
blog1.html          ← Blog: Voorbereidingen Bouwfase
blog2.html          ← Blog: [artikel 2]
blog3.html          ← Blog: [artikel 3]
styles.css          ← alle opmaak (CSS variabelen in :root)
script.js           ← scroll-animaties, sticky header, FAQ accordion, formulier
logo.png            ← Erve Meander logo
huis.jpg            ← hero-afbeelding (houten gebouw in landschap)
farm_barn.png       ← decoratief element (schuur)
farm_tractor.png    ← decoratief element (tractor)
farm_tree_oak.png   ← decoratief element (eikenboom)
farm_tree_pine.png  ← decoratief element (dennenboom)
cheerful_diverse_people.png ← foto bewoners/mensen
copy_images.py      ← hulpscript: kopieert AI-afbeeldingen naar projectmap
remove_bg.py        ← hulpscript: verwijdert achtergrond van afbeeldingen
backup_old/         ← oude versie (niet deployen)
```

## Secties in index.html

| Sectie | Anker | Inhoud |
|--------|-------|--------|
| Hero | `#home` | Grote foto, tagline, CTA-knop |
| Visie | `#visie` | Filosofie, duurzaamheidsiconen, huidige status |
| Wonen & Zorg | `#wonen-zorg` | Woonplekken, 24/7 zorg, stichting |
| De Omgeving | `#community` | Natuur, buurtschap |
| FAQ | `#faq` | Accordion met veelgestelde vragen |
| Vrienden van | `#vrienden` | Donateurs/vrienden sectie |
| Blog | `#blog` | Links naar blog1/2/3.html |
| Contact | `#contact` | Formulier (Web3Forms) |

## Design

- **Kleurenpalet:** groen (`#82A740`, `#CBE896`), rivier-blauw (`#A0C4E2`), geel (`#F9D423`)
- **Thema:** Meander/rivier — zachte bochten, natuurlijke vormen
- **Animaties:** Intersection Observer voor `.fade-in` en `.bounce-on-scroll`
- **Responsive:** hamburger-menu op mobiel

## Contactformulier

Formulier stuurt via Web3Forms naar `aldo.huizinga@gmail.com`.

```js
access_key: 'a62b3f12-f90e-4b61-aba0-6071ddd3e65e'
endpoint:   'https://api.web3forms.com/submit'
velden:     name, email, interest (select), message (textarea)
```

## Deploy

**Live URL:** `www.ervemeander.nl` (ook: `ervemeander.nl`)

```
push naar main branch → Vercel → auto-deploy → www.ervemeander.nl
```

- GitHub repo: `Legalfiction/Erven_Meeander_Webiste`
- Vercel project: `erven_meeander` (production branch: `main`)
- **Let op:** altijd naar `main` pushen — Vercel volgt `master` NIET

### Deployen

```bash
git add .
git commit -m "Omschrijving wijziging"
git push origin main
```

Vercel deployt automatisch binnen ~60 seconden.

## CSS-variabelen (aanpassen kleur/layout)

```css
:root {
    --color-green-light: #CBE896;
    --color-green-dark:  #82A740;
    --color-blue-river:  #A0C4E2;
    --color-yellow:      #F9D423;
    --font-heading:      'Montserrat', sans-serif;
    --font-body:         'Quicksand', sans-serif;
    --meander-width:     1000px;
}
```

## Kaartendienst-koppeling (2026-08-14)

Dit project is aangesloten op de gedeelde Kaartendienst: `scripts/stuur-kaart.mjs` schrijft een
kaart-JSON naar `G:\Mijn Drive\Kaarten-Postbus` (`project: "ervemeander"`), die dienst pikt het
bestand op en stuurt het als bericht met knoppen naar Aldo's Telegram, gebundeld in de groep
"Zorg & Dossiers" (ochtendvenster 07:30, zie `Projecten\Kaartendienst\scripts\project-categorieen.mjs`).

- Schema en spelregels: `G:\Mijn Drive\Kaarten-Postbus\LEESMIJ.md` (canonieke bron, niet hier
  dupliceren).
- Gebruik: `node scripts/stuur-kaart.mjs` stuurt de ingebouwde `INHOUD` in het script; die moet
  vóór elke nieuwe run bijgewerkt worden met verse kernfeiten (het script verzint zelf niets),
  of geef `--inhoud pad-naar-json.json` mee met een los samengesteld bestand.
- Antwoorden van Aldo komen terug als `antwoord-ervemeander-<tijdstempel>.json` in dezelfde
  postbusmap.
- Eerste kaart verstuurd op 2026-08-14: `kaart-ervemeander-20260814-1424.json`. Dit project raakt
  Telegram zelf nooit aan, geen token of chat-id nodig in dit project.
```
