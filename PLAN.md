# Plan — Erve Meander Website

## Huidige status (mei 2026)

De website is functioneel en live op `www.ervemeander.nl`. Pioniersfase project — bouw verwacht in 2027/2028.

## Gedaan

- [x] Informatiewebsite live op www.ervemeander.nl (Vercel)
- [x] Contactformulier werkend via Web3Forms (e-mail naar aldo.huizinga@gmail.com)
- [x] Responsief design (desktop + mobiel)
- [x] FAQ accordion
- [x] Blog sectie met 3 artikelen
- [x] Decoratieve AI-afbeeldingen (schuur, tractor, bomen)

## Volgende stappen

### Fase 1 — Content & Kwaliteit
- [ ] Blog aanvullen — nieuwe artikelen over voortgang bouwfase
- [ ] Teksten reviewen en aanscherpen (SEO, leesbaarheid)
- [ ] Echte foto's toevoegen zodra beschikbaar (bouw, locatie, team)
- [ ] `cheerful_diverse_people.png` vervangen door authentieke bewonersfoto

### Fase 2 — Functionaliteit
- [ ] Google Analytics of Plausible toevoegen (privacyvriendelijk)
- [x] Open Graph meta-tags voor social media previews (2026-09-05, regie-item 372)
- [x] Sitemap.xml toevoegen (2026-09-05, plus robots.txt en canonical-tags)
- [ ] "Vrienden van Erve Meander" donateurslijst uitbreiden

### Fase 3 — Toekomstig (richting opening 2027/2028)
- [ ] Wachtlijst-formulier met e-mailbevestiging
- [ ] Nieuws/update sectie of nieuwsbrief
- [ ] Foto-galerij bouwvoortgang
- [ ] Routebeschrijving / Google Maps integratie

## Technische schuld

- Python-scripts (`copy_images.py`, `remove_bg.py`) zijn lokale hulpmiddelen — niet gekoppeld aan CI/CD
- `backup_old/` map opruimen als niet meer nodig
- CSS `?v=4` versietag handmatig bijhouden — erwegen een hash-gebaseerde aanpak
