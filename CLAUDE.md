# Erve Meander — Website

Informatiewebsite voor een kleinschalig, duurzaam zorg-erf in Hellendoorn voor bewoners van 16 tot 86 jaar. Start gepland in 2027.

## Project type

Statische HTML/CSS/JS website — geen build-stap, geen npm, geen framework.

## Bestandsstructuur

```
index.html          ← hoofdpagina
styles.css          ← alle opmaak
script.js           ← animaties / interactie
blog1/2/3.html      ← blogpagina's
logo.png, *.png/jpg ← afbeeldingen
backup_old/         ← oude versie (niet deployen)
```

## Deploy

Live URL: **https://ervemeander.barkr.nl**

Deploy gaat via GitHub Actions self-hosted runner op de Raspberry Pi:

```
GitHub push → main → GitHub Actions (Pi) → /var/www/ervemeander/
```

### Eerste keer instellen (eenmalig op Pi)

```bash
ssh pi@192.168.1.38
~/add-app.sh ervemeander https://github.com/Legalfiction/Erven_Meeander_Webiste --static
```

Daarna in GitHub repo → Settings → Actions → Runners → voeg Pi-runner toe.

### Handmatig deployen

```bash
ssh pi@192.168.1.38
sudo rsync -a --delete ~/apps/ervemeander/ /var/www/ervemeander/ --exclude='.git' --exclude='backup_old' --exclude='*.py'
```

## Pi-verbinding

```
SSH: pi@192.168.1.38
Webroot: /var/www/ervemeander/
Repo op Pi: ~/apps/ervemeander/
```

## Hosting infrastructuur

Zie `C:\Users\RDPgebruiker\Claude VS Code\Projecten\pi-hosting\CLAUDE.md` voor de volledige Pi-setup (nginx, Cloudflare Tunnel, GitHub Actions runner).
