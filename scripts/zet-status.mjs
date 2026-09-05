#!/usr/bin/env node
// Zet één item op een volgende status via de API, met een verplichte toelichting.
// Bedoeld voor de agentkant van de lus: Aldo beantwoordt een item in Telegram, een
// sessie voert het uit en zet het daarna op `uitgevoerd` met in de toelichting wat
// er feitelijk gebeurd is. Zonder dit script bleef die stap handwerk en bleven
// beantwoorde items eindeloos op `beantwoord` staan.
//
// Bewust géén vrije keuze uit alle statussen: de statusmachine bepaalt wat mag,
// en de beslissingen die écht aan Aldo zijn (parkeren, laten vervallen) horen
// via Telegram te lopen (A6).
//
// `afgerond` staat hier sinds 2026-08-25 wél bij. Daarvoor moest een agent
// stoppen op `uitgevoerd`, waarna de bewaker Aldo per Telegram vroeg "Dit is al
// gedaan. Klopt het zo?". Die vraag kon hij niet beoordelen en hoorde hij ook
// niet te krijgen: wie iets zelf uitvoert, sluit het zelf af. Regie stelt die
// vraag niet meer en rondt een item dat na dertig minuten nog op `uitgevoerd`
// staat zelf af (`src/afrondregels.ts`). Dat is een vangnet, geen vervanging:
// rond zelf af met een toelichting, anders blijft er alleen een kale
// systeemregel over waar niemand later iets aan heeft.
//
// Leest REGIE_SLEUTEL en optioneel REGIE_URL uit de .env van het aanroepende
// project, net als regie-melden.mjs. De sleutel komt nooit in de uitvoer (A9).
//
// Gebruik: node scripts/zet-status.mjs <item-id> <status> "<toelichting>"

import { config as laadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
laadEnv({ path: join(__dirname, '..', '.env') });

// Alleen de overgangen die de statusmachine aan een agent toestaat. Staat hier
// nog een keer los van de server: een typefout hoort hier te stranden en niet als
// 403 terug te komen nadat de aanroeper al dacht dat het gelukt was.
const TOEGESTAAN = ['uitgevoerd', 'voorwerk', 'klaar', 'afgerond'];

const [rauwId, status, toelichting] = process.argv.slice(2);
const id = Number(rauwId);
if (!Number.isInteger(id) || id < 1 || !TOEGESTAAN.includes(status) || !toelichting?.trim()) {
  console.error(`Gebruik: node scripts/zet-status.mjs <item-id> <${TOEGESTAAN.join('|')}> "<toelichting>"`);
  console.error('De toelichting is verplicht: een statuswissel zonder uitleg is later niet te lezen.');
  process.exit(1);
}
if (!process.env.REGIE_SLEUTEL) {
  console.error('REGIE_SLEUTEL ontbreekt in .env (waarde nooit loggen, alleen de variabelenaam).');
  process.exit(1);
}

const basis = (process.env.REGIE_URL ?? 'https://regie.barkr.nl').replace(/\/+$/, '');
const respons = await fetch(`${basis}/api/items/${id}/status`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-regie-sleutel': process.env.REGIE_SLEUTEL },
  body: JSON.stringify({ status, detail: toelichting }),
});
const tekst = await respons.text();
if (!respons.ok) {
  // Regie-item 86: een actie-item dat nog op 'voorgelegd' staat (nog geen
  // antwoord van Aldo) kan een agent nu toch afhandelen als er niets meer te
  // beslissen valt — maar niet via déze route. /status wijst dat geval terug
  // naar /afhandelen, dat de typecontrole (alleen 'actie') en de verplichte
  // toelichting bewaakt. Zonder deze val was dit script de enige toegangsweg
  // (CLAUDE.md: "nooit via een losse fetch") en dus zelf de blokkade voor het
  // item dat het net mogelijk maakte.
  if (respons.status === 400 && status === 'uitgevoerd' && /\/afhandelen/.test(tekst)) {
    const tweede = await fetch(`${basis}/api/items/${id}/afhandelen`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-regie-sleutel': process.env.REGIE_SLEUTEL },
      body: JSON.stringify({ toelichting }),
    });
    const tweedeTekst = await tweede.text();
    if (!tweede.ok) {
      console.error(`regie gaf ${tweede.status} op /afhandelen: ${tweedeTekst.slice(0, 300)}`);
      process.exit(1);
    }
    console.log(`#${id} -> uitgevoerd (via /afhandelen)`);
    process.exit(0);
  }
  console.error(`regie gaf ${respons.status}: ${tekst.slice(0, 300)}`);
  process.exit(1);
}
console.log(`#${id} -> ${status}`);
