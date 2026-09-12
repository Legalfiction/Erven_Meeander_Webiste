# Changelog

Alle noemenswaardige wijzigingen aan dit project worden hier bijgehouden.
Formaat losjes gebaseerd op [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### 2026-09-10

- **Privacyvriendelijke bezoekersstatistiek**: Vercel Web Analytics toegevoegd aan `index.html`
  en `blog.html` (`<script defer src="/_vercel/insights/script.js"></script>`). Cookieloos, geen
  persoonsgegevens, dus geen toestemmingsbanner nodig. Er komt pas data binnen zodra Web
  Analytics in het Vercel-dashboard voor dit project aangezet is; dat is een handmatige stap
  voor Aldo. Uitvoering van regie-item 477 (antwoord Aldo, 5 september 2026).
  De losse artikelpagina's (`blog1.html`, `blog4.html` t/m `blog11.html`) zijn bewust overgeslagen:
  ze zijn nergens meer gelinkt en de sitemap noemt ze niet (zie DECISIONS.md 2026-09-05).
- Blogbericht met de stand van zaken blijft uit tot dit deel af is (zo koos Aldo op de kaart).

### 2026-09-05

- **Open Graph en Twitter-tags** op `index.html` en `blog.html`, met een nieuwe `og-image.jpg`
  (1200x630, hero-foto plus logo). Een gedeelde link toont nu een nette voorvertoning op WhatsApp,
  Facebook en LinkedIn. Uitvoering van regie-item 372 (antwoord Aldo, 3 september 2026).
- **`sitemap.xml` en `robots.txt`** toegevoegd; de sitemap bevat `/` en `/blog.html`.
- **Canonical-tags**: `index.html` en `blog.html` wijzen naar zichzelf op `https://www.ervemeander.nl/`
  (het kale domein stuurt daar al met een 307 naartoe). De negen losse artikelpagina's
  (`blog1.html`, `blog4.html` t/m `blog11.html`) zijn nergens meer gelinkt en wijzen met een canonical
  naar `blog.html`, zodat zoekmachines ze niet als dubbele inhoud zien.
- `blog.html` had nog geen meta-beschrijving; toegevoegd.
- **Aangesloten op regie.barkr.nl**: eigen `REGIE_SLEUTEL` in `.env`, `scripts/regie-melden.mjs`
  en `scripts/zet-status.mjs` gekopieerd uit het regie-project, `scripts/package.json` voor `dotenv`.
  Kaarten naar Aldo gaan vanaf nu via regie in plaats van de Kaarten-Postbus (regie-item 357).
- `logs/` in `.gitignore` (lokaal logbestand van het oude `stuur-kaart.mjs`).
