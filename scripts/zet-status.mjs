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
laadEnv({ path: join(__dirname, '..', '.env'), quiet: true });

// Alleen de overgangen die de statusmachine aan een agent toestaat. Staat hier
// nog een keer los van de server: een typefout hoort hier te stranden en niet als
// 403 terug te komen nadat de aanroeper al dacht dat het gelukt was.
const TOEGESTAAN = ['uitgevoerd', 'voorwerk', 'klaar', 'afgerond'];

// Kaart 2293 (nalooprun punt 1): een omkeerbare keuze met ster zelf uitvoeren en afsluiten,
// zonder kaart bij Aldo (serverroute en regels: regie/src/namensaldo.ts, namensaldoregels.ts).
// Gebruik: node scripts/zet-status.mjs --besloten <item-id> "<waarom>" "<terugdraaien>"
if (process.argv[2] === '--besloten') {
  const [, rauwId, waarom, terugdraaien] = process.argv.slice(2);
  const itemId = Number(rauwId);
  if (!Number.isInteger(itemId) || itemId < 1 || !waarom?.trim() || !terugdraaien?.trim()) {
    console.error('Gebruik: node scripts/zet-status.mjs --besloten <item-id> "<waarom>" "<terugdraaien>"');
    console.error('Alleen voor een item met een geldige ster (voorkeur) dat al omkeerbaar is: de server weigert anders.');
    process.exit(1);
  }
  if (!process.env.REGIE_SLEUTEL) {
    console.error('REGIE_SLEUTEL ontbreekt in .env (waarde nooit loggen, alleen de variabelenaam).');
    process.exit(1);
  }
  const basis = (process.env.REGIE_URL ?? 'https://regie.barkr.nl').replace(/\/+$/, '');
  const r = await fetch(`${basis}/api/items/${itemId}/besloten`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-regie-sleutel': process.env.REGIE_SLEUTEL },
    body: JSON.stringify({ omkeerbaar: true, waarom, terugdraaien }),
  });
  const t = await r.text();
  // Geen process.exit() ná deze fetch: op dit Node-platform (24.15, Windows)
  // crasht dat hier hard op een libuv-assertion in async.c, met een foute
  // exitcode (127) terwijl de aanroep al goed is afgehandeld (geverifieerd met
  // drie herhaalde proeven op een echt item). process.exitCode zetten en de
  // rest van dit bestand overslaan (guard bij de generieke afhandeling onderaan)
  // laat Node vanzelf en schoon afsluiten zodra de socket dichtgaat.
  if (!r.ok) {
    console.error(`Niet namens Aldo besloten (${r.status}): ${t.slice(0, 500)}`);
    process.exitCode = 1;
  } else {
    console.log(t);
    process.exitCode = 0;
  }
} else {

// Kaart 1977: de vlag actie_aldo los bijzetten of weghalen, zonder statuswissel.
// Gebruik: node scripts/zet-status.mjs --actie-aldo <waarde|leeg> <item-id>
// Regie logt van/naar als gebeurtenis; een ander project dan het eigen krijgt 403
// (behalve tweedebrein als beheerder).
if (process.argv[2] === '--actie-aldo') {
  // Eén lijst, niet twee: regie-melden.mjs is de bron (architectpunt 2 bij 1977).
  // Zijn CLI-blok draait alleen als hij zelf het startscript is, dus importeren is veilig.
  const { ACTIE_ALDO: WAARDEN } = await import('./regie-melden.mjs');
  const [, waarde, rauw] = process.argv.slice(2);
  const itemId = Number(rauw);
  if (!Number.isInteger(itemId) || itemId < 1 || !(waarde === 'leeg' || WAARDEN.includes(waarde))) {
    console.error(`Gebruik: node scripts/zet-status.mjs --actie-aldo <${WAARDEN.join('|')}|leeg> <item-id>`);
    process.exit(1);
  }
  if (!process.env.REGIE_SLEUTEL) {
    console.error('REGIE_SLEUTEL ontbreekt in .env (waarde nooit loggen, alleen de variabelenaam).');
    process.exit(1);
  }
  const basis = (process.env.REGIE_URL ?? 'https://regie.barkr.nl').replace(/\/+$/, '');
  const r = await fetch(`${basis}/api/items/${itemId}/actie-aldo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-regie-sleutel': process.env.REGIE_SLEUTEL },
    body: JSON.stringify({ actie_aldo: waarde === 'leeg' ? null : waarde }),
  });
  const t = await r.text();
  if (!r.ok) {
    console.error(`Vlag niet gezet (${r.status}): ${t}`);
    process.exit(1);
  }
  console.log(t);
  process.exit(0);
}

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

// Tweede ogen (06-10-2026): een kaart met tweede_ogen=verplicht gaat pas naar
// uitgevoerd als de review verwerkt en door Aldo bevestigd is. Regie heeft de
// toelichting bewaard en het antwoord als wacht-op-review afgesloten; de
// uitvoerwachter start de kaart niet opnieuw. Eigen exitcode (3), zodat een
// aanroeper dit niet verwart met een gewone fout. Nooit de val naar /afhandelen.
function poortDicht(code, body) {
  if (code !== 409) return false;
  try {
    return JSON.parse(body).code === 'tweede-ogen-open';
  } catch {
    return false;
  }
}
function meldPoort(body) {
  let fout = body;
  try { fout = JSON.parse(body).fout; } catch { /* ruwe tekst */ }
  console.error(`#${id} NIET uitgevoerd: tweede ogen staat nog open.`);
  console.error(String(fout).slice(0, 500));
  console.error('Het werk is gedaan en de toelichting is bewaard; voer het niet opnieuw uit.');
  // Absoluut pad: deze kopie staat in elk project, het pakketscript alleen in
  // regie (nooit een kopie, zie de skill). Een relatief pad wees buiten regie
  // naar een bestand dat niet bestaat.
  const pakket = 'C:\\Users\\RDPgebruiker\\Claude VS Code\\Projecten\\regie\\scripts\\review-pakket.mjs';
  console.error(`Volgende stap: node "${pakket}" ${id} <invoer.json> (zie de skill /tweede-ogen).`);
  process.exitCode = 3;
}

if (poortDicht(respons.status, tekst)) {
  meldPoort(tekst);
} else if (!respons.ok) {
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
    if (poortDicht(tweede.status, tweedeTekst)) {
      meldPoort(tweedeTekst);
    } else if (!tweede.ok) {
      console.error(`regie gaf ${tweede.status} op /afhandelen: ${tweedeTekst.slice(0, 300)}`);
      process.exitCode = 1;
    } else {
      console.log(`#${id} -> uitgevoerd (via /afhandelen)`);
    }
  } else {
    console.error(`regie gaf ${respons.status}: ${tekst.slice(0, 300)}`);
    if (tekst.includes('overgang') && status === 'afgerond') {
      console.error('Tip: de statusmachine kent geen sprong van beantwoord naar afgerond.');
      console.error('Zet het item eerst op uitgevoerd, en daarna in dezelfde beurt op afgerond,');
      console.error('zodat de bewaker er geen controlekaart voor Aldo van kan maken.');
    }
    process.exitCode = 1;
  }
} else {
  console.log(`#${id} -> ${status}`);
}
}
