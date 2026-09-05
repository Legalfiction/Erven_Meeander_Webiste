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
blog.html           ← Blog: alle berichten op één pagina, met ankers #post-N (de enige gelinkte blogpagina)
blog1.html, blog4.html t/m blog11.html
                    ← losse artikelpagina's, nergens meer gelinkt; canonical wijst naar blog.html
sitemap.xml         ← sitemap voor zoekmachines (alleen / en /blog.html); lastmod bijwerken bij inhoudswijziging
robots.txt          ← verwijst naar de sitemap
og-image.jpg        ← 1200x630 voorvertoning voor delen (Open Graph/Twitter), gemaakt uit huis.jpg + logo.png
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
scripts/            ← regie-melden.mjs + zet-status.mjs (kopieën uit regie), eigen package.json (alleen dotenv)
backup_old/         ← oude versie (niet deployen)
```

**Waarom `scripts/package.json` en niet een `package.json` in de root:** Vercel deployt de root
als statische site zonder build. Een `package.json` in de root zou Vercel een `npm install` en
een frameworkdetectie laten doen, en dat raakt de live site. Node vindt `scripts/node_modules`
via de gewone module-resolutie vanuit `scripts/*.mjs`. Installeren: `cd scripts && npm install`.

## Secties in index.html

| Sectie | Anker | Inhoud |
|--------|-------|--------|
| Hero | `#home` | Grote foto, tagline, CTA-knop |
| Visie | `#visie` | Filosofie, duurzaamheidsiconen, huidige status |
| Wonen & Zorg | `#wonen-zorg` | Woonplekken, 24/7 zorg, stichting |
| De Omgeving | `#community` | Natuur, buurtschap |
| FAQ | `#faq` | Accordion met veelgestelde vragen |
| Vrienden van | `#vrienden` | Donateurs/vrienden sectie |
| Blog | `#blog` | Uittreksels met links naar blog.html#post-N |
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

## Kaarten naar Aldo: via regie (sinds 2026-09-05)

Kaarten met een vraag, voorstel of fout gaan via regie.barkr.nl, met de eigen `REGIE_SLEUTEL`
uit `.env` (aangemaakt 2026-09-05, zie `STANDAARDEN\SECRETS-REGISTER.md`). Aldo besloot op
2 september 2026 (regie-item 357) dat kaarten alleen nog via regie gaan; de oude route via de
Kaarten-Postbus wordt niet meer gebruikt.

- Kaart sturen: `node scripts/regie-melden.mjs item --type vraag|voorstel|fout|actie --titel "..."
  --context "..." --advies "..." --opties "a|b" --voorkeur 1`. Minimaal twee keuzes plus een
  voorkeur, of `--geen-keuze "..."` als er echt niets te kiezen valt.
- Status peilen: `node scripts/regie-melden.mjs status <id>`. Doorzetten na uitvoering:
  `node scripts/zet-status.mjs <id> uitgevoerd "<wat er gedaan is>"` en daarna `afgerond`.
- `scripts/regie-melden.mjs` en `scripts/zet-status.mjs` zijn ongewijzigde kopieën uit
  `Projecten\regie\scripts\`. Een fout daarin wordt daar hersteld en opnieuw gekopieerd, nooit in
  de kopie. Ze hebben `dotenv` nodig: `cd scripts && npm install` (zie Bestandsstructuur).
- Eerste kaart via regie: 2026-09-05, op verzoek van Alex (postbus `NAAR-ervemeander-2026-09-05-1726.md`).

### Oude route (Kaartendienst, 2026-08-14 t/m 2026-09-05)

`scripts/stuur-kaart.mjs` schreef een kaart-JSON naar `G:\Mijn Drive\Kaarten-Postbus`
(`project: "ervemeander"`); de Kaartendienst zette dat om in een Telegram-bericht. Eerste en enige
kaart langs die weg: `kaart-ervemeander-20260814-1424.json`. Het script staat er nog (verwijderen
pas als de regie-route bewezen werkt, besluit 14 in regie), maar wordt niet meer aangeroepen.
```
