// stuur-kaart.mjs: bouwt een kaart-ervemeander-<JJJJMMDD-UUMM>.json en schrijft
// die naar de gedeelde Kaarten-Postbus (G:\Mijn Drive\Kaarten-Postbus), zodat
// de Kaartendienst (apart project) hem oppikt, publiceert en naar Aldo's
// Telegram stuurt. Dit script raakt Telegram nooit aan: geen token, geen
// chat-id nodig, alleen het schrijven van het juiste JSON-bestand.
//
// Schema: zie G:\Mijn Drive\Kaarten-Postbus\LEESMIJ.md. Achtergrond en
// aansluiting van dit project: zie CLAUDE.md, sectie "Kaartendienst-koppeling".
//
// Gebruik:
//   node scripts/stuur-kaart.mjs                    -> stuurt de ingebouwde
//                                                       INHOUD hieronder
//   node scripts/stuur-kaart.mjs --inhoud pad.json   -> stuurt de inhoud uit
//                                                       dat bestand in plaats
//                                                       daarvan
//
// Belangrijk voor een volgende keer: dit script verzint zelf nooit
// kernfeiten. "kernfeiten" en "secties" moeten telkens vers samengesteld
// worden door iemand (of een sessie) die CHANGELOG.md, PARKEERPLAATS.md en de
// recente git-log daadwerkelijk gelezen heeft, dat is een samenvattende
// afweging, geen mechanische bewerking die dit script kan doen. Werk dus
// vóór een nieuwe run ofwel het INHOUD-blok hieronder bij, ofwel geef een
// vers samengesteld --inhoud-bestand mee.

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTBUS = 'G:\\Mijn Drive\\Kaarten-Postbus';
const LOG_PAD = join(PROJECT_DIR, 'logs', 'stuur-kaart-log.txt');

// Vast, nooit per aanroep overschrijfbaar: de LEESMIJ.md-regel is dat
// "project" consequent dezelfde waarde moet zijn (kleine letters, geen
// spaties), zodat de Kaartendienst kaarten van dit project altijd herkent
// en bundelt (ochtendoverzicht, carry-forward, archiefpagina). Deze waarde
// staat ook vast in Kaartendienst\scripts\project-categorieen.mjs (groep
// "Zorg & Dossiers", venster 07:30).
const PROJECTNAAM = 'ervemeander';

// Standaardinhoud voor de eerstvolgende `node scripts/stuur-kaart.mjs`
// zonder --inhoud. Samengesteld op 2026-08-14 uit CHANGELOG.md,
// PARKEERPLAATS.md, MEMORY.md en de git-log (t/m commit ab43c7a). Werk dit
// blok bij vóór een volgende run, of gebruik --inhoud met een vers bestand.
const INHOUD = {
  titel: 'Erve Meander: stand van de website',
  urgentie: 'normaal',
  kernfeiten: [
    'De informatiewebsite (www.ervemeander.nl, statisch HTML/CSS/JS zonder framework, automatisch gedeployed vanaf de main-branch via Vercel) staat live en compleet: hero, visie, wonen & zorg, FAQ, blog en een werkend contactformulier.',
    'De laatste inhoudelijke wijziging was op 4 augustus (optie "Medewerker" toegevoegd aan het interesseformulier); daarvoor lag de nadruk in juni op navigatie- en blogpagina-fixes. Sindsdien, 10 dagen, geen nieuwe commit.',
    'Er staan drie nieuwe documentatiebestanden klaar die nog niet gecommit zijn (CHANGELOG.md, PARKEERPLAATS.md, docs/DECISIONS.md); PARKEERPLAATS.md zelf is leeg, er liggen op dit moment geen beslispunten open.',
  ],
  secties: [
    {
      kop: 'Wat er nieuw is',
      punten: [
        '4 augustus 2026: optie "Medewerker" toegevoegd aan het interesseformulier (commit ab43c7a).',
        '11 juni 2026: reeks navigatie- en blogpagina-fixes (twee vaste menu-rijen op desktop en mobiel, blogpagina gecentreerd, achtergrondlijnen subtieler).',
        'CHANGELOG.md, PARKEERPLAATS.md en docs/DECISIONS.md zijn als nieuwe, nog niet gecommitte bestanden aangemaakt.',
      ],
    },
    {
      kop: 'Loopt nog',
      punten: [
        'De drie nieuwe documentatiebestanden wachten op een eerste commit.',
        'Start van het zorg-erf zelf staat gepland voor 2027/2028, geen wijziging in die planning bekend vanuit dit project.',
      ],
    },
    {
      kop: 'Stil',
      punten: [
        'Sinds 4 augustus geen nieuwe commit meer op de website.',
      ],
    },
  ],
  vragen: [
    {
      id: 'documentatie-committen',
      tekst: 'CHANGELOG.md, PARKEERPLAATS.md en docs/DECISIONS.md staan al even klaar maar zijn nog niet gecommit. Gewoon meenemen in de eerstvolgende normale commit, of bewust apart houden?',
      opties: ['Gewoon meenemen', 'Apart laten voorlopig', 'Zelf bekijken'],
      vrij_antwoord: true,
    },
  ],
};

function log(regel) {
  const tijd = new Date().toISOString();
  const zin = `[${tijd}] ${regel}`;
  console.log(zin);
  try {
    mkdirSync(dirname(LOG_PAD), { recursive: true });
    appendFileSync(LOG_PAD, zin + '\n', 'utf8');
  } catch {
    // Een falend logboek mag het versturen zelf nooit blokkeren.
  }
}

function leesInhoud() {
  const idx = process.argv.indexOf('--inhoud');
  if (idx === -1) return INHOUD;
  const pad = process.argv[idx + 1];
  if (!pad) {
    throw new Error('--inhoud vereist een bestandspad, bijv. --inhoud pad\\naar\\inhoud.json');
  }
  return JSON.parse(readFileSync(pad, 'utf8'));
}

function valideer(inhoud) {
  const fouten = [];
  if (!Array.isArray(inhoud.kernfeiten) || inhoud.kernfeiten.length === 0) {
    fouten.push('kernfeiten ontbreekt of is leeg');
  }
  if (inhoud.secties && !Array.isArray(inhoud.secties)) {
    fouten.push('secties moet een lijst zijn');
  }
  if (inhoud.vragen) {
    if (!Array.isArray(inhoud.vragen)) {
      fouten.push('vragen moet een lijst zijn');
    } else {
      for (const v of inhoud.vragen) {
        if (!v.id || !v.tekst) fouten.push(`vraag zonder id/tekst: ${JSON.stringify(v)}`);
      }
    }
  }
  return fouten;
}

function tijdstempel(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function main() {
  let inhoud;
  try {
    inhoud = leesInhoud();
  } catch (fout) {
    log(`FOUT: kon inhoud niet lezen: ${fout.message}`);
    process.exitCode = 1;
    return;
  }

  const fouten = valideer(inhoud);
  if (fouten.length > 0) {
    log(`FOUT: kaart niet geschreven, validatie faalde: ${fouten.join('; ')}`);
    process.exitCode = 1;
    return;
  }

  if (!existsSync(POSTBUS)) {
    log(`FOUT: Kaarten-Postbus niet gevonden op ${POSTBUS} (Drive for Desktop niet gekoppeld op deze machine?)`);
    process.exitCode = 1;
    return;
  }

  const nu = new Date();
  const kaart = {
    project: PROJECTNAAM,
    titel: inhoud.titel || 'Erve Meander: update',
    datum: nu.toISOString().slice(0, 10),
    urgentie: inhoud.urgentie || 'normaal',
    kernfeiten: inhoud.kernfeiten,
    secties: inhoud.secties || [],
  };
  if (Array.isArray(inhoud.vragen) && inhoud.vragen.length > 0) {
    kaart.vragen = inhoud.vragen;
  }

  const bestandsnaam = `kaart-${PROJECTNAAM}-${tijdstempel(nu)}.json`;
  const doelpad = join(POSTBUS, bestandsnaam);
  writeFileSync(doelpad, JSON.stringify(kaart, null, 2), 'utf8');
  log(`Kaart geschreven: ${bestandsnaam}`);
}

main();
