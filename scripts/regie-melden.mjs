#!/usr/bin/env node
// Canonieke producent-helper voor regie.barkr.nl (fase 2, Control Tower-plan,
// ontwerpeis "elke producent leest de regie-sleutel zelf uit de eigen .env").
//
// Dit bestand is de ENE bron van waarheid voor dit patroon (voorkomt R8,
// kopie-drift). Kopieer het ongewijzigd naar scripts/regie-melden.mjs in een
// producerend project; wijzig een kopie nooit los, fix eerst hier en kopieer
// dan opnieuw. Bewust NIET "stuur-kaart.mjs" genoemd: bijna elk producerend
// project heeft al een eigen scripts/stuur-kaart.mjs dat naar de oude
// Kaarten-Postbus schrijft (writeFileSync) — een kopie onder die naam zou dat
// bestand stil overschrijven. Geen gedeeld npm-pakket nodig: het bestand is
// bewust klein en dependency-vrij (naast dotenv) zodat er weinig te laten
// driften valt.
//
// Leest REGIE_SLEUTEL (verplicht) en REGIE_URL (optioneel, default
// https://regie.barkr.nl) uit de .env van het aanroepende project. De sleutel
// komt nooit op stdout, in een foutmelding of in een log: alleen de naam van
// de env-var wordt genoemd, nooit de waarde (zie A9).
//
// Gebruik als module:
//   import { stuurItem, stuurHartslag, stuurStand } from './scripts/regie-melden.mjs';
//   await stuurItem({ type: 'fout', titel: '...', advies: '...' });
//   await stuurHartslag('mijn-job', 15);
//   await stuurHartslag('mijn-job', 15, { uitkomst: 'ok', omschrijving: 'nachtelijke sync', soort: 'job' });
//   await stuurStand({ soort: 'project', sleutel: 'pusher', titel: 'Pusher', stand: '...' });
//   await stuurRegisterBatch([{ soort: 'project', sleutel: 'pusher', omschrijving: '...', waar: '...' }]);
//   await stuurAanvulling(322, 'WhatsApp met de leverancier op 31-08: al besproken');
//   const item = await haalItem(461);           // status navragen van één kaart
//   const lijst = await haalItems({ status: 'beantwoord', open: true });
//
// Gebruik als CLI (handig voor een cronregel of een quick test):
//   node scripts/regie-melden.mjs item --type fout --titel "..." --advies "..."
//   node scripts/regie-melden.mjs hartslag <job> [interval-minuten] [--uitkomst ...] [--omschrijving ...] [--soort job|ritueel]
//   node scripts/regie-melden.mjs stand --soort project --sleutel pusher --titel "Pusher" --stand "..." [--medewerker ...] [--toestand loopt|wacht|storing|klaar] [--waar ...]
//   node scripts/regie-melden.mjs pensioen <job> --reden "deze job bestaat niet meer omdat ..."
//   node scripts/regie-melden.mjs aanvulling <item-id> "<wat er intussen al bekend of gebeurd is>"
//   node scripts/regie-melden.mjs status <item-id>
//
// Een bestaand item op een volgende status zetten hoort hier niet thuis: daar is
// scripts/zet-status.mjs voor, dat de toelichting verplicht stelt en alleen de
// overgangen aanbiedt die een agent mag maken.
//
// PEILEN IN PLAATS VAN WACHTEN. Een sessie die een kaart heeft verstuurd en op
// antwoord wacht, hoeft dat niet blind te doen: `node scripts/regie-melden.mjs
// status <id>` (of `haalItem(id)` als module) laat in één aanroep zien of de
// kaart nog openstaat, en zo ja wat de huidige status en het antwoord zijn.
// Dat is de helft van de oplossing; de andere helft is dat iemand die aanroep
// ook echt doet in plaats van te wachten tot Aldo het zelf meldt.

import { config as laadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { basename, dirname, join, resolve, sep } from 'node:path';

// .env staat op de projectroot (scripts/ + .env als vaste conventie), niet in de
// werkmap van de aanroeper. Zo werkt het script ook vanuit een hook of cronregel
// die niet eerst naar de projectroot cd't.
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTMAP = resolve(__dirname, '..');
// quiet: dotenv 17 schrijft anders een reclamebanner met een externe domeinnaam naar
// stdout. Die banner is onschuldig (sponsortekst van het pakket), maar hij staat wél
// midden in de uitvoer van een script dat de regie-sleutel draagt, en dat leest als
// iets wat het niet is. Zelfde keuze als in regie-lijst.mjs en regie-intrekken.mjs.
laadEnv({ path: join(__dirname, '..', '.env'), quiet: true });

const REGIE_URL = (process.env.REGIE_URL ?? 'https://regie.barkr.nl').replace(/\/+$/, '');

function vereisSleutel() {
  const sleutel = process.env.REGIE_SLEUTEL;
  if (!sleutel) {
    throw new Error('REGIE_SLEUTEL ontbreekt in .env (waarde nooit hier loggen, alleen de variabelenaam).');
  }
  return sleutel;
}

// Eigen tijdslimiet per poging, sinds 27-08-2026 (architect-review op commit
// 0c97776, verbeterpunt 1). Zonder deze regel heeft een aanroep hier helemaal
// geen eigen begrenzing en valt hij terug op de standaardinstelling van de
// HTTP-laag van Node: ongeveer vijf minuten wachten op een server die de
// verbinding wél aanneemt maar daarna zwijgt. Dat is precies het geval waar
// het misgaat, want een server die niets terugstuurt ziet er voor de aanroeper
// hetzelfde uit als een trage server.
//
// Waarom dat er hier toe doet: scripts/lib/hartslag-melden.ps1 draait dit
// bestand als los proces, drie keer, met pauzes van 2 en 6 seconden ertussen.
// Die hele reeks moet passen tussen het moment dat de mantel zijn kind afschiet
// (timeoutMinuten in scripts/bewaakte-taken.json) en het moment dat de
// Taakplanner de mantel zélf afschiet (ExecutionTimeLimit). Schiet Windows de
// mantel af voordat de melding weg is, dan komt er helemaal geen melding, ook
// geen foutmelding, en zwijgt de taak precies wanneer er iets aan de hand is.
//
// Met dertig seconden per poging duurt de hele reeks hooguit ongeveer twee
// minuten, tegen ruim een kwartier zonder eigen limiet. In beide gevallen paste
// het binnen de half uur die er nu tussen zit, dus dit repareert geen storing
// die er was. Het verschil is dat de marge die in het `_uitleg`-veld van
// bewaakte-taken.json beloofd wordt nu volgt uit een getal dat hier zichtbaar
// staat, in plaats van uit een standaardinstelling van een bibliotheek die bij
// een volgende versie stilletjes anders kan zijn.
//
// Dertig en niet vijftien: het gaat om een klein berichtje naar een server die
// normaal binnen een seconde antwoordt, dus dertig seconden is al buitensporig
// veel, en op een machine die op dat moment nauwelijks vooruitkomt (de
// aanleiding van storing 154) is een ruime marge meer waard dan een strakke.
const TIJDSLIMIET_MS = 30_000;

async function verzoek(pad, methode, body) {
  let respons;
  try {
    respons = await fetch(`${REGIE_URL}${pad}`, {
      method: methode,
      headers: {
        'content-type': 'application/json',
        'x-regie-sleutel': vereisSleutel(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIJDSLIMIET_MS),
    });
  } catch (fout) {
    // De eigen fouttekst van een afgebroken aanroep is Engels en zegt niet welke
    // aanroep het was ("The operation was aborted due to timeout"). Hier staat
    // wat er gebeurde, welk pad het betrof en hoe lang er gewacht is. De sleutel
    // komt er bewust niet in voor: alleen het pad, nooit een header of de URL
    // met inhoud (A9).
    if (fout?.name === 'TimeoutError' || fout?.name === 'AbortError') {
      throw new Error(
        `regie ${pad} gaf binnen ${TIJDSLIMIET_MS / 1000} seconden geen antwoord (afgebroken).`,
      );
    }
    throw fout;
  }
  const tekst = await respons.text();
  let data;
  try {
    data = tekst ? JSON.parse(tekst) : {};
  } catch {
    data = { fout: `onverwachte respons (geen JSON): ${tekst.slice(0, 200)}` };
  }
  if (!respons.ok) {
    throw new Error(`regie ${pad} gaf ${respons.status}: ${data.fout ?? tekst.slice(0, 200)}`);
  }
  return data;
}

async function post(pad, body) {
  return verzoek(pad, 'POST', body ?? {});
}

// LEESKANT (toegevoegd 2026-09-05, na regie-item over een sessie die een
// beantwoorde kaart nooit signaal kreeg). Tot nu toe was dit bestand
// schrijf-alleen: een producent kon een kaart aanmaken of bijwerken, maar
// nooit zelf navragen wat de status ervan is. Het antwoord op een kaart
// bereikt de makende sessie op dit moment alléén via twee wegen: Aldo zegt
// het zelf in de chat, of (voor Tweede brein specifiek) de eerstvolgende
// sessie van dat ene project haalt bij het opstarten de openstaande
// beantwoord-items op (CLAUDE.md van dit project, hoofdstuk "Menslus").
// Voor elk ander producerend project bestond er geen manier om zelf na te
// gaan of een kaart al beantwoord is: een sessie die op antwoord wacht kan
// alleen wachten, niet peilen. Vandaar deze twee functies, die de al
// bestaande, tot nu toe ongebruikte leesroutes van de server (GET
// /api/items/:id en GET /api/items) ontsluiten voor elke producent.
export async function haalItem(id) {
  const nummer = Number(id);
  if (!Number.isInteger(nummer) || nummer < 1) {
    throw new Error(`item-id moet een positief geheel getal zijn, kreeg "${id}".`);
  }
  return verzoek(`/api/items/${nummer}`, 'GET');
}

// status/open/limiet zijn alle drie optioneel, rechtstreeks doorgegeven als
// querystring-parameters van GET /api/items (zie server.ts van dit project
// voor de betekenis van elk).
export async function haalItems({ status, open, limiet } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (open) params.set('open', '1');
  if (limiet) params.set('limiet', String(limiet));
  const qs = params.toString();
  return verzoek(`/api/items${qs ? `?${qs}` : ''}`, 'GET');
}

// CONTEXTCHECK (communicatiecirkel stap 1, regie-item 328, antwoord Aldo
// 2026-09-01: "de vault is het geheugen, regie blijft de bewaker van vragen").
// Vóór een vraag, voorstel, actie of onduidelijkheid de deur uit gaat, kijkt dit
// script of het onderwerp al ergens bekend is: in de open regie-items, in de
// WhatsApp-opslag van de laatste dagen en in de vault van Tweede brein.
// Aanleiding: kaart 322 stelde Aldo een vraag over een afboeking waar hij via
// WhatsApp al contact over had. Vindt de check iets, dan komt er één regel
// "Mogelijk al bekend: ..." bovenaan de context, zodat de kaart het zelf zegt.
// "Mogelijk" is bewust: het is een aanwijzing op grond van woordovereenkomst,
// geen vaststelling. De check beslist niets (A10): de kaart gaat gewoon door;
// de sessie of Aldo trekt hem desgewenst in.
//
// De zoekmodule zelf staat in Tweede brein (scripts/contextcheck.mjs) en wordt
// gevonden via ~/.claude/contextcheck.json, zodat de kopieën van dit bestand in
// andere projecten geen eigen kopie van de module nodig hebben. Dat bestand
// staat op hetzelfde vertrouwensniveau als ~/.claude/settings.json (wie het kan
// schrijven, kan ook hooks laten draaien); toch wordt het pad getoetst voordat
// het geladen wordt: het moet onder de eigen thuismap liggen en contextcheck.mjs
// heten, zodat een tikfout of een ondergeschoven pad geen willekeurige code
// laadt in acht projecten (architect-review 2026-09-01, verbeterpunt 6).
// Ontbreekt het bestand of de module, of gaat er onderweg iets mis, dan slaat
// de check over met één regel op stderr en gaat het item onveranderd door: een
// verdwenen kaart is erger dan een kaart zonder contextregel. Uitzetten kan per
// aanroep (contextcheck: false, of --contextcheck nee op de CLI) en per omgeving
// (REGIE_CONTEXTCHECK=uit; zo draaien de tests van regie, die geen bronnen op
// schijf willen lezen). Een fout-item krijgt geen check: dat is een melding
// over iets dat stuk is, geen vraag die elders al beantwoord kan zijn.
//
// Bereik: standaard kijkt de check alleen in zakelijke bronnen (zakelijke
// WhatsApp-connector, zakelijke dossiers, open regie-items). Alleen een project
// waarvan de projectmap in `volledigBereik` van contextcheck.json staat (Tweede
// brein zelf) kijkt ook in privébronnen. Dat is dezelfde lijst die de nachtelijke
// kaartcontrole gebruikt; een omgevingsvariabele die het bereik verruimt is er
// bewust niet, want een geërfde variabele uit een ouderproces zou anders elke
// kopie verruimen (architect-review 2026-09-01 ronde 2, punt 2). Zie de kop van
// contextcheck.mjs.
const CONTEXTCHECK_TYPEN = ['vraag', 'voorstel', 'actie', 'onduidelijkheid'];
const CONTEXTCHECK_CONFIG = join(homedir(), '.claude', 'contextcheck.json');
const CONTEXTCHECK_MODULENAAM = 'contextcheck.mjs';
// Zelfde grens als item-validatie.ts in regie: een context die daar overheen
// gaat wordt met 400 geweigerd, en dan was de hele kaart weg.
const MAX_CONTEXT = 4000;

// Alleen een pad onder de eigen thuismap, en alleen een bestand met de vaste
// naam. Windows vergelijkt paden zonder onderscheid in hoofdletters.
export function isToegestaanModulepad(pad, thuis = homedir()) {
  if (typeof pad !== 'string' || !pad.trim()) return false;
  const vol = resolve(pad);
  if (basename(vol) !== CONTEXTCHECK_MODULENAAM) return false;
  const wortel = resolve(thuis) + sep;
  return process.platform === 'win32'
    ? vol.toLowerCase().startsWith(wortel.toLowerCase())
    : vol.startsWith(wortel);
}

async function voerContextcheckUit({ titel, context }) {
  if (!existsSync(CONTEXTCHECK_CONFIG)) {
    return { regel: null, melding: 'overgeslagen, geen ~/.claude/contextcheck.json op deze machine', overgeslagen: [] };
  }
  const config = JSON.parse(readFileSync(CONTEXTCHECK_CONFIG, 'utf8'));
  if (!isToegestaanModulepad(config.script)) {
    return { regel: null, melding: 'overgeslagen, het modulepad in contextcheck.json ligt niet onder de thuismap of heet niet contextcheck.mjs', overgeslagen: [] };
  }
  if (!existsSync(config.script)) {
    return { regel: null, melding: 'overgeslagen, de zoekmodule uit contextcheck.json is niet gevonden', overgeslagen: [] };
  }
  const module = await import(pathToFileURL(config.script).href);
  // De projectmap (de map boven scripts/, waar ook de .env staat) is de enige
  // sleutel tot het ruime bereik. Mist de module die functie, dan zakelijk.
  const bereik = typeof module.bereikVoorMap === 'function' && typeof module.normaliseerConfig === 'function'
    ? module.bereikVoorMap(module.normaliseerConfig(config), PROJECTMAP)
    : 'zakelijk';
  const zoeker = await module.maakZoeker({ regie: { url: REGIE_URL, sleutel: vereisSleutel() } });
  const uitkomst = zoeker.zoek({ titel, context, bereik });
  return {
    regel: uitkomst.regel,
    melding: uitkomst.regel
      ? `${uitkomst.hits.length} treffer(s) gevonden (bereik ${bereik}), regel "Mogelijk al bekend" bovenaan de context gezet`
      : `niets gevonden (${uitkomst.termen.length} zoektermen, bereik ${bereik}, ${zoeker.duurMs} ms)`,
    overgeslagen: [...zoeker.overgeslagen, ...uitkomst.overgeslagen],
  };
}

// SCHRIJFWIJZE titel/context/advies (Aldo, 2026-08-25): dit komt woordelijk op een
// Telegram-kaart terecht die Aldo op straat op zijn telefoon leest, zonder dat er
// iemand bij zit om het uit te leggen. Gewone taal, geen vaktermen uit de eigen
// code of architectuur zonder uitleg. Niet: "de statusmachine staat vanuit
// voorgelegd alleen de overgang naar beantwoord toe." Wel: "je kunt dit item nu
// alleen zelf afronden, een agent mag dat niet voor je doen." Is het mechanisme
// abstract, zet er dan een concreet voorbeeld bij in plaats van alleen de regel.
// Geldt voor elk type, met name voorstel en actie (daar zit meestal de meeste
// uitleg in advies). context blijft binnen de 3 regels uit de interactieformule
// (CLAUDE.md van dit project); advies mag iets langer, maar blijft één alinea die
// in één keer leesbaar is op een telefoonscherm.
// KEUZES EN VOORKEUR (Aldo, regie-item 110, 26-08-2026). Een kaart met alleen een
// constatering erop is geen advies: Aldo moet dan zelf bedenken wat de mogelijke
// wegen zijn, en dat is precies het doorgeefluik-werk dat dit systeem hoort weg te
// nemen. Elke kaart die iets van hem vraagt zet daarom minimaal twee keuzes onder
// elkaar in `opties`, met `voorkeur` op het nummer (1-gebaseerd) van de keuze die
// wordt aangeraden. Regie zet er dan een ster voor, zodat hij die er in één
// oogopslag uit haalt.
//
// Is er echt niets te kiezen (een zuivere melding ter kennisgeving), zeg dat dan
// met `geenKeuze: "<waarom niet>"`. Zwijgen mag niet; zwijgen was de fout.
export function controleerKeuzes({ opties, voorkeur, geenKeuze }) {
  if (geenKeuze) {
    if (String(geenKeuze).trim().length < 10) {
      return 'geenKeuze moet uitleggen waarom er niets te kiezen valt (minimaal 10 tekens).';
    }
    return null;
  }
  if (!Array.isArray(opties) || opties.length < 2) {
    return 'geef minimaal twee keuzes mee in opties, zodat Aldo iets te kiezen heeft in plaats van alleen een constatering.';
  }
  const nummer = Number(voorkeur);
  if (!Number.isInteger(nummer) || nummer < 1 || nummer > opties.length) {
    return `zet voorkeur op het nummer van de keuze die je aanraadt (1 tot en met ${opties.length}); zonder voorkeur staat er nergens wat jij zou doen.`;
  }
  return null;
}

// type: vraag | actie | fout | onduidelijkheid | voorstel. advies is verplicht (A10).
// contextcheck: standaard aan, zie het blok CONTEXTCHECK hierboven.
export async function stuurItem({ type, titel, context, advies, adviesrol, opties, voorkeur, label, concept, geenKeuze, contextcheck = true }) {
  // Bewust een waarschuwing en geen fout op deze route. De automatische melders
  // (nachtjobs, hooks) roepen stuurItem rechtstreeks aan; gooien zou hun melding
  // laten verdampen, en een verdwenen storingsmelding is erger dan een kale kaart.
  // Dat is dezelfde afweging als bij de quarantaine van 2026-08-24. De CLI-route
  // hieronder weigert wél, want daar zit een sessie aan de knoppen die het meteen
  // beter kan doen.
  const bezwaar = controleerKeuzes({ opties, voorkeur, geenKeuze });
  if (bezwaar) {
    console.warn(`let op, kaart zonder keuzes: ${bezwaar}`);
  }
  if (contextcheck && CONTEXTCHECK_TYPEN.includes(type) && process.env.REGIE_CONTEXTCHECK !== 'uit') {
    // Alles op stderr, zodat stdout (de JSON van regie) schoon blijft voor wie
    // het script als commando aanroept. Nooit gooien: zie het blok hierboven.
    try {
      const uitkomst = await voerContextcheckUit({ titel, context });
      for (const o of uitkomst.overgeslagen) console.error(`contextcheck: ${o}`);
      console.error(`contextcheck: ${uitkomst.melding}`);
      if (uitkomst.regel) {
        const nieuw = context ? `${uitkomst.regel}\n${context}` : uitkomst.regel;
        if (nieuw.length <= MAX_CONTEXT) context = nieuw;
        else console.error(`contextcheck: regel niet toegevoegd, context zou langer worden dan ${MAX_CONTEXT} tekens`);
      }
    } catch (fout) {
      console.error(`contextcheck: overgeslagen, ${fout?.message ?? fout}`);
    }
  }
  return post('/api/items', { type, titel, context, advies, adviesrol, opties, voorkeur, label, concept });
}

// Eén regel "Mogelijk al bekend" toevoegen aan een kaart die nog niet verstuurd
// is (status nieuw, voorwerk of klaar), van welk project dan ook. Dit is de
// tweede helft van de contextcheck: de nachtelijke kaartcontrole van Tweede brein
// (scripts/kaartcontrole.mjs) gebruikt hem voor kaarten die tussen aanmaken en
// versturen achterhaald raakten, en een sessie gebruikt hem als zij ziet dat het
// onderwerp van een eigen kaart intussen elders al besproken is (werkregel
// "wie een kaart stuurt, werkt hem bij", 2026-09-01). Regie zet de regel als
// "Mogelijk al bekend (<project>): <tekst>" bovenaan de context, laat dezelfde tekst niet
// twee keer toe en houdt het op drie regels per kaart. Een kaart die al bij Aldo
// ligt wordt met 409 geweigerd: die tekst staat al op zijn telefoon, en wat er
// dan nog te doen valt (intrekken, antwoorden) is aan hem of aan zet-status.
export async function stuurAanvulling(id, tekst) {
  const nummer = Number(id);
  if (!Number.isInteger(nummer) || nummer < 1) {
    throw new Error(`item-id moet een positief geheel getal zijn, kreeg "${id}".`);
  }
  return post(`/api/items/${nummer}/aanvulling`, { tekst });
}

// uitkomst/omschrijving/soort zijn alle drie optioneel (bouwstap 3, besluit 18 in
// docs/DECISIONS.md): een producent die ze niet meestuurt blijft gewoon werken.
// soort is 'job' of 'ritueel'; regie zet 'job' als niets is opgegeven.
export async function stuurHartslag(job, intervalMinuten = 60, { uitkomst, omschrijving, soort } = {}) {
  return post(`/api/hartslag/${encodeURIComponent(job)}`, {
    interval_minuten: intervalMinuten,
    uitkomst,
    omschrijving,
    soort,
  });
}

// Stand van zaken melden (besluit 32). Eén regel gewone taal over hoe het ervoor
// staat met een project, dossier of taak, geschreven door de agent die eraan
// werkt. Regie verzint zo'n regel nooit zelf (A10), dus zonder deze melding
// blijft het onderwerp op de statuspagina leeg en grijs, niet groen.
// Herhaald aanroepen met dezelfde soort+sleutel werkt de bestaande regel bij;
// dit is een prikbord, geen logboek, dus de vorige tekst gaat verloren.
export async function stuurStand({ soort, sleutel, titel, stand, medewerker, toestand, waar }) {
  return post('/api/stand', { soort, sleutel, titel, stand, medewerker, toestand, waar });
}

// Eén vulronde van het register in één aanroep (inrichtingsadvies §9,
// regie-item 57, stap 1). Geen eigen validatie hier: de server keurt
// soort/sleutel-vorm en dubbele (soort, sleutel)-combinaties af
// (registerregels.ts), dit is alleen het transportlaagje overeenkomstig het
// prikbord-patroon van stuurStand hierboven.
//
// volledigeSoorten (inrichtingsadvies stap 6, inventarisatieronde): optionele
// lijst van soorten waarvoor `rijen` de volledige, actuele stand is. De
// server markeert dan elke bestaande actieve regel van zo'n soort die niet in
// `rijen` voorkomt als verdwenen (register.actief = false), nooit een harde
// delete. Leeg of weggelaten verandert niets aan dat gedrag (puur additief).
export async function stuurRegisterBatch(rijen, volledigeSoorten = []) {
  return post('/api/register/batch', { rijen, volledigeSoorten });
}

// Een job die echt niet meer bestaat opruimen (besluit 31). Alleen toegestaan
// voor een eigen, vermiste hartslag waarvan Aldo het gekoppelde fout-item al
// beantwoord heeft; anders weigert regie met 403. Geen verwijdering: de rij
// blijft staan en een nieuwe hartslag zet de bewaking vanzelf weer aan.
export async function stuurMetPensioen(job, reden) {
  return post(`/api/hartslag/${encodeURIComponent(job)}/pensioen`, { reden });
}

const HARTSLAG_VLAGGEN = ['uitkomst', 'omschrijving', 'soort'];
const ITEM_VLAGGEN = ['type', 'titel', 'context', 'advies', 'adviesrol', 'opties', 'voorkeur', 'label', 'concept', 'geen-keuze', 'contextcheck'];
const STAND_VLAGGEN = ['soort', 'sleutel', 'titel', 'stand', 'medewerker', 'toestand', 'waar'];
const PENSIOEN_VLAGGEN = ['reden'];
const SOORTEN = ['job', 'ritueel'];
const CONCEPT_JA = ['true', 'ja', '1'];
const CONCEPT_NEE = ['false', 'nee', '0'];
const STAND_SOORTEN = ['project', 'dossier', 'taak'];
const TOESTANDEN = ['loopt', 'wacht', 'storing', 'klaar'];

// Vlagparser, fail-closed. Een onbekende vlag, een los woord op een vlagpositie
// of een vlag zonder waarde stopt het script met een duidelijke fout, in plaats
// van de waarde stil te laten verdwijnen. Reden: bij de architect-review van
// 2026-08-23 bleek dat een weggelaten interval-argument
// (`hartslag <job> --uitkomst ok`, precies wat de gebruiksregel toestaat) de
// uitkomst geruisloos liet verdampen terwijl de aanroeper exitcode 0 zag —
// hetzelfde stille-no-op-patroon als besluit 15.
function leesVlaggen(argv, toegestaan) {
  const uit = {};
  for (let i = 0; i < argv.length; i += 2) {
    const rauw = argv[i];
    if (!rauw.startsWith('--')) {
      throw new Error(`onverwacht argument "${rauw}": hier wordt een vlag verwacht die met -- begint.`);
    }
    const sleutel = rauw.slice(2);
    if (!toegestaan.includes(sleutel)) {
      throw new Error(`onbekende vlag "--${sleutel}". Toegestaan: ${toegestaan.map((t) => `--${t}`).join(', ')}.`);
    }
    if (i + 1 >= argv.length) {
      throw new Error(`vlag "--${sleutel}" heeft geen waarde.`);
    }
    const waarde = argv[i + 1];
    // Een waarde die zelf met -- begint is vrijwel altijd een vergeten waarde,
    // niet een bedoelde tekst: anders slikt "--uitkomst --omschrijving x" de
    // volgende vlag op als tekst en verdwijnt die stil.
    if (waarde.startsWith('--')) {
      throw new Error(`vlag "--${sleutel}" heeft geen waarde: "${waarde}" is zelf een vlag.`);
    }
    uit[sleutel] = waarde;
  }
  return uit;
}

async function cli() {
  const [commando, ...rest] = process.argv.slice(2);
  if (commando === 'hartslag') {
    const [job, ...vervolg] = rest;
    if (!job || job.startsWith('--')) {
      console.error('Gebruik: node regie-melden.mjs hartslag <job> [interval-minuten] [--uitkomst ...] [--omschrijving ...] [--soort job|ritueel]');
      process.exit(1);
    }
    // Het interval is optioneel en positioneel: alleen als het eerstvolgende
    // argument géén vlag is, is het het interval.
    let interval;
    let vlaggen = vervolg;
    if (vervolg.length && !vervolg[0].startsWith('--')) {
      interval = Number(vervolg[0]);
      if (!Number.isFinite(interval) || interval <= 0) {
        throw new Error(`interval-minuten moet een positief getal zijn, kreeg "${vervolg[0]}".`);
      }
      vlaggen = vervolg.slice(1);
    }
    const extra = leesVlaggen(vlaggen, HARTSLAG_VLAGGEN);
    if (extra.soort && !SOORTEN.includes(extra.soort)) {
      throw new Error(`--soort moet ${SOORTEN.join(' of ')} zijn, kreeg "${extra.soort}".`);
    }
    const resultaat = await stuurHartslag(job, interval, extra);
    console.log(resultaat);
    return;
  }
  if (commando === 'item') {
    const velden = leesVlaggen(rest, ITEM_VLAGGEN);
    // Splitst op | of op komma. De komma alleen was een valkuil: een antwoordknop
    // met een komma erin ("ja, morgen") werd stil twee knoppen, en wie dat omzeilde
    // met een | kreeg juist één knop met een streep erin. Beide gingen al een keer
    // mis. Nu wint de | zodra hij voorkomt, zodat komma's in een knoptekst mogen.
    if (velden.opties) {
      velden.opties = velden.opties
        .split(velden.opties.includes('|') ? '|' : ',')
        .map((o) => o.trim())
        .filter(Boolean);
    }
    velden.geenKeuze = velden['geen-keuze'];
    delete velden['geen-keuze'];
    // Vlagwaarden komen hier altijd binnen als tekst, dus "--concept true" gaf
    // de string "true" door aan een server die op de booleaanse waarde wachtte.
    // De vlag verdween daardoor geruisloos en het item werd alsnog bezorgd: op
    // 26-08-2026 kreeg Aldo zo een proefkaart voorgelegd die alleen bedoeld was
    // om de opmaak te controleren. Vandaar hier een echte boolean, en fail-closed
    // op alles wat niet duidelijk ja of nee zegt (zelfde lijn als --soort en
    // --toestand).
    for (const naam of ['concept', 'contextcheck']) {
      if (velden[naam] === undefined) continue;
      const waarde = String(velden[naam]).trim().toLowerCase();
      if (CONCEPT_JA.includes(waarde)) velden[naam] = true;
      else if (CONCEPT_NEE.includes(waarde)) velden[naam] = false;
      else {
        throw new Error(
          `--${naam} moet ${CONCEPT_JA.join('/')} of ${CONCEPT_NEE.join('/')} zijn, kreeg "${velden[naam]}".`,
        );
      }
    }
    // Hier wél weigeren in plaats van waarschuwen: op deze route zit een sessie
    // aan de knoppen, en die kan de kaart meteen fatsoenlijk maken. Er gaat niets
    // verloren, want het item bestaat op dit moment nog niet.
    const bezwaar = controleerKeuzes(velden);
    if (bezwaar) {
      throw new Error(
        `${bezwaar}\nVoorbeeld: --opties "Nu herstellen|Tot maandag laten staan" --voorkeur 1` +
          '\nIs er echt niets te kiezen: --geen-keuze "alleen ter kennisgeving, er valt niets te beslissen".',
      );
    }
    const resultaat = await stuurItem(velden);
    console.log(resultaat);
    return;
  }
  if (commando === 'stand') {
    const velden = leesVlaggen(rest, STAND_VLAGGEN);
    // Fail-closed op dezelfde manier als --soort bij hartslag: liever hier een
    // duidelijke fout dan een 400 van de server of, erger, een melding die
    // stil onder de verkeerde soort belandt.
    if (!STAND_SOORTEN.includes(velden.soort)) {
      throw new Error(`--soort moet ${STAND_SOORTEN.join(', ')} zijn, kreeg "${velden.soort ?? ''}".`);
    }
    if (velden.toestand && !TOESTANDEN.includes(velden.toestand)) {
      throw new Error(`--toestand moet ${TOESTANDEN.join(', ')} zijn, kreeg "${velden.toestand}".`);
    }
    const resultaat = await stuurStand(velden);
    console.log(resultaat);
    return;
  }
  if (commando === 'pensioen') {
    const [job, ...vervolg] = rest;
    if (!job || job.startsWith('--')) {
      console.error('Gebruik: node regie-melden.mjs pensioen <job> --reden "waarom deze job niet meer bestaat"');
      process.exit(1);
    }
    const { reden } = leesVlaggen(vervolg, PENSIOEN_VLAGGEN);
    const resultaat = await stuurMetPensioen(job, reden);
    console.log(resultaat);
    return;
  }
  if (commando === 'aanvulling') {
    const [id, tekst, ...teveel] = rest;
    if (!id || id.startsWith('--') || !tekst || teveel.length) {
      console.error('Gebruik: node regie-melden.mjs aanvulling <item-id> "<wat er intussen al bekend of gebeurd is>"');
      console.error('         (één regel, 5 tot 400 tekens; alleen voor een kaart die nog niet verstuurd is)');
      process.exit(1);
    }
    const resultaat = await stuurAanvulling(id, tekst);
    console.log(resultaat);
    return;
  }
  if (commando === 'status') {
    const [id, ...teveel] = rest;
    if (!id || id.startsWith('--') || teveel.length) {
      console.error('Gebruik: node regie-melden.mjs status <item-id>');
      process.exit(1);
    }
    const item = await haalItem(id);
    console.log(item);
    return;
  }
  console.error('Gebruik: node regie-melden.mjs item --type <type> --titel "..." --advies "..." --opties "a|b" --voorkeur 1 [--context ...] [--adviesrol ...] [--label nu] [--contextcheck ja|nee]');
  console.error('         (minimaal twee keuzes plus --voorkeur; alleen een melding zonder keuze: --geen-keuze "waarom niet")');
  console.error('     of: node regie-melden.mjs hartslag <job> [interval-minuten] [--uitkomst ...] [--omschrijving ...] [--soort job|ritueel]');
  console.error('     of: node regie-melden.mjs stand --soort project|dossier|taak --sleutel <sleutel> --titel "..." --stand "..." [--medewerker ...] [--toestand loopt|wacht|storing|klaar] [--waar ...]');
  console.error('     of: node regie-melden.mjs pensioen <job> --reden "..."');
  console.error('     of: node regie-melden.mjs aanvulling <item-id> "<wat er intussen al bekend of gebeurd is>"');
  console.error('     of: node regie-melden.mjs status <item-id>');
  console.error('Een item op een volgende status zetten: node scripts/zet-status.mjs <item-id> <status> "<toelichting>"');
  process.exit(1);
}

// Alleen de CLI draaien als dit bestand direct aangeroepen wordt, niet bij een import.
// pathToFileURL (niet een handmatige `file://`-string): op Windows bevat process.argv[1]
// een backslash-pad met stationsletter en eventuele spaties, die niet letterlijk gelijk is
// aan de percent-gecodeerde import.meta.url. Zonder deze vergelijking startte de CLI op de
// werk-pc nooit (stille no-op, exitcode 0) — gevonden bij de architect-review van 2026-08-23.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((fout) => {
    console.error(fout.message ?? fout);
    process.exit(1);
  });
}
